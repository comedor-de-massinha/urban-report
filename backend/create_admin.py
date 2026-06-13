"""
Script para criar ou recriar o usuario admin.
Execute no terminal com o venv ativo:

    python create_admin.py

"""
import sys
from app.core.database import SessionLocal, engine, Base
from app.core.security import hash_password
from app.models.user import User


def create_admin():
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        email = "admin@urbanreport.com"
        existing = db.query(User).filter(User.email == email).first()

        if existing:
            # Atualiza o hash caso exista admin com hash invalido
            existing.password_hash = hash_password("Admin@1234")
            existing.role = "admin"
            db.commit()
            print(f"[OK] Hash do admin atualizado: {email}")
        else:
            admin = User(
                name="Administrador",
                email=email,
                password_hash=hash_password("Admin@1234"),
                role="admin",
            )
            db.add(admin)
            db.commit()
            print(f"[OK] Admin criado: {email}")

        print("[AVISO] Altere a senha apos o primeiro login!")
    except Exception as e:
        print(f"[ERRO] {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    create_admin()
