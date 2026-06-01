from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user, require_admin
import models, schemas

router = APIRouter(tags=["pacientes"])

@router.get("",response_model=list[schemas.PacienteOut])
def listar(db: Session = Depends(get_db), user=Depends(get_current_user)):
    # Devolver todos los pacientes sin importar el rol
    return db.query(models.Paciente).all()

@router.post("", response_model=schemas.PacienteOut)
def crear(data: schemas.PacienteCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    p = models.Paciente(**data.model_dump())
    db.add(p); db.commit(); db.refresh(p)
    return p

@router.put("/{id}", response_model=schemas.PacienteOut)
def actualizar(id: int, data: schemas.PacienteCreate, db: Session = Depends(get_db), user=Depends(require_admin)):
    p = db.query(models.Paciente).filter(models.Paciente.id == id).first()
    if not p: raise HTTPException(404, "No encontrado")
    for k, v in data.model_dump().items():
        setattr(p, k, v)
    db.commit(); db.refresh(p)
    return p

@router.delete("/{id}")
def eliminar(id: int, db: Session = Depends(get_db), user=Depends(require_admin)):
    p = db.query(models.Paciente).filter(models.Paciente.id == id).first()
    if not p: raise HTTPException(404, "No encontrado")
    db.delete(p); db.commit()
    return {"msg": "Eliminado"}