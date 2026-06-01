from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
import models, schemas

router = APIRouter(tags=["historial"])

@router.get("/")
def listar_todos(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return db.query(models.HistorialClinico).all()

@router.get("/{paciente_id}")
def listar_por_paciente(paciente_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    return db.query(models.HistorialClinico).filter(models.HistorialClinico.paciente_id == paciente_id).all()

@router.post("/", response_model=schemas.HistorialOut)
def crear(data: schemas.HistorialCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    h = models.HistorialClinico(**data.model_dump())
    db.add(h); db.commit(); db.refresh(h)
    return h

@router.put("/{id}", response_model=schemas.HistorialOut)
def actualizar(id: int, data: schemas.HistorialCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    h = db.query(models.HistorialClinico).filter(models.HistorialClinico.id == id).first()
    if not h: raise HTTPException(404, "No encontrado")
    for k, v in data.model_dump().items():
        setattr(h, k, v)
    db.commit(); db.refresh(h)
    return h