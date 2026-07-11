"""
Entrainement du modele de classification EcoSort (5 categories officielles)
par transfer learning sur MobileNetV2, en 2 phases :

  Phase 1 : backbone gele, on entraine uniquement la tete de classification.
  Phase 2 : on degele les dernieres couches du backbone, fine-tuning a
            tres faible learning rate.

L'augmentation de donnees est volontairement agressive (contraste,
luminosite, zoom, translation) pour reduire l'ecart entre les photos
"propres" du dataset Kaggle et les photos e-commerce (Jumia) que le
modele verra en production. Voir aussi `evaluate_real_world.py` pour
mesurer cet ecart sur un petit set de vraies photos produits.

Prerequis : avoir lance `prepare_dataset.py` avant (data/processed/{train,val}).

Usage:
    python src/ml/train.py \
        --data-dir data/processed \
        --output models/modele_eco_sort.keras \
        --epochs-head 10 \
        --epochs-finetune 10

Note format de sauvegarde : on utilise le format natif Keras (`.keras`)
plutot que l'ancien HDF5 (`.h5`). Le HDF5 echoue a serialiser le modele
ici (TypeError: cannot pickle 'module' object) a cause de l'appel a
`tf.keras.applications.mobilenet_v2.preprocess_input` insere comme
operation dans le graphe ; le format `.keras` n'a pas ce probleme et
c'est celui recommande par l'equipe Keras depuis 2023.
"""

import argparse
import json
from pathlib import Path

import tensorflow as tf
from tensorflow.keras import layers, models

IMG_SIZE = (224, 224)
BATCH_SIZE = 32


def load_datasets(data_dir: Path):
    train_ds = tf.keras.utils.image_dataset_from_directory(
        data_dir / "train",
        image_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        label_mode="categorical",
        shuffle=True,
        seed=42,
    )
    val_ds = tf.keras.utils.image_dataset_from_directory(
        data_dir / "val",
        image_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        label_mode="categorical",
        shuffle=False,
    )
    class_names = train_ds.class_names  # ordre alphabetique : bleue, d3e, jaune, marron, verte
    autotune = tf.data.AUTOTUNE
    train_ds = train_ds.prefetch(autotune)
    val_ds = val_ds.prefetch(autotune)
    return train_ds, val_ds, class_names


def build_augmentation():
    """
    Augmentation renforcee pour rapprocher les images Kaggle (fond neutre,
    objet seul) du style des photos e-commerce Jumia (cadrage variable,
    eclairage different, packaging avec logos/textes).
    """
    return models.Sequential(
        [
            layers.RandomFlip("horizontal"),
            layers.RandomRotation(0.15),
            layers.RandomZoom(0.2),
            layers.RandomTranslation(0.1, 0.1),
            layers.RandomContrast(0.3),
            layers.RandomBrightness(0.2),
        ],
        name="data_augmentation",
    )


def build_model(num_classes: int):
    augmentation = build_augmentation()

    base_model = tf.keras.applications.MobileNetV2(
        input_shape=IMG_SIZE + (3,),
        include_top=False,
        weights="imagenet",
    )
    base_model.trainable = False  # phase 1 : backbone gele

    inputs = tf.keras.Input(shape=IMG_SIZE + (3,))
    x = augmentation(inputs)
    # Equivalent a tf.keras.applications.mobilenet_v2.preprocess_input
    # ([0, 255] -> [-1, 1]), mais via une vraie couche Keras serialisable
    # (evite le bug de sauvegarde HDF5 lie a l'appel de fonction du module).
    x = layers.Rescaling(scale=1.0 / 127.5, offset=-1.0)(x)
    x = base_model(x, training=False)
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.Dropout(0.3)(x)
    outputs = layers.Dense(num_classes, activation="softmax")(x)

    model = tf.keras.Model(inputs, outputs)
    return model, base_model


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data-dir", type=Path, default=Path("data/processed"))
    parser.add_argument("--output", type=Path, default=Path("models/modele_eco_sort.keras"))
    parser.add_argument("--epochs-head", type=int, default=10)
    parser.add_argument("--epochs-finetune", type=int, default=10)
    parser.add_argument("--finetune-layers", type=int, default=30,
                         help="Nombre de couches finales du backbone a degeler en phase 2")
    args = parser.parse_args()

    train_ds, val_ds, class_names = load_datasets(args.data_dir)
    print(f"Classes (ordre utilise par le modele) : {class_names}")

    model, base_model = build_model(num_classes=len(class_names))

    # --- Phase 1 : entrainement de la tete uniquement ---
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )
    print("\n=== Phase 1 : entrainement de la tete (backbone gele) ===")
    model.fit(train_ds, validation_data=val_ds, epochs=args.epochs_head)

    # --- Phase 2 : fine-tuning des dernieres couches du backbone ---
    base_model.trainable = True
    for layer in base_model.layers[:-args.finetune_layers]:
        layer.trainable = False

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-5),  # LR tres faible
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )
    print(f"\n=== Phase 2 : fine-tuning des {args.finetune_layers} dernieres couches ===")
    model.fit(train_ds, validation_data=val_ds, epochs=args.epochs_finetune)

    # --- Evaluation finale sur le val split Kaggle ---
    loss, acc = model.evaluate(val_ds)
    print(f"\nVal Kaggle -> loss={loss:.4f} accuracy={acc:.4f}")

    # --- Sauvegarde du modele + de l'ordre des classes ---
    args.output.parent.mkdir(parents=True, exist_ok=True)
    model.save(args.output)

    class_names_path = args.output.parent / "class_names.json"
    with open(class_names_path, "w") as f:
        json.dump(class_names, f, ensure_ascii=False, indent=2)

    print(f"\nModele sauvegarde : {args.output}")
    print(f"Ordre des classes sauvegarde : {class_names_path}")
    print(
        "\nRappel : lancez evaluate_real_world.py sur un petit set de vraies "
        "photos Jumia pour verifier l'ecart de performance Kaggle -> reel."
    )


if __name__ == "__main__":
    main()
