from typing import Optional
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.models.occurrence import (
    DengueReport, Image, LostAnimal, Occurrence, UrbanProblem,
)
from app.schemas.occurrence import (
    DengueCreate, LostAnimalCreate, OccurrenceUpdate, UrbanProblemCreate,
)


# ── Helpers ────────────────────────────────────────────────────────────────────

def _get_or_404(db: Session, occurrence_id: UUID) -> Occurrence:
    occ = (
        db.query(Occurrence)
        .options(
            joinedload(Occurrence.images),
            joinedload(Occurrence.lost_animal),
            joinedload(Occurrence.dengue_report),
            joinedload(Occurrence.urban_problem),
        )
        .filter(Occurrence.id == occurrence_id)
        .first()
    )
    if not occ:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ocorrência não encontrada.")
    return occ


def _apply_filters(query, category=None, status_filter=None, date_from=None, date_to=None):
    if category:
        query = query.filter(Occurrence.category == category)
    if status_filter:
        query = query.filter(Occurrence.status == status_filter)
    if date_from:
        query = query.filter(Occurrence.created_at >= date_from)
    if date_to:
        query = query.filter(Occurrence.created_at <= date_to)
    return query


# ── List ───────────────────────────────────────────────────────────────────────

def list_occurrences(
    db: Session,
    category: Optional[str] = None,
    status_filter: Optional[str] = None,
    date_from=None,
    date_to=None,
    page: int = 1,
    page_size: int = 20,
):
    query = db.query(Occurrence).options(
        joinedload(Occurrence.images),
        joinedload(Occurrence.lost_animal),
        joinedload(Occurrence.dengue_report),
        joinedload(Occurrence.urban_problem),
    )
    query = _apply_filters(query, category, status_filter, date_from, date_to)
    total = query.count()
    items = (
        query.order_by(Occurrence.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return total, items


# ── Get by ID ──────────────────────────────────────────────────────────────────

def get_occurrence(db: Session, occurrence_id: UUID) -> Occurrence:
    return _get_or_404(db, occurrence_id)


# ── Create: Animal ─────────────────────────────────────────────────────────────

def create_animal(db: Session, payload: LostAnimalCreate, user_id: Optional[UUID] = None) -> Occurrence:
    occ = Occurrence(
        user_id=user_id,
        category="animal",
        title=payload.title,
        description=payload.description,
        latitude=payload.latitude,
        longitude=payload.longitude,
        address=payload.address,
        reporter_name=payload.reporter_name,
        reporter_email=payload.reporter_email,
        reporter_phone=payload.reporter_phone,
    )
    db.add(occ)
    db.flush()  # obtém o ID sem commit

    animal = LostAnimal(
        occurrence_id=occ.id,
        animal_type=payload.animal_data.animal_type,
        breed=payload.animal_data.breed,
        color=payload.animal_data.color,
        approximate_age=payload.animal_data.approximate_age,
        has_collar=payload.animal_data.has_collar,
        collar_details=payload.animal_data.collar_details,
        last_seen_date=payload.animal_data.last_seen_date,
    )
    db.add(animal)
    db.commit()
    db.refresh(occ)
    return _get_or_404(db, occ.id)


# ── Create: Dengue ─────────────────────────────────────────────────────────────

def create_dengue(db: Session, payload: DengueCreate, user_id: Optional[UUID] = None) -> Occurrence:
    occ = Occurrence(
        user_id=user_id,
        category="dengue",
        title=payload.title,
        description=payload.description,
        latitude=payload.latitude,
        longitude=payload.longitude,
        address=payload.address,
        reporter_name=payload.reporter_name,
        reporter_email=payload.reporter_email,
        reporter_phone=payload.reporter_phone,
    )
    db.add(occ)
    db.flush()

    dengue = DengueReport(
        occurrence_id=occ.id,
        focus_type=payload.dengue_data.focus_type,
        property_type=payload.dengue_data.property_type,
        is_accessible=payload.dengue_data.is_accessible,
    )
    db.add(dengue)
    db.commit()
    db.refresh(occ)
    return _get_or_404(db, occ.id)


# ── Create: Urban ──────────────────────────────────────────────────────────────

def create_urban(db: Session, payload: UrbanProblemCreate, user_id: Optional[UUID] = None) -> Occurrence:
    occ = Occurrence(
        user_id=user_id,
        category="urban",
        title=payload.title,
        description=payload.description,
        latitude=payload.latitude,
        longitude=payload.longitude,
        address=payload.address,
        reporter_name=payload.reporter_name,
        reporter_email=payload.reporter_email,
        reporter_phone=payload.reporter_phone,
    )
    db.add(occ)
    db.flush()

    urban = UrbanProblem(
        occurrence_id=occ.id,
        problem_type=payload.urban_data.problem_type,
        severity=payload.urban_data.severity,
        affects_traffic=payload.urban_data.affects_traffic,
    )
    db.add(urban)
    db.commit()
    db.refresh(occ)
    return _get_or_404(db, occ.id)


# ── Update ─────────────────────────────────────────────────────────────────────

def update_occurrence(db: Session, occurrence_id: UUID, payload: OccurrenceUpdate) -> Occurrence:
    occ = _get_or_404(db, occurrence_id)
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(occ, field, value)
    db.commit()
    db.refresh(occ)
    return _get_or_404(db, occ.id)


# ── Delete ─────────────────────────────────────────────────────────────────────

def delete_occurrence(db: Session, occurrence_id: UUID) -> None:
    occ = _get_or_404(db, occurrence_id)
    db.delete(occ)
    db.commit()


# ── Stats ──────────────────────────────────────────────────────────────────────

def get_stats(db: Session) -> dict:
    from datetime import datetime, timedelta

    total = db.query(func.count(Occurrence.id)).scalar()

    by_category = {
        row[0]: row[1]
        for row in db.query(Occurrence.category, func.count(Occurrence.id))
        .group_by(Occurrence.category)
        .all()
    }

    by_status = {
        row[0]: row[1]
        for row in db.query(Occurrence.status, func.count(Occurrence.id))
        .group_by(Occurrence.status)
        .all()
    }

    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    recent = (
        db.query(func.count(Occurrence.id))
        .filter(Occurrence.created_at >= thirty_days_ago)
        .scalar()
    )

    # Tendência: ocorrências por dia nos últimos 14 dias
    trend_rows = (
        db.query(
            func.date(Occurrence.created_at).label("day"),
            func.count(Occurrence.id).label("count"),
        )
        .filter(Occurrence.created_at >= datetime.utcnow() - timedelta(days=14))
        .group_by(func.date(Occurrence.created_at))
        .order_by(func.date(Occurrence.created_at))
        .all()
    )
    trend = [{"date": str(row.day), "count": row.count} for row in trend_rows]

    return {
        "total": total or 0,
        "by_category": by_category,
        "by_status": by_status,
        "recent_30_days": recent or 0,
        "trend": trend,
    }
