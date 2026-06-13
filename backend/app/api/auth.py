from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.user import TokenResponse, UserCreate, UserResponse
from app.services.auth_service import authenticate_user, register_user

router = APIRouter(prefix="/auth", tags=["Autenticação"])


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar novo usuário",
)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    """
    Registra um novo usuário cidadão.

    - **name**: Nome completo (2–100 caracteres)
    - **email**: E-mail válido (único)
    - **password**: Mínimo 8 caracteres, 1 maiúscula, 1 número
    - **phone**: Telefone opcional
    """
    return register_user(db, payload)


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login e obtenção de token JWT",
)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """
    Autentica o usuário e retorna um token JWT Bearer.

    Use o token no header: `Authorization: Bearer <token>`
    """
    user, token = authenticate_user(db, form_data.username, form_data.password)
    return TokenResponse(
        access_token=token,
        user=user,
    )
