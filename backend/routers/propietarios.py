from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user, require_admin, hash_password
import models, schemas

router = APIRouter(tags=["propietarios"])

@router.get("", response_model=list[schemas.PropietarioOut])
def listar(db: Session = Depends(get_db), user=Depends(get_current_user)):
    if user.rol == "admin":
        return db.query(models.Propietario).all()
    prop = db.query(models.Propietario).filter(models.Propietario.usuario_id == user.id).first()
    return [prop] if prop else []

@router.post("", response_model=schemas.PropietarioOut)
def crear(data: schemas.PropietarioCreate, db: Session = Depends(get_db), user=Depends(require_admin)):
    try:
        # 1. Verificar si ya existe un usuario con ese correo
        if data.correo:
            usuario_existente = db.query(models.Usuario).filter(models.Usuario.email == data.correo).first()
            if usuario_existente:
                raise HTTPException(status_code=400, detail="El correo ya está registrado en el sistema")
            
            # 2. Crear el usuario automáticamente para el propietario
            password_inicial = data.password if data.password else "amvet123"
            nuevo_usuario = models.Usuario(
                nombre=data.nombre,
                email=data.correo,
                password_hash=hash_password(password_inicial),
                rol="propietario",
                activo=True
            )
            db.add(nuevo_usuario)
            db.commit()
            db.refresh(nuevo_usuario)
            
            # 3. Crear el propietario vinculado al usuario
            datos_propietario = data.model_dump()
            datos_propietario.pop('password', None) # Eliminamos password antes de crear Propietario
            p = models.Propietario(**datos_propietario, usuario_id=nuevo_usuario.id)
        else:
            # Si no hay correo, solo se crea el registro de propietario (no podrá loguearse)
            datos_propietario = data.model_dump()
            datos_propietario.pop('password', None)
            p = models.Propietario(**datos_propietario)
        
        db.add(p)
        db.commit()
        db.refresh(p)
        return p
    except HTTPException as he:
        raise he
    except Exception as e:
        db.rollback()
        print(f"ERROR AL CREAR PROPIETARIO: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

@router.put("/{id}", response_model=schemas.PropietarioOut)
def actualizar(id: int, data: schemas.PropietarioCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    p = db.query(models.Propietario).filter(models.Propietario.id == id).first()
    if not p:
        raise HTTPException(404, "No encontrado")
    
    # Verificar si se cambia el correo y si ya existe
    if data.correo and p.correo != data.correo:
        existente = db.query(models.Usuario).filter(models.Usuario.email == data.correo).first()
        if existente and existente.id != p.usuario_id:
            raise HTTPException(status_code=400, detail="El correo ya está registrado por otro usuario")
            
    datos = data.model_dump()
    datos.pop('password', None)
    
    for k, v in datos.items():
        setattr(p, k, v)
    
    # Si hay un usuario asociado, actualizamos su nombre y correo
    if p.usuario:
        p.usuario.nombre = data.nombre
        if data.correo:
            p.usuario.email = data.correo
            
    db.commit()
    db.refresh(p)
    return p

@router.delete("/{id}")
def eliminar(id: int, db: Session = Depends(get_db), user=Depends(require_admin)):
    p = db.query(models.Propietario).filter(models.Propietario.id == id).first()
    if not p:
        raise HTTPException(404, "No encontrado")
    
    # Si tiene usuario asociado, lo eliminamos también? 
    # Generalmente sí, para no dejar basura.
    if p.usuario_id:
        u = db.query(models.Usuario).filter(models.Usuario.id == p.usuario_id).first()
        if u:
            db.delete(u)
            
    db.delete(p)
    db.commit()
    return {"msg": "Eliminado"}