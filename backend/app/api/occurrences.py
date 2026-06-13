from datetime import date
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, UploadFile, File, status, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_admin, get_current_user, get_optional_user
from app.models.user import User
from app.schemas.occurrence import (
    DengueCreate, LostAnimalCreate, OccurrenceOut,
    OccurrenceUpdate, PaginatedOccurrences, UrbanProblemCreate,
)
from app.services import occurrence_service, upload_service

router = APIRouter(prefix="/occurrences", tags=["Ocorrências"])


# ── Listar todas ───────────────────────────────────────────────────────────────

@router.get(
    "",
    response_model=PaginatedOccurrences,
    summary="Listar ocorrências com filtros e paginação",
)
def list_occurrences(
    category: Optional[str] = Query(None, description="animal | dengue | urban"),
    status_filter: Optional[str] = Query(None, alias="status"),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    total, items = occurrence_service.list_occurrences(
        db, category, status_filter, date_from, date_to, page, page_size
    )
    return PaginatedOccurrences(total=total, page=page, page_size=page_size, items=items)


# ── Buscar por ID ──────────────────────────────────────────────────────────────

@router.get(
    "/{occurrence_id}",
    response_model=OccurrenceOut,
    summary="Buscar ocorrência por ID",
)
def get_occurrence(occurrence_id: UUID, db: Session = Depends(get_db)):
    return occurrence_service.get_occurrence(db, occurrence_id)


# ── Criar: Animal Perdido ──────────────────────────────────────────────────────

@router.post(
    "/animal",
    response_model=OccurrenceOut,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar animal perdido",
)
def create_animal(
    payload: LostAnimalCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """
    Registra uma ocorrência de **animal perdido**.

    Exemplo de corpo:
    ```json
    {
      "title": "Cachorro perdido no centro",
      "description": "Golden retriever, sem coleira, visto próximo à praça.",
      "latitude": -23.5505,
      "longitude": -46.6333,
      "address": "Praça da Sé, São Paulo",
      "reporter_name": "João Silva",
      "reporter_phone": "11999999999",
      "animal_data": {
        "animal_type": "dog",
        "breed": "Golden Retriever",
        "color": "Dourado",
        "has_collar": false
      }
    }
    ```
    """
    uid = current_user.id if current_user else None
    return occurrence_service.create_animal(db, payload, uid)


# ── Criar: Dengue ──────────────────────────────────────────────────────────────

@router.post(
    "/dengue",
    response_model=OccurrenceOut,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar foco de dengue",
)
def create_dengue(
    payload: DengueCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    uid = current_user.id if current_user else None
    return occurrence_service.create_dengue(db, payload, uid)


# ── Criar: Problema Urbano ─────────────────────────────────────────────────────

@router.post(
    "/urban",
    response_model=OccurrenceOut,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar problema urbano",
)
def create_urban(
    payload: UrbanProblemCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    uid = current_user.id if current_user else None
    return occurrence_service.create_urban(db, payload, uid)


# ── Upload de imagem ───────────────────────────────────────────────────────────

@router.post(
    "/{occurrence_id}/images",
    status_code=status.HTTP_201_CREATED,
    summary="Fazer upload de imagem para uma ocorrência",
)
async def upload_image(
    occurrence_id: UUID,
    file: UploadFile = File(..., description="Imagem (JPEG, PNG, WebP — máx. 5 MB)"),
    db: Session = Depends(get_db),
):
    # Verificar se ocorrência existe
    occurrence_service.get_occurrence(db, occurrence_id)
    image = await upload_service.save_image(db, occurrence_id, file)
    return {"id": str(image.id), "url": image.url, "filename": image.filename}


# ── Atualizar (admin) ──────────────────────────────────────────────────────────

@router.patch(
    "/{occurrence_id}",
    response_model=OccurrenceOut,
    summary="Atualizar ocorrência (admin)",
    dependencies=[Depends(get_current_admin)],
)
def update_occurrence(
    occurrence_id: UUID,
    payload: OccurrenceUpdate,
    db: Session = Depends(get_db),
):
    return occurrence_service.update_occurrence(db, occurrence_id, payload)


# ── Deletar (admin) ────────────────────────────────────────────────────────────

@router.delete(
    "/{occurrence_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Deletar ocorrência (admin)",
    dependencies=[Depends(get_current_admin)],
)
def delete_occurrence(occurrence_id: UUID, db: Session = Depends(get_db)):
    occurrence_service.delete_occurrence(db, occurrence_id)
