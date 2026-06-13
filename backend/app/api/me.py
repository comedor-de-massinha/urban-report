from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.occurrence import Occurrence
from app.models.user import User
from app.schemas.occurrence import PaginatedOccurrences

router = APIRouter(prefix="/me", tags=["Minha conta"])


@router.get(
    "/occurrences",
    response_model=PaginatedOccurrences,
    summary="Listar ocorrencias do usuario autenticado",
)
def my_occurrences(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        db.query(Occurrence)
        .options(
            joinedload(Occurrence.images),
            joinedload(Occurrence.lost_animal),
            joinedload(Occurrence.dengue_report),
            joinedload(Occurrence.urban_problem),
        )
        .filter(Occurrence.user_id == current_user.id)
        .order_by(Occurrence.created_at.desc())
    )
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return PaginatedOccurrences(total=total, page=page, page_size=page_size, items=items)
