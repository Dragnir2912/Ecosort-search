"""
Evalue le modele entraine (train.py) sur un petit set de VRAIES photos
produits (ex: captures d'ecran de fiches Jumia), separement du val split
Kaggle, pour mesurer l'ecart entre les images "propres" d'entrainement
et les images e-commerce reelles vues en production.

Preparation attendue (a faire une fois, a la main) :
    Constituez 3-4 images par categorie officielle (15-20 images au
    total), issues de vraies fiches produit Jumia, rangees ainsi :

    data/real_world_test/
        bleue/   (ex: prospectus, magazine...)
        d3e/     (ex: chargeur, ecouteurs...)
        jaune/   (ex: bouteille plastique, canette...)
        marron/  (ex: sachet plastique souple...)
        verte/   (ex: bouteille en verre...)

Usage:
    python src/ml/evaluate_real_world.py \
        --model models/modele_eco_sort.keras \
        --class-names models/class_names.json \
        --data-dir data/real_world_test
"""

import argparse
import json
from pathlib import Path

import numpy as np
import tensorflow as tf

IMG_SIZE = (224, 224)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model", type=Path, default=Path("models/modele_eco_sort.keras"))
    parser.add_argument("--class-names", type=Path, default=Path("models/class_names.json"))
    parser.add_argument("--data-dir", type=Path, default=Path("data/real_world_test"))
    args = parser.parse_args()

    if not args.data_dir.exists():
        raise FileNotFoundError(
            f"'{args.data_dir}' n'existe pas encore. Constituez d'abord un petit "
            f"set de vraies photos Jumia (voir le docstring de ce script)."
        )

    with open(args.class_names) as f:
        class_names = json.load(f)

    model = tf.keras.models.load_model(args.model)

    ds = tf.keras.utils.image_dataset_from_directory(
        args.data_dir,
        image_size=IMG_SIZE,
        batch_size=16,
        label_mode="categorical",
        shuffle=False,
    )
    real_class_names = ds.class_names
    if real_class_names != class_names:
        print(
            "ATTENTION : l'ordre/les noms des dossiers de real_world_test "
            f"({real_class_names}) ne correspond pas exactement a l'ordre "
            f"utilise a l'entrainement ({class_names}). Verifiez les noms "
            "des dossiers."
        )

    y_true, y_pred = [], []
    for images, labels in ds:
        preds = model.predict(images, verbose=0)
        y_true.extend(np.argmax(labels.numpy(), axis=1))
        y_pred.extend(np.argmax(preds, axis=1))

    y_true = np.array(y_true)
    y_pred = np.array(y_pred)
    accuracy = (y_true == y_pred).mean()

    print(f"\nAccuracy sur photos reelles Jumia : {accuracy:.2%} ({len(y_true)} images)")

    # Matrice de confusion simple, lisible en console
    n = len(class_names)
    confusion = np.zeros((n, n), dtype=int)
    for t, p in zip(y_true, y_pred):
        confusion[t, p] += 1

    print("\nMatrice de confusion (lignes = vraie classe, colonnes = predite) :")
    header = "        " + " ".join(f"{c[:6]:>6s}" for c in class_names)
    print(header)
    for i, row in enumerate(confusion):
        print(f"{class_names[i][:6]:>6s}  " + " ".join(f"{v:6d}" for v in row))

    print(
        "\nSi l'accuracy ici est nettement plus basse que le val Kaggle "
        "(train.py), c'est le signe d'un ecart de domaine reel -> "
        "renforcer l'augmentation de donnees ou ajouter davantage "
        "d'exemples e-commerce a l'entrainement."
    )


if __name__ == "__main__":
    main()
