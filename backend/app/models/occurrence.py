import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean, Column, Date, DateTime, Double, Enum,
    ForeignKey, Integer, SmallInteger, String, Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class Occurrence(Base):
    __tablename__ = "occurrences"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    category = Column(String(20), nullable=False)
    title = Column(String(120), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(
        Enum("pending", "in_progress", "resolved", "rejected", name="occurrence_status"),
        nullable=False,
        default="pending",
    )
    latitude = Column(Double, nullable=False)
    longitude = Column(Double, nullable=False)
    address = Column(String(300), nullable=True)
    reporter_name = Column(String(100), nullable=True)
    reporter_email = Column(String(255), nullable=True)
    reporter_phone = Column(String(20), nullable=True)
    admin_notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relacionamentos
    user = relationship("User", back_populates="occurrences")
    images = relationship("Image", back_populates="occurrence", cascade="all, delete-orphan")
    lost_animal = relationship("LostAnimal", back_populates="occurrence", uselist=False, cascade="all, delete-orphan")
    dengue_report = relationship("DengueReport", back_populates="occurrence", uselist=False, cascade="all, delete-orphan")
    urban_problem = relationship("UrbanProblem", back_populates="occurrence", uselist=False, cascade="all, delete-orphan")


class LostAnimal(Base):
    __tablename__ = "lost_animals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    occurrence_id = Column(UUID(as_uuid=True), ForeignKey("occurrences.id", ondelete="CASCADE"), nullable=False)
    animal_type = Column(
        Enum("dog", "cat", "bird", "other", name="animal_type"), nullable=False
    )
    breed = Column(String(80), nullable=True)
    color = Column(String(80), nullable=True)
    approximate_age = Column(String(40), nullable=True)
    has_collar = Column(Boolean, default=False)
    collar_details = Column(String(200), nullable=True)
    last_seen_date = Column(Date, nullable=True)

    occurrence = relationship("Occurrence", back_populates="lost_animal")


class DengueReport(Base):
    __tablename__ = "dengue_reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    occurrence_id = Column(UUID(as_uuid=True), ForeignKey("occurrences.id", ondelete="CASCADE"), nullable=False)
    focus_type = Column(
        Enum("standing_water", "tire", "container", "construction", "other", name="dengue_focus_type"),
        nullable=False,
    )
    property_type = Column(String(60), nullable=True)
    is_accessible = Column(Boolean, default=True)

    occurrence = relationship("Occurrence", back_populates="dengue_report")


class UrbanProblem(Base):
    __tablename__ = "urban_problems"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    occurrence_id = Column(UUID(as_uuid=True), ForeignKey("occurrences.id", ondelete="CASCADE"), nullable=False)
    problem_type = Column(
        Enum(
            "pothole", "broken_street_light", "garbage", "flooding",
            "broken_sidewalk", "graffiti", "illegal_dumping", "other",
            name="urban_problem_type",
        ),
        nullable=False,
    )
    severity = Column(SmallInteger, nullable=True)
    affects_traffic = Column(Boolean, default=False)

    occurrence = relationship("Occurrence", back_populates="urban_problem")


class Image(Base):
    __tablename__ = "images"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    occurrence_id = Column(UUID(as_uuid=True), ForeignKey("occurrences.id", ondelete="CASCADE"), nullable=False)
    url = Column(Text, nullable=False)
    filename = Column(String(255), nullable=False)
    size_bytes = Column(Integer, nullable=True)
    mime_type = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    occurrence = relationship("Occurrence", back_populates="images")
