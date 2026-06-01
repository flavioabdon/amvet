from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
import models, aiofiles, os
from datetime import date
from typing import Optional

router = APIRouter(tags=["examenes"])
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("/")
def listar_todos(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return db.query(models.Examen).all()

@router.get("/{paciente_id}")
def listar(paciente_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    return db.query(models.Examen).filter(models.Examen.paciente_id == paciente_id).all()

@router.post("/")
async def crear(
    paciente_id: int = Form(...),
    tipo_examen: str = Form(...),
    fecha_solicitud: date = Form(...),
    fecha_resultado: Optional[date] = Form(None),
    laboratorio: Optional[str] = Form(None),
    resultado: str = Form(""),
    observaciones: Optional[str] = Form(None),
    archivo: UploadFile = File(None),
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    archivo_nombre = None
    archivo_ruta = None
    if archivo:
        archivo_nombre = archivo.filename
        archivo_ruta = os.path.join(UPLOAD_DIR, archivo.filename)
        async with aiofiles.open(archivo_ruta, 'wb') as f:
            await f.write(await archivo.read())
    e = models.Examen(
        paciente_id=paciente_id,
        tipo_examen=tipo_examen,
        fecha_solicitud=fecha_solicitud,
        fecha_resultado=fecha_resultado,
        laboratorio=laboratorio,
        resultado=resultado,
        observaciones=observaciones,
        archivo_nombre=archivo_nombre,
        archivo_ruta=archivo_ruta
    )
    db.add(e); db.commit(); db.refresh(e)
    return e

@router.put("/{id}")
async def actualizar(
    id: int,
    tipo_examen: str = Form(...),
    fecha_solicitud: date = Form(...),
    fecha_resultado: Optional[date] = Form(None),
    laboratorio: Optional[str] = Form(None),
    resultado: str = Form(""),
    observaciones: Optional[str] = Form(None),
    archivo: UploadFile = File(None),
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    e = db.query(models.Examen).filter(models.Examen.id == id).first()
    if not e: raise HTTPException(404, "No encontrado")
    e.tipo_examen = tipo_examen
    e.fecha_solicitud = fecha_solicitud
    e.fecha_resultado = fecha_resultado
    e.laboratorio = laboratorio
    e.resultado = resultado
    e.observaciones = observaciones
    
    if archivo:
        archivo_nombre = archivo.filename
        archivo_ruta = os.path.join(UPLOAD_DIR, archivo.filename)
        async with aiofiles.open(archivo_ruta, 'wb') as f:
            await f.write(await archivo.read())
        e.archivo_nombre = archivo_nombre
        e.archivo_ruta = archivo_ruta
    db.commit(); db.refresh(e)
    return e