"""
main.py - Application web EcoSort-Search (Jalon 2).

Sert l'interface (static/index.html) et expose deux endpoints :
- GET  /api/search    -> proxy vers le scraper Jumia (src/scraping/api.py)
- POST /api/classify  -> pipeline de classification (src/webapp/inference.py)

Lancement local :
    uvicorn src.webapp.main:app --reload --port 8501

Lancement Docker : voir Dockerfile (port 8501 impose par les consignes du projet).
"""

import logging
from pathlib import Path

import requests
from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from src.scraping.api import search_jumia
from src.webapp.inference import CATEGORY_INFO, classify_product

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ecosort-webapp")

STATIC_DIR = Path(__file__).resolve().parent / "static"

app = FastAPI(title="EcoSort-Search", version="1.0.0")
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


class ClassifyRequest(BaseModel):
    product_name: str
    image_url: str | None = None


@app.get("/")
async def index():
    return FileResponse(STATIC_DIR / "index.html")


@app.get("/api/search")
async def api_search(
    q: str = Query(..., min_length=2, description="Mot-cle a rechercher"),
    limit: int = Query(5, ge=1, le=10),
):
    logger.info("Recherche Jumia : q=%s limit=%s", q, limit)
    try:
        produits = search_jumia(q, limit=limit)
    except Exception as exc:
        logger.exception("Erreur scraping Jumia")
        raise HTTPException(status_code=502, detail="Le scraper Jumia est indisponible pour le moment.") from exc

    return {"query": q, "count": len(produits), "products": produits}


@app.post("/api/classify")
async def api_classify(payload: ClassifyRequest):
    image_bytes = None
    if payload.image_url:
        try:
            resp = requests.get(payload.image_url, timeout=8)
            resp.raise_for_status()
            image_bytes = resp.content
        except Exception:
            logger.warning("Impossible de recuperer l'image %s, repli sur les mots-cles/marron", payload.image_url)

    try:
        result = classify_product(payload.product_name, image_bytes)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return result


@app.get("/api/categories")
async def api_categories():
    return {"categories": CATEGORY_INFO}


@app.get("/api/health")
async def health():
    return {"status": "ok"}
