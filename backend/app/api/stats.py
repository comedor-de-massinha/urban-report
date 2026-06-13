from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_admin
from app.schemas.occurrence import Stats
from app.services.occurrence_service import get_stats

router = APIRouter(prefix="/stats", tags=["Estatísticas"])


@router.get(
    "",
    response_model=Stats,
    summary="Estatísticas gerais do dashboard (admin)",
    dependencies=[Depends(get_current_admin)],
)
def statistics(db: Session = Depends(get_db)):
    """Retorna totais, distribuição por categoria/status e tendência dos últimos 14 dias."""
    return get_stats(db)
