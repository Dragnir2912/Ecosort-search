# Organisation d'équipe & Stratégie Git — Projet EcoSort-Search

Ce document définit comment l'équipe de 3 travaille sur le dépôt pour respecter les consignes du prof (3 branches, zéro push direct sur `main`, PR obligatoires, `.gitignore` propre) tout en suivant les pratiques standards des équipes tech.

---

## 1. Répartition des rôles et des branches

Le projet a une séparation naturelle en 3 blocs de travail (Jalon 1 + les deux volets du Jalon 2), un par étudiant.

| Rôle | Scope de commit | Responsabilité |
| :--- | :--- | :--- |
| **ML Engineer** | `ml` | Dataset Kaggle, prétraitement, CNN/Transfer Learning, export `modele_eco_sort.keras` |
| **Scraping Engineer** | `scraping` | Scraper Jumia (requête, extraction 3-5 résultats), robustesse (timeouts, erreurs) |
| **Web/DevOps Engineer** | `webapp`, `docker` | Interface Streamlit/Flask, intégration modèle + scraper, `Dockerfile` / `docker-compose.yml` |

**Pas de branche longue durée par personne.** On a testé l'idée au démarrage (une branche `ml-model`/`scraping`/`webapp-docker` par étudiant, dont on partirait pour créer des sous-branches), mais à l'usage elle n'apportait rien : toutes les Pull Requests partent directement vers `main` (voir section 2, GitHub Flow), donc une branche intermédiaire ne reçoit jamais aucun merge et reste juste une coquille vide. On l'a abandonnée pour éviter la confusion (renommer/supprimer une branche de rôle a d'ailleurs fermé une PR par erreur).

Chaque étudiant part donc **directement de `main` à jour** pour chaque tâche :

```bash
git checkout main
git pull origin main
git checkout -b feature/ml-training-cnn
```

Si une tâche dépend d'une autre PR pas encore mergée, on part de cette branche non mergée plutôt que de `main` (voir section 2), pour ne pas dupliquer du travail en attente de revue.

Convention de nommage : `type/scope-description`, en minuscules, tirets.
Types : `feature/`, `fix/`, `docs/`, `chore/`, `refactor/`, `test/`.
Le `scope` dans le nom de la branche identifie le domaine (`ml`, `scraping`, `webapp`, `docker`), pas une branche de rôle à part.

Exemples :
```
feature/ml-preprocessing
feature/ml-training-cnn
feature/scraping-jumia-parser
feature/webapp-streamlit-ui
feature/docker-compose
```

---

## 2. Workflow : GitHub Flow (pas de Git Flow)

Pour une équipe de 3 sur 3 semaines, le **Git Flow** classique (develop/release/hotfix) est trop lourd. On utilise le **GitHub Flow**, standard dans la plupart des équipes produit :

1. `main` = toujours stable et déployable (c'est ce que le prof clone).
2. Toute tâche part d'une branche courte créée depuis `main` à jour (ou depuis une autre branche de tâche si dépendance non mergée, voir section 1).
3. Commits atomiques et fréquents pendant le travail.
4. Dès qu'une fonctionnalité est prête (même partielle) : **Pull Request** vers `main`.
5. Revue obligatoire par **au moins un autre membre** (jamais l'auteur qui s'auto-approuve).
6. Une fois approuvée : merge (squash de préférence pour garder `main` lisible), suppression de la branche.

**Règles de protection GitHub à activer sur `main` (Settings → Branches) :**
- Require a pull request before merging
- Require at least 1 approving review
- Require branches to be up to date before merging
- Interdire le push direct (y compris pour les admins si possible)

---

## 3. Convention de commits (Conventional Commits)

Format : `type(scope): description au présent, en français ou anglais, court`

Types utilisés : `feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `style`, `perf`
Scopes suggérés : `ml`, `scraping`, `webapp`, `docker`, `data`, `ci`

Exemples concrets pour ce projet :
```
feat(ml): ajoute le prétraitement des images du dataset Garbage Classification
feat(ml): entraîne le modèle MobileNetV2 sur les 5 classes officielles
feat(scraping): implémente le scraper Jumia avec BeautifulSoup
fix(scraping): gère le cas où la recherche Jumia ne retourne aucun résultat
feat(webapp): ajoute le changement de couleur d'écran selon la poubelle prédite
feat(docker): ajoute le Dockerfile et docker-compose.yml
docs(readme): ajoute les instructions de build/run Docker
chore(gitignore): exclut .venv, __pycache__ et le dataset brut
test(ml): ajoute des tests sur la fonction de mapping classe → poubelle
```

Règles :
- Un commit = un changement logique (pas de "fix + feature + typo" dans le même commit).
- Message à l'impératif, pas de "j'ai fait...".
- Committer souvent (plusieurs fois par session de travail) : ça prouve la contribution individuelle de chacun (point 5 des consignes du prof).

---

## 4. Pull Requests : gabarit et checklist de revue

**Titre de PR** : reprend le type/scope, ex. `feat(webapp): intégration scraping + modèle`

**Description type** (à mettre en template `.github/pull_request_template.md`) :
```markdown
## Quoi
Court résumé du changement

## Pourquoi
Lien avec le jalon / l'issue

## Comment tester
Étapes pour reproduire / vérifier

## Checklist
- [ ] Le code s'exécute sans erreur localement
- [ ] Pas de dataset ni de .venv commité
- [ ] Docstrings / commentaires sur les fonctions clés
- [ ] Testé avec `docker build` si impact Docker
```

**Checklist du relecteur** :
- Le scope de la PR correspond au titre (pas de fichiers hors-sujet).
- Pas de secrets/API keys en dur.
- Respect de la structure du repo (section 5).
- Au moins un commentaire ou une question avant d'approuver si quelque chose n'est pas clair — la revue doit être réelle, pas un "LGTM" automatique.

---

## 5. Structure du dépôt

```
ecosort-search/
├── data/                    # dataset Kaggle brut (GITIGNORÉ, jamais poussé)
├── models/                  # modele_eco_sort.keras (voir note Git LFS ci-dessous)
├── notebooks/                # exploration, entraînement, évaluation
├── src/
│   ├── ml/                   # prétraitement, training, inference
│   ├── scraping/              # scraper Jumia
│   └── webapp/                # app Streamlit / Flask
├── tests/
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
├── .gitignore
├── README.md
└── CONTRIBUTING.md            # ce fichier
```

**Note sur `models/modele_eco_sort.keras`** : s'il dépasse quelques dizaines de Mo, ne pas le committer brut sur GitHub (limite 100 Mo, et alourdit le repo). Options : Git LFS, ou script `download_model.sh` qui télécharge depuis un lien (Drive, Hugging Face, release GitHub).

---

## 6. `.gitignore` minimal exigé dès le jour 1

```gitignore
# Environnements Python
.venv/
venv/
__pycache__/
*.pyc

# Dataset (plusieurs Go, jamais sur GitHub)
data/
*.zip

# Modèle si volumineux
models/*.keras
models/*.h5

# Divers
.env
.DS_Store
.ipynb_checkpoints/
*.log
```

---

## 7. Suivi de projet (Kanban)

Utiliser **GitHub Projects** (gratuit, intégré) avec colonnes `To Do / In Progress / In Review / Done`. Une issue par tâche, assignée à une personne, liée à sa PR (`Closes #12` dans la description de la PR). Ça donne au prof une trace claire de qui a fait quoi, en plus des commits.

Milestones GitHub : `Jalon 1 - ML` et `Jalon 2 - Scraping & Déploiement`.

---

## 8. Planning suggéré (deadline : 25/07/2026 23:59:59)

| Période | Objectif |
| :--- | :--- |
| **6 → 12 juillet** (S1) | Setup repo + branches + .gitignore + template PR ; EDA dataset ; premier prototype scraper Jumia ; maquette UI (mock, sans modèle) |
| **13 → 19 juillet** (S2) | Entraînement + validation du modèle (CNN ou transfer learning) ; scraper robuste (gestion erreurs) ; intégration scraping → UI |
| **20 → 23 juillet** (S3) | Intégration modèle → UI complète ; Dockerfile + docker-compose fonctionnels ; tests bout-en-bout ; README |
| **24 → 25 juillet** | Revue finale des PR, nettoyage du repo, soumission |

Vu le barème de bonus (0,5 pt/jour d'avance, max 5 pts), viser une soumission le **20 juillet** donne déjà +2,5 pts de bonus pour un risque minimal — objectif réaliste à fixer en équipe dès le départ.

---

## 9. Répartition de la charge (contribution individuelle notée)

Puisque chacun est noté individuellement (point 5 des consignes), chacun doit :
- committer régulièrement sur ses propres branches de tâche (pas de gros commit unique en fin de projet),
- ouvrir ses propres PR plutôt que de laisser un seul membre tout merger,
- relire au moins autant de PR qu'il en ouvre.

Un rapide point d'équipe (15 min, 2-3 fois/semaine) suffit pour se répartir les tâches et éviter les conflits de merge tardifs.
