from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
import models, schemas
import json

router = APIRouter(tags=["recetas"])

@router.get("/")
def listar_todas(db: Session = Depends(get_db), user=Depends(get_current_user)):
    recetas = db.query(models.Receta).all()
    for r in recetas:
        if r.items:
            try:
                r.items = json.loads(r.items)
            except:
                r.items = []
        else:
            r.items = []
    return recetas

@router.get("/{historial_id}")
def obtener(historial_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    recetas = db.query(models.Receta).filter(models.Receta.historial_id == historial_id).all()
    for r in recetas:
        if r.items:
            try:
                r.items = json.loads(r.items)
            except:
                r.items = []
        else:
            r.items = []
    return recetas

@router.post("/", response_model=schemas.RecetaOut)
def crear(data: schemas.RecetaCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    dump = data.model_dump()
    if 'items' in dump:
        dump['items'] = json.dumps(dump['items'])
    r = models.Receta(**dump)
    db.add(r); db.commit(); db.refresh(r)
    
    if r.items:
        try:
            r.items = json.loads(r.items)
        except:
            r.items = []
    else:
        r.items = []
    return r