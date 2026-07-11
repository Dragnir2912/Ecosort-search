"""
Regle mots-cles pour forcer la categorie MARRON (residuel) sur les
produits d'hygiene/cosmetique, en complement du modele image.

Contexte : contrairement au D3E (ou le probleme est un manque de
donnees d'entrainement), ce cas est une limite structurelle du
modele image. Une bouteille de gel douche ou un coffret de savon est
visuellement indiscernable d'une bouteille "jaune" (meme plastique,
meme forme) ou d'un emballage carton "jaune"/"verte" (meme carton).
La regle officielle du prof classe ces produits en MARRON par
convention d'usage (residus, produit non rince), pas par matiere
apparente -> aucune quantite d'images ou d'augmentation ne peut
apprendre ca a un classifieur d'image. Le nom du produit scrape est
le seul signal fiable.

Stratégie hybride complete recommandee dans le pipeline (webapp) :

    from src.common.d3e_keywords import is_d3e_by_keyword
    from src.common.marron_keywords import is_marron_by_keyword

    def classify_product(product_name: str, image) -> str:
        if is_d3e_by_keyword(product_name):
            return "d3e"
        if is_marron_by_keyword(product_name):
            return "marron"
        return image_model.predict(image)  # jaune / verte / bleue / d3e / marron

L'ordre des verifications importe peu ici (les deux listes de
mots-cles ne se chevauchent pas), mais il est plus lisible de garder
le meme ordre que dans le tableau officiel du prof.
"""

import re
import unicodedata

HYGIENE_KEYWORDS = [
    # Soins du corps / cosmetique
    "savon", "gel douche", "shampoing", "shampooing", "apres-shampoing",
    "apres shampoing", "deodorant", "parfum", "eau de toilette",
    "creme", "lotion", "huile corporelle", "body oil", "vaseline",
    "baume", "gommage", "masque visage", "mousse a raser",
    "apres-rasage", "apres rasage", "aftershave",
    # Hygiene dentaire
    "dentifrice", "brosse a dent", "brosse a dents", "bain de bouche",
    "fil dentaire",
    # Hygiene feminine / bebe / jetable
    "serviette hygienique", "tampon hygienique", "protege-slip",
    "protege slip", "couche bebe", "couche culotte", "lingette",
    "coton-tige", "coton tige", "papier toilette", "mouchoir",
    "rasoir jetable",
]

_NORMALIZED_KEYWORDS = None


def _normalize(text: str) -> str:
    """minuscule + suppression des accents, pour un matching robuste."""
    text = text.lower()
    text = unicodedata.normalize("NFKD", text)
    text = "".join(c for c in text if not unicodedata.combining(c))
    return text


def _keywords_normalized():
    global _NORMALIZED_KEYWORDS
    if _NORMALIZED_KEYWORDS is None:
        _NORMALIZED_KEYWORDS = [_normalize(k) for k in HYGIENE_KEYWORDS]
    return _NORMALIZED_KEYWORDS


def is_marron_by_keyword(product_name):
    """
    Retourne True si le nom du produit correspond a un article
    d'hygiene/cosmetique -> bac MARRON, quel que soit son emballage
    apparent (plastique, carton...).
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
        "Vaseline Intensive Care Vitamin B3 Body Oil 200ml",
        "Savon Gold Skin a la bave d'escargot X2",
        "Bouteille d'eau minerale 1.5L",
        "Cahier 200 pages grands carreaux",
        "Shampoing anti-pelliculaire 400ml",
        "Chargeur rapide 20W USB-C",
    ]
    for t in tests:
        print("%-55s -> MARRON=%s" % (t, is_marron_by_keyword(t)))
