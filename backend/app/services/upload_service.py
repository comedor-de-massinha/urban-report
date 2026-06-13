import uuid
from pathlib import Path

import cloudinary
import cloudinary.uploader
from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.occurrence import Image

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_BYTES = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024

# Configura o Cloudinary uma vez ao importar
cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True,
)


async def save_image(db: Session, occurrence_id: uuid.UUID, file: UploadFile) -> Image:
    # Validar tipo MIME
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Tipo de arquivo nao permitido: {file.content_type}. Use JPEG, PNG ou WebP.",
        )

    content = await file.read()

    # Validar tamanho
    if len(content) > MAX_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Arquivo muito grande. Tamanho maximo: {settings.MAX_UPLOAD_SIZE_MB} MB.",
        )

    # Faz upload para o Cloudinary
    # Organiza em pasta por occurrence_id para facilitar gestao
    public_id = f"urbanreport/{occurrence_id}/{uuid.uuid4()}"
    try:
        result = cloudinary.uploader.upload(
            content,
            public_id=public_id,
            resource_type="image",
            overwrite=False,
            format="webp",          # converte tudo para webp (menor tamanho)
            quality="auto:good",    # compressao automatica
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Erro ao fazer upload da imagem: {str(e)}",
        )

    # Registra no banco com a URL segura retornada pelo Cloudinary
    safe_filename = Path(result["public_id"]).name + ".webp"
    image = Image(
        occurrence_id=occurrence_id,
        url=result["secure_url"],       # URL HTTPS permanente
        filename=safe_filename,
        size_bytes=result.get("bytes"),
        mime_type="image/webp",
    )
    db.add(image)
    db.commit()
    db.refresh(image)
    return image
