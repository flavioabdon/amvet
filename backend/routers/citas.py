from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
import models, schemas

router = APIRouter(tags=["citas"])

@router.get("/")
def listar(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return db.query(models.Cita).all()

@router.get("/hoy")
def listar_hoy(db: Session = Depends(get_db), user=Depends(get_current_user)):
    from datetime import date
    hoy = date.today()
    return db.query(models.Cita).filter(models.Cita.fecha == hoy).all()

@router.patch("/{id}/estado")
def actualizar_estado(id: int, data: dict, db: Session = Depends(get_db), user=Depends(get_current_user)):
    c = db.query(models.Cita).filter(models.Cita.id == id).first()
    if not c: raise HTTPException(404, "No encontrada")
    c.estado = data.get("estado", c.estado)
    db.commit()
    return c

@router.post("/", response_model=schemas.CitaOut)
def crear(data: schemas.CitaCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    dump = data.model_dump()
    dump.pop("propietario_id", None)  # no es columna del modelo Cita
    c = models.Cita(**dump)
    db.add(c); db.commit(); db.refresh(c)
    return c

@router.put("/{id}", response_model=schemas.CitaOut)
def actualizar(id: int, data: schemas.CitaCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    c = db.query(models.Cita).filter(models.Cita.id == id).first()
    if not c: raise HTTPException(404, "No encontrada")
    for k, v in data.model_dump().items():
        setattr(c, k, v)
    db.commit(); db.refresh(c)
    return c

@router.delete("/{id}")
def cancelar(id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    c = db.query(models.Cita).filter(models.Cita.id == id).first()
    if not c: raise HTTPException(404, "No encontrada")
    c.estado = "cancelada"
    db.commit()
    return {"msg": "Cita cancelada"}