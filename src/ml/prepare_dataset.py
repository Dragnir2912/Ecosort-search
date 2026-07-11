"""
Réorganise le dataset Kaggle "Garbage Classification (12 classes)"
(mostafaabla/garbage-classification) en 5 catégories officielles
de tri définies par le prof, avec un split train/val.

Usage:
    python src/ml/prepare_dataset.py \
        --source data/garbage_classification \
        --dest data/processed \
        --val-split 0.15 \
        --seed 42

Structure attendue en entrée (12 dossiers, un par classe brute) :
    data/garbage_classification/
        battery/ biological/ brown-glass/ cardboard/ clothes/
        green-glass/ metal/ paper/ plastic/ shoes/ trash/ white-glass/

Structure produite en sortie (5 classes officielles, prêtes pour
tf.keras.utils.image_dataset_from_directory ou ImageDataGenerator) :
    data/processed/
        train/{jaune,verte,bleue,d3e,marron}/...
        val/{jaune,verte,bleue,d3e,marron}/...

IMPORTANT — limite connue du modèle sur la classe D3E :
Le dataset ne contient qu'une seule classe électronique (`battery`).
Un modèle entraîné dessus ne reconnaîtra donc pas des smartphones,
chargeurs ou écouteurs sur simple photo d'emballage — ces objets ne
ressemblent pas à des piles. Le D3E doit être complété côté produit
(nom scrapé sur Jumia) par une règle mots-clés : voir
`src/common/d3e_keywords.py`. Le modèle image reste responsable des
4 autres catégories (jaune, verte, bleue, marron) où les 11 classes
brutes fournissent des exemples visuels pertinents.
"""

import argparse
import random
import shutil
from pathlib import Path

# Mapping classes brutes du dataset -> 5 catégories officielles du prof
CLASS_MAPPING = {
    "plastic": "jaune",
    "metal": "jaune",
    "cardboard": "jaune",
    "brown-glass": "verte",
    "green-glass": "verte",
    "white-glass": "verte",
    "paper": "bleue",
    "battery": "d3e",
    "trash": "marron",
    "biological": "marron",
    "clothes": "marron",
    "shoes": "marron",
}

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png"}


def collect_images(source: Path, raw_class: str) -> list[Path]:
    class_dir = source / raw_class
    if not class_dir.is_dir():
        raise FileNotFoundError(
            f"Dossier introuvable : {class_dir} "
            f"(vérifie --source et le nom exact du dossier téléchargé)"
        )
    return [p for p in class_dir.iterdir() if p.suffix.lower() in IMAGE_EXTENSIONS]


def reorganize(source: Path, dest: Path, val_split: float, seed: int) -> None:
    random.seed(seed)

    # Regroupe les chemins d'images par catégorie officielle
    grouped: dict[str, list[Path]] = {}
    for raw_class, official_class in CLASS_MAPPING.items():
        images = collect_images(source, raw_class)
        grouped.setdefault(official_class, []).extend(images)
        print(f"  {raw_class:15s} -> {official_class:8s} ({len(images)} images)")

    for official_class, images in grouped.items():
        random.shuffle(images)
        n_val = int(len(images) * val_split)
        val_images = images[:n_val]
        train_images = images[n_val:]

        for split_name, split_images in [("train", train_images), ("val", val_images)]:
            out_dir = dest / split_name / official_class
            out_dir.mkdir(parents=True, exist_ok=True)
            for img_path in split_images:
                shutil.copy2(img_path, out_dir / img_path.name)

        print(
            f"[{official_class}] total={len(images)} "
            f"train={len(train_images)} val={len(val_images)}"
        )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, default=Path("data/garbage_classification"))
    parser.add_argument("--dest", type=Path, default=Path("data/processed"))
    parser.add_argument("--val-split", type=float, default=0.15)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    if args.dest.exists():
        print(f"'{args.dest}' existe déjà : suppression avant régénération.")
        shutil.rmtree(args.dest)

    print(f"Réorganisation de {args.source} -> {args.dest}\n")
    reorganize(args.source, args.dest, args.val_split, args.seed)
    print("\nTerminé.")


if __name__ == "__main__":
    main()
