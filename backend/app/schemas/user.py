from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator
import re


class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Nome completo")
    email: EmailStr
    password: str = Field(..., min_length=3, max_length=64, description="Senha (mín. 3 caracteres)")
    phone: Optional[str] = Field(None, max_length=20)

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v):
        if v is not None:
            digits = re.sub(r"\D", "", v)
            if len(digits) < 10 or len(digits) > 15:
                raise ValueError("Telefone inválido.")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)


class UserResponse(BaseModel):
    id: UUID
    name: str
    email: str
    role: str
    phone: Optional[str]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
