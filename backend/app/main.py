import asyncio
import logging
from pathlib import Path

import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router
from app.api.occurrences import router as occurrences_router
from app.api.stats import router as stats_router
from app.api.me import router as me_router
from app.core.config import settings

logger = logging.getLogger("keepalive")

# ── Keep-alive (evita sleep no Render free tier) ───────────────────────────────
async def _keep_alive():
    url = getattr(settings, "BACKEND_URL", None)
    if not url:
        logger.info("BACKEND_URL nao definida — keep-alive desativado.")
        return
    ping_url = url.rstrip("/") + "/ping"
    async with httpx.AsyncClient(timeout=10) as client:
        while True:
            await asyncio.sleep(600)  # 10 minutos
            try:
                r = await client.get(ping_url)
                logger.info("keep-alive ping -> %s %s", ping_url, r.status_code)
            except Exception as e:
                logger.warning("keep-alive falhou: %s", e)


# ── Aplicação ──────────────────────────────────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "API REST para a plataforma UrbanReport — registro e gestão de ocorrências urbanas. "
        "Categorias: Animais Perdidos, Focos de Dengue, Problemas Urbanos."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ───────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ────────────────────────────────────────────────────────────────────
app.include_router(auth_router)
app.include_router(occurrences_router)
app.include_router(stats_router)
app.include_router(me_router)


@app.on_event("startup")
async def startup_event():
    asyncio.create_task(_keep_alive())


@app.get("/", tags=["Health"])
def health_check():
    return {"status": "ok", "app": settings.APP_NAME, "version": settings.APP_VERSION}


@app.get("/ping", tags=["Health"])
def ping():
    return "pong"
