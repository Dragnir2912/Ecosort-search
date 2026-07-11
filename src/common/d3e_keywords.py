"""
Regle mots-cles pour la categorie D3E (bac electronique).

Contexte : le dataset d'entrainement (Garbage Classification, 12 classes)
ne fournit qu'une seule classe electronique exploitable (`battery`), donc
le modele image seul ne peut pas reconnaitre un smartphone, un chargeur
ou des ecouteurs a partir d'une simple photo d'emballage. On complete
donc la detection D3E avec le nom du produit recupere lors du scraping
Jumia, qui est un signal beaucoup plus fiable pour ce type d'objets.

Strategie hybride recommandee dans le pipeline (webapp) :

    from src.common.d3e_keywords import is_d3e_by_keyword

    def classify_product(product_name: str, image) -> str:
        if is_d3e_by_keyword(product_name):
            return "d3e"
        return image_model.predict(image)  # jaune / verte / bleue / d3e / marron

Le modele image reste la source de verite pour les 4 autres categories ;
il garde aussi une classe `d3e` (basee sur `battery`) en filet de
securite pour les produits electroniques que la regle mots-cles
laisserait passer.
"""

import re
import unicodedata

D3E_KEYWORDS = [
    # Telephonie / informatique
    "smartphone", "telephone", "iphone", "samsung galaxy",
    "tablette", "ipad", "ordinateur", "laptop", "pc portable", "clavier",
    "souris", "webcam", "disque dur", "cle usb",
    # Audio / image
    "ecouteur", "casque audio", "enceinte", "haut-parleur",
    "television", "tv led", "camera",
    # Electromenager
    "mixeur", "blender", "grille-pain", "bouilloire", "micro-ondes",
    "aspirateur", "rasoir electrique", "seche-cheveux",
    "fer a repasser", "climatiseur",
    "ventilateur", "refrigerateur", "congelateur",
    "lave-linge", "lave-vaisselle",
    # Piles / batteries / chargeurs / accessoires
    "batterie", "pile", "chargeur", "power bank", "cable usb",
    "adaptateur secteur", "montre connectee",
    "smartwatch", "bracelet connecte", "console de jeux",
    "manette", "drone", "imprimante",
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
        _NORMALIZED_KEYWORDS = [_normalize(k) for k in D3E_KEYWORDS]
    return _NORMALIZED_KEYWORDS


def is_d3e_by_keyword(product_name):
    """
    Retourne True si le nom du produit (tel que recupere sur Jumia)
    correspond a un objet electronique/electromenager -> bac D3E.
    """
    if not product_name:
        return False
    normalized_name = _normalize(product_name)
    # \b sur le debut seulement : autorise les pluriels/declinaisons
    # ("ecouteur" doit matcher "ecouteurs") sans faux positifs en
    # plein milieu d'un mot non lie.
    for kw in _keywords_normalized():
        if re.search(r"\b" + re.escape(kw), normalized_name):
            return True
    return False


if __name__ == "__main__":
    tests = [
        "Chargeur rapide 20W USB-C",
        "Bouteille de jus de fruit 1L",
        "Ecouteurs sans fil Bluetooth",
        "Cahier 200 pages grands carreaux",
        "Mixeur plongeant 800W",
    ]
    for t in tests:
        print("%-40s -> D3E=%s" % (t, is_d3e_by_keyword(t)))
