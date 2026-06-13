from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

# Troca o driver de psycopg2 para pg8000 para evitar
# UnicodeDecodeError em caminhos Windows com caracteres especiais
db_url = settings.DATABASE_URL.replace(
    "postgresql://", "postgresql+pg8000://"
).replace(
    "postgresql+pg8000+pg8000://", "postgresql+pg8000://"  # guard dupla substituicao
)

engine = create_engine(
    db_url,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    connect_args={"ssl_context": True},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency para injetar sessao do banco nas rotas."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
