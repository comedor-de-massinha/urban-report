from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from typing import Optional
from pydantic import BaseModel, Field, field_validator
import re

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.occurrence import Occurrence
from app.models.user import User
from app.schemas.occurrence import PaginatedOccurrences
from app.schemas.user import UserResponse

router = APIRouter(prefix="/me", tags=["Minha conta"])


class ProfileUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v):
        if v is not None and v != "":
            digits = re.sub(r"\D", "", v)
            if len(digits) > 0 and (len(digits) < 10 or len(digits) > 11):
                raise ValueError("Telefone invalido.")
        return v or None


@router.get(
    "",
    response_model=UserResponse,
    summary="Dados do usuario autenticado",
)
def my_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch(
    "",
    response_model=UserResponse,
    summary="Atualizar nome e telefone",
)
def update_profile(
    payload: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if payload.name is not None:
        current_user.name = payload.name
    if payload.phone is not None or "phone" in payload.model_fields_set:
        current_user.phone = payload.phone
    db.commit()
    db.refresh(current_user)
    return current_user


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
