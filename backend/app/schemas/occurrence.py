from datetime import date, datetime
from typing import List, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator
import re


# ── Imagens ────────────────────────────────────────────────────────────────────

class ImageOut(BaseModel):
    id: UUID
    url: str
    filename: str

    class Config:
        from_attributes = True


# ── Base de ocorrência ─────────────────────────────────────────────────────────

class OccurrenceBase(BaseModel):
    title: str = Field(..., min_length=5, max_length=120)
    description: str = Field(..., min_length=10, max_length=1000)
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    address: Optional[str] = Field(None, max_length=300)
    reporter_name: Optional[str] = Field(None, max_length=100)
    reporter_email: Optional[EmailStr] = None
    reporter_phone: Optional[str] = Field(None, max_length=20)

    @field_validator("reporter_phone")
    @classmethod
    def validate_phone(cls, v):
        if v is not None:
            digits = re.sub(r"\D", "", v)
            if len(digits) < 10 or len(digits) > 15:
                raise ValueError("Telefone inválido.")
        return v


# ── Animal Perdido ─────────────────────────────────────────────────────────────

class LostAnimalData(BaseModel):
    animal_type: Literal["dog", "cat", "bird", "other"]
    breed: Optional[str] = Field(None, max_length=80)
    color: Optional[str] = Field(None, max_length=80)
    approximate_age: Optional[str] = Field(None, max_length=40)
    has_collar: bool = False
    collar_details: Optional[str] = Field(None, max_length=200)
    last_seen_date: Optional[date] = None


class LostAnimalCreate(OccurrenceBase):
    animal_data: LostAnimalData


class LostAnimalOut(BaseModel):
    animal_type: str
    breed: Optional[str]
    color: Optional[str]
    approximate_age: Optional[str]
    has_collar: bool
    collar_details: Optional[str]
    last_seen_date: Optional[date]

    class Config:
        from_attributes = True


# ── Dengue ─────────────────────────────────────────────────────────────────────

class DengueData(BaseModel):
    focus_type: Literal["standing_water", "tire", "container", "construction", "other"]
    property_type: Optional[str] = Field(None, max_length=60)
    is_accessible: bool = True


class DengueCreate(OccurrenceBase):
    dengue_data: DengueData


class DengueOut(BaseModel):
    focus_type: str
    property_type: Optional[str]
    is_accessible: bool

    class Config:
        from_attributes = True


# ── Problema Urbano ────────────────────────────────────────────────────────────

class UrbanProblemData(BaseModel):
    problem_type: Literal[
        "pothole", "broken_street_light", "garbage", "flooding",
        "broken_sidewalk", "graffiti", "illegal_dumping", "other"
    ]
    severity: Optional[int] = Field(None, ge=1, le=5)
    affects_traffic: bool = False


class UrbanProblemCreate(OccurrenceBase):
    urban_data: UrbanProblemData


class UrbanOut(BaseModel):
    problem_type: str
    severity: Optional[int]
    affects_traffic: bool

    class Config:
        from_attributes = True


# ── Atualização (PATCH) ────────────────────────────────────────────────────────

class OccurrenceUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=5, max_length=120)
    description: Optional[str] = Field(None, min_length=10, max_length=1000)
    status: Optional[Literal["pending", "in_progress", "resolved", "rejected"]] = None
    admin_notes: Optional[str] = Field(None, max_length=1000)
    address: Optional[str] = Field(None, max_length=300)


# ── Response completo ──────────────────────────────────────────────────────────

class OccurrenceOut(BaseModel):
    id: UUID
    category: str
    title: str
    description: str
    status: str
    latitude: float
    longitude: float
    address: Optional[str]
    reporter_name: Optional[str]
    reporter_email: Optional[str]
    reporter_phone: Optional[str]
    admin_notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    images: List[ImageOut] = []

    # Dados específicos da categoria
    lost_animal: Optional[LostAnimalOut] = None
    dengue_report: Optional[DengueOut] = None
    urban_problem: Optional[UrbanOut] = None

    class Config:
        from_attributes = True


# ── Paginação ──────────────────────────────────────────────────────────────────

class PaginatedOccurrences(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[OccurrenceOut]


# ── Estatísticas ───────────────────────────────────────────────────────────────

class Stats(BaseModel):
    total: int
    by_category: dict
    by_status: dict
    recent_30_days: int
    trend: List[dict]  # [{date, count}]
