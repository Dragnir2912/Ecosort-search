"""
inference.py - Pipeline de classification EcoSort (Jalon 2 - integration).

Combine, dans l'ordre :
1. Regles mots-cles (D3E, MARRON/hygiene, BLEUE/papeterie) sur le nom du
   produit scrape - couvrent les cas ou aucune image ne peut suffire
   (voir docstrings de src/common/*_keywords.py pour le detail).
2. Modele image (MobileNetV2 fine-tune) en repli pour tout le reste.

C'est le seul point d'entree que doit utiliser la webapp :

    from src.webapp.inference import classify_product
    result = classify_product(product_name="Chargeur rapide 65W", image_bytes=...)
    # {"category": "d3e", "label": "Bac Electronique (D3E)", "color": "#00E5FF",
    #  "source": "keyword", "confidence": 1.0}
"""

import io
import json
import logging
from pathlib import Path

import numpy as np
from PIL import Image

from src.common.d3e_keywords import is_d3e_by_keyword
from src.common.marron_keywords import is_marron_by_keyword
from src.common.bleue_keywords import is_bleue_by_keyword

logger = logging.getLogger("ecosort-inference")

IMG_SIZE = (224, 224)
MODELS_DIR = Path(__file__).resolve().parents[2] / "models"

# Preference : le modele fine-tune (v2) s'il existe, sinon le modele de base.
_MODEL_CANDIDATES = [
    MODELS_DIR / "modele_eco_sort_v2.keras",
    MODELS_DIR / "modele_eco_sort.keras",
]
_CLASS_NAMES_PATH = MODELS_DIR / "class_names.json"
_DEFAULT_CLASS_NAMES = ["bleue", "d3e", "jaune", "marron", "verte"]

# Metadonnees d'affichage par categorie officielle
CATEGORY_INFO = {
    "jaune": {"label": "Poubelle JAUNE", "color": "#FFD400", "glow": "#FFE873"},
    "verte": {"label": "Poubelle VERTE", "color": "#00E676", "glow": "#7CFFB2"},
    "bleue": {"label": "Poubelle BLEUE", "color": "#00AEEF", "glow": "#7FE0FF"},
    "d3e": {"label": "Bac Electronique (D3E)", "color": "#00F0FF", "glow": "#B2FBFF"},
    "marron": {"label": "Poubelle MARRON / NOIRE", "color": "#D97757", "glow": "#F0B79C"},
}

_model = None
_class_names = None


def _load_model():
    """Charge le modele au premier appel (lazy load), le garde en memoire ensuite."""
    global _model, _class_names
    if _model is not None:
        return _model, _class_names

    import tensorflow as tf

    model_path = next((p for p in _MODEL_CANDIDATES if p.exists()), None)
    if model_path is None:
        raise FileNotFoundError(
            f"Aucun modele trouve dans {MODELS_DIR} "
            f"(cherche : {[p.name for p in _MODEL_CANDIDATES]})"
        )

    logger.info("Chargement du modele : %s", model_path)
    _model = tf.keras.models.load_model(model_path)

    if _CLASS_NAMES_PATH.exists():
        with open(_CLASS_NAMES_PATH) as f:
            _class_names = json.load(f)
    else:
        logger.warning(
            "class_names.json introuvable, utilisation de l'ordre par defaut %s. "
            "A committer depuis le notebook d'entrainement pour eviter tout risque "
            "de decalage de classes.",
            _DEFAULT_CLASS_NAMES,
        )
        _class_names = _DEFAULT_CLASS_NAMES

    return _model, _class_names


def _predict_from_image(image_bytes: bytes):
    model, class_names = _load_model()

    image = Image.open(io.BytesIO(image_bytes)).convert("RGB").resize(IMG_SIZE)
    array = np.expand_dims(np.array(image, dtype=np.float32), axis=0)

    predictions = model.predict(array, verbose=0)[0]
    idx = int(np.argmax(predictions))
    return class_names[idx], float(predictions[idx])


def classify_product(product_name: str, image_bytes: bytes | None = None) -> dict:
    """
    Retourne la categorie officielle d'un produit + metadonnees d'affichage.

    Priorite : mots-cles (deterministe, couvre les angles morts du modele
    image) puis modele image en repli si aucune regle ne matche et qu'une
    image est disponible.
    """
    category = None
    source = None
    confidence = 1.0

    if is_d3e_by_keyword(product_name):
        category, source = "d3e", "keyword"
    elif is_marron_by_keyword(product_name):
        category, source = "marron", "keyword"
    elif is_bleue_by_keyword(product_name):
        category, source = "bleue", "keyword"
    elif image_bytes:
        category, confidence = _predict_from_image(image_bytes)
        source = "model"
    else:
        category, source, confidence = "marron", "fallback", 0.0

    info = CATEGORY_INFO[category]
    return {
        "category": category,
        "label": info["label"],
        "color": info["color"],
        "glow": info["glow"],
        "source": source,
        "confidence": round(confidence, 4),
    }
