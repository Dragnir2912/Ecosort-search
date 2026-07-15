"""
Regle mots-cles pour la categorie BLEUE (papier graphique), en
complement du modele image.

Contexte : l'evaluation sur photos reelles Jumia a montre que le
modele echoue totalement sur cette categorie (0/3) quand le produit
est un carnet a spirale ou un article de papeterie relie. Le dataset
Kaggle `paper` ne contient que des feuilles/pages plates (blanches ou
froissees), jamais d'objet avec reliure/spirale metallique visible —
le modele confond alors la spirale avec du D3E. C'est le meme type de
limite structurelle que pour le D3E (piles) et le MARRON (hygiene) :
pas un manque d'augmentation, un manque de categorie de donnees.

Stratégie hybride complete recommandee dans le pipeline (webapp) :

    from src.common.d3e_keywords import is_d3e_by_keyword
    from src.common.marron_keywords import is_marron_by_keyword
    from src.common.bleue_keywords import is_bleue_by_keyword

    def classify_product(product_name: str, image) -> str:
        if is_d3e_by_keyword(product_name):
            return "d3e"
        if is_marron_by_keyword(product_name):
            return "marron"
        if is_bleue_by_keyword(product_name):
            return "bleue"
        return image_model.predict(image)  # jaune / verte / bleue / d3e / marron
"""

import re
import unicodedata

PAPETERIE_KEYWORDS = [
    "cahier", "carnet", "bloc-notes", "bloc notes", "sketchbook",
    "sketch book", "agenda", "calepin", "carnet a spirale",
    "prospectus", "magazine", "journal", "revue", "livre",
    "enveloppe", "papier a lettre", "papier cadeau", "brochure",
    "catalogue", "annuaire", "carte postale",
]

_NORMALIZED_KEYWORDS = None


def _normalize(text: str) -> str:
    text = text.lower()
    text = unicodedata.normalize("NFKD", text)
    text = "".join(c for c in text if not unicodedata.combining(c))
    return text


def _keywords_normalized():
    global _NORMALIZED_KEYWORDS
    if _NORMALIZED_KEYWORDS is None:
        _NORMALIZED_KEYWORDS = [_normalize(k) for k in PAPETERIE_KEYWORDS]
    return _NORMALIZED_KEYWORDS


def is_bleue_by_keyword(product_name):
    """
    Retourne True si le nom du produit correspond a du papier
    graphique/papeterie -> bac BLEUE, meme relie/avec spirale
    metallique (que le modele image confond souvent avec du D3E).
    """
    if not product_name:
        return False
    normalized_name = _normalize(product_name)
    for kw in _keywords_normalized():
        if re.search(r"\b" + re.escape(kw), normalized_name):
            return True
    return False


if __name__ == "__main__":
    tests = [
        "Carnet a spirale 16K 160g",
        "Sketch Book 40 feuilles",
        "Enveloppes kraft avec coeur x10",
        "Chargeur rapide 20W USB-C",
        "Bouteille d'eau minerale 1.5L",
    ]
    for t in tests:
        print("%-40s -> BLEUE=%s" % (t, is_bleue_by_keyword(t)))
