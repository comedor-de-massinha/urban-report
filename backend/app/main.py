import asyncio
import logging
from pathlib import Path

import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api.auth import router as auth_router
from app.api.occurrences import router as occurrences_router
from app.api.stats import router as stats_router
from app.api.me import router as me_router
from app.core.config import settings
from app.core.database import SessionLocal

logger = logging.getLogger("keepalive")

# ── Keep-alive (evita sleep no Render free tier E mantém Supabase ativo) ───────
async def _keep_alive():
    url = getattr(settings, "BACKEND_URL", None)
    if not url:
        logger.info("BACKEND_URL nao definida — keep-alive desativado.")
        return
    
    ping_url = url.rstrip("/") + "/health"  # Mudado de /ping para /health
    
    async with httpx.AsyncClient(timeout=15) as client:
        while True:
            await asyncio.sleep(600)  # 10 minutos
            try:
                # Chama o endpoint /health que vai consultar o banco (Supabase)
                r = await client.get(ping_url)
                logger.info("keep-alive health-check -> %s %s", ping_url, r.status_code)
                if r.status_code == 200:
                    data = r.json()
                    logger.info("Database status: %s", data.get("database"))
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


@app.get("/health", tags=["Health"])
def health_check_with_db():
    """
    Health check que consulta o banco de dados.
    Usado pelo keep-alive para manter Supabase e Render ativos.
    """
    db_status = "unknown"
    db_error = None
    
    try:
        # Cria uma sessão temporária para testar a conexão
        db = SessionLocal()
        try:
            # Faz uma query simples para acordar o Supabase
            result = db.execute(text("SELECT 1 as alive"))
            row = result.fetchone()
            if row and row[0] == 1:
                db_status = "connected"
            else:
                db_status = "error"
        finally:
            db.close()
    except Exception as e:
        db_status = "error"
        db_error = str(e)
        logger.error("Health check database error: %s", e)
    
    response = {
        "status": "ok",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "database": db_status
    }
    
    if db_error:
        response["database_error"] = db_error
    
    return response


@app.get("/ping", tags=["Health"])
def ping():
    """Endpoint simples sem consulta ao banco."""
    return "pong"
