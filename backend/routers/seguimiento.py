from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
import models, schemas

router = APIRouter(tags=["seguimiento"])

@router.get("/")
def listar_todos(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return db.query(models.Seguimiento).all()

@router.get("/{paciente_id}")
def listar(paciente_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    return db.query(models.Seguimiento).filter(models.Seguimiento.paciente_id == paciente_id).all()

@router.post("/", response_model=schemas.SeguimientoOut)
def crear(data: schemas.SeguimientoCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    s = models.Seguimiento(**data.model_dump())
    db.add(s); db.commit(); db.refresh(s)
    return s

@router.put("/{id}", response_model=schemas.SeguimientoOut)
def actualizar(id: int, data: schemas.SeguimientoCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    s = db.query(models.Seguimiento).filter(models.Seguimiento.id == id).first()
    if not s: raise HTTPException(404, "No encontrado")
    for k, v in data.model_dump().items():
        setattr(s, k, v)
    db.commit(); db.refresh(s)
    return s