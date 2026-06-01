from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from auth import require_admin
import models

router = APIRouter(tags=["reportes"])

@router.get("/stats")
def stats(db: Session = Depends(get_db), user=Depends(require_admin)):
    total_pacientes = db.query(func.count(models.Paciente.id)).scalar()
    total_citas = db.query(func.count(models.Cita.id)).scalar()
    total_propietarios = db.query(func.count(models.Propietario.id)).scalar()
    total_recetas = db.query(func.count(models.Receta.id)).scalar()
    return {
        "total_pacientes": total_pacientes,
        "total_citas": total_citas,
        "total_propietarios": total_propietarios,
        "total_recetas": total_recetas
    }

@router.get("/consultas-por-mes")
def consultas_por_mes(anio: int, db: Session = Depends(get_db), user=Depends(require_admin)):
    # En SQLite usamos strftime
    resultados = db.query(
        func.strftime('%m', models.HistorialClinico.fecha).label('mes'),
        func.count(models.HistorialClinico.id).label('cantidad')
    ).filter(func.strftime('%Y', models.HistorialClinico.fecha) == str(anio))\
     .group_by('mes').all()
    
    return [{"mes": r.mes, "cantidad": r.cantidad} for r in resultados]

@router.get("/vacunas-por-mes")
def vacunas_por_mes(anio: int, db: Session = Depends(get_db), user=Depends(require_admin)):
    resultados = db.query(
        func.strftime('%m', models.HistorialClinico.fecha).label('mes'),
        func.count(models.HistorialClinico.id).label('cantidad')
    ).filter(
        func.strftime('%Y', models.HistorialClinico.fecha) == str(anio),
        models.HistorialClinico.tipo == 'vacuna'
    ).group_by('mes').all()
    
    return [{"mes": r.mes, "cantidad": r.cantidad} for r in resultados]

@router.get("/diagnosticos-frecuentes")
def diagnosticos_frecuentes(db: Session = Depends(get_db), user=Depends(require_admin)):
    resultados = db.query(
        models.HistorialClinico.diagnostico,
        func.count(models.HistorialClinico.id).label('cantidad')
    ).filter(models.HistorialClinico.diagnostico != None)\
     .group_by(models.HistorialClinico.diagnostico)\
     .order_by(func.count(models.HistorialClinico.id).desc())\
     .limit(10).all()
    
    return [{"diagnostico": r.diagnostico, "cantidad": r.cantidad} for r in resultados]

@router.get("/tipos-consulta")
def tipos_consulta(db: Session = Depends(get_db), user=Depends(require_admin)):
    resultados = db.query(
        models.Cita.tipo_consulta,
        func.count(models.Cita.id).label('cantidad')
    ).group_by(models.Cita.tipo_consulta).all()
    
    return [{"tipo": r.tipo_consulta, "cantidad": r.cantidad} for r in resultados]

@router.get("/pacientes-por-especie")
def pacientes_por_especie(db: Session = Depends(get_db), user=Depends(require_admin)):
    resultados = db.query(
        models.Paciente.especie,
        func.count(models.Paciente.id).label('cantidad')
    ).group_by(models.Paciente.especie).all()
    
    return [{"especie": r.especie, "cantidad": r.cantidad} for r in resultados]

@router.get("/inventario-bajo")
def inventario_bajo(db: Session = Depends(get_db), user=Depends(require_admin)):
    resultados = db.query(models.Medicamento)\
        .filter(models.Medicamento.cantidad_stock < models.Medicamento.cantidad_minima).all()
    
    return [
        {
            "id": r.id,
            "nombre": r.nombre,
            "cantidad_stock": r.cantidad_stock,
            "cantidad_minima": r.cantidad_minima,
            "unidad": r.unidad
        } for r in resultados
    ]

@router.get("/resumen")
def resumen(db: Session = Depends(get_db), user=Depends(require_admin)):
    # Mantenemos este por compatibilidad si se usa en otro lado
    return stats(db, user)