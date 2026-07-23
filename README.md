# EcoSort-Search

Application web d'aide au tri selectif. L'utilisateur saisit le nom d'un produit, l'application recherche ce produit sur Jumia, puis un modele de Deep Learning (avec regles metier en complement) determine dans quelle poubelle le jeter.

---

## Lancer l'application avec Docker (recommande)

Depuis la racine du depot :

```bash
docker build -t ecosort .
docker run -p 8501:8501 ecosort
```

Une fois le conteneur demarre (le message `Uvicorn running on http://0.0.0.0:8501` s'affiche dans le terminal), ouvrez votre navigateur a l'adresse :

```
http://localhost:8501
```

**Important** : ne pas ouvrir `http://0.0.0.0:8501` dans le navigateur — `0.0.0.0` est l'adresse sur laquelle le serveur ecoute *a l'interieur* du conteneur, ce n'est pas une adresse joignable depuis l'exterieur. Utilisez toujours `localhost` (ou `127.0.0.1`) depuis votre machine.

Pour arreter l'application : `Ctrl+C` dans le terminal, puis si besoin `docker ps` + `docker stop <id>`.

### Avec docker-compose (equivalent)

```bash
docker-compose up -d --build
```
Puis, de la meme facon, ouvrez `http://localhost:8501`.

---

## Lancer en local sans Docker (developpement)

```bash
python -m venv .venv
source .venv/bin/activate        # ou .venv\Scripts\activate sous Windows
pip install -r requirements.txt
uvicorn src.webapp.main:app --reload --port 8501
```

Ouvrez `http://localhost:8501` (ici `127.0.0.1`/`localhost` fonctionne directement puisque le serveur tourne sur la machine elle-meme, pas dans un conteneur isole).

---

## Fonctionnement

1. **Recherche** : le nom de produit saisi est envoye a `/api/search`, qui interroge Jumia (`src/scraping/api.py`) et retourne jusqu'a 6 resultats (titre, prix, image).
2. **Selection** : en cliquant sur un produit, son nom et son image sont envoyes a `/api/classify`.
3. **Classification** (`src/webapp/inference.py`), dans l'ordre :
   - Regles mots-cles sur le nom du produit (`src/common/d3e_keywords.py`, `marron_keywords.py`, `bleue_keywords.py`) — couvrent les cas ou l'image seule ne suffit pas (chargeurs, produits d'hygiene, papeterie reliee).
   - En repli, le modele de Deep Learning (`models/modele_eco_sort_v2.keras`, transfer learning MobileNetV2) analyse la photo du produit.
4. **Resultat** : la categorie officielle (JAUNE / VERTE / BLEUE / D3E / MARRON) s'affiche en plein ecran avec la couleur correspondante.

## Structure du depot

```
Ecosort-search/
├── data/                       # dataset Kaggle (gitignore, jamais pousse)
├── models/                     # modele entraine (.keras) + class_names.json
├── notebooks/                  # EDA, entrainement, evaluation, fine-tuning
├── src/
│   ├── ml/                     # preparation des donnees, entrainement, evaluation
│   ├── scraping/                # scraper + API Jumia
│   ├── common/                  # regles mots-cles partagees (d3e, marron, bleue)
│   └── webapp/                  # FastAPI + interface web (static/)
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
└── CONTRIBUTING.md              # organisation d'equipe et strategie Git
```

## Equipe et contribution

Voir [`CONTRIBUTING.md`](./CONTRIBUTING.md) pour l'organisation de l'equipe, le workflow Git et les conventions de commit.
