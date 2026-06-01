from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any
from datetime import datetime, date, time

# Auth
class LoginRequest(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    rol: str
    nombre: str
    propietario_id: Optional[int] = None

# Usuario
class UsuarioCreate(BaseModel):
    nombre: str
    email: str
    password: str
    rol: str = "propietario"

# Propietario
class PropietarioCreate(BaseModel):
    nombre: str
    direccion: Optional[str] = None
    telefono: Optional[str] = None
    correo: Optional[str] = None
    password: Optional[str] = None

class PropietarioOut(PropietarioCreate):
    id: int
    rol: str = "propietario"
    class Config:
        from_attributes = True

# Paciente
class PacienteCreate(BaseModel):
    nombre: str
    especie: str
    raza: Optional[str] = None
    edad: Optional[float] = None
    sexo: Optional[str] = None
    peso: Optional[float] = None
    propietario_id: int

class PacienteOut(PacienteCreate):
    id: int
    class Config:
        from_attributes = True

# Cita
class CitaCreate(BaseModel):
    paciente_id: int
    propietario_id: Optional[int] = None
    fecha: date
    hora: time
    tipo_consulta: str
    motivo: Optional[str] = None
    estado: str = "programada"
    notas: Optional[str] = None

class CitaOut(CitaCreate):
    id: int
    class Config:
        from_attributes = True

# Historial
class HistorialCreate(BaseModel):
    paciente_id: int
    tipo: str
    fecha: date
    diagnostico: Optional[str] = None
    tratamiento: Optional[str] = None
    vacuna_nombre: Optional[str] = None
    vacuna_lote: Optional[str] = None
    proxima_vacuna: Optional[date] = None
    peso_actual: Optional[float] = None
    temperatura: Optional[float] = None
    observaciones: Optional[str] = None

class HistorialOut(HistorialCreate):
    id: int
    class Config:
        from_attributes = True

# Receta
class RecetaCreate(BaseModel):
    paciente_id: int
    fecha: date
    indicaciones: Optional[str] = None
    items: List[Any] = []

class RecetaOut(RecetaCreate):
    id: int
    class Config:
        from_attributes = True

# Medicamento
class MedicamentoCreate(BaseModel):
    nombre: str
    categoria: Optional[str] = None
    cantidad_stock: int = 0
    unidad: Optional[str] = None
    precio_unitario: Optional[float] = None
    fecha_vencimiento: Optional[date] = None
    descripcion: Optional[str] = None

class MedicamentoOut(MedicamentoCreate):
    id: int
    class Config:
        from_attributes = True

# Seguimiento
class SeguimientoCreate(BaseModel):
    paciente_id: int
    fecha_seguimiento: date
    observaciones_evolucion: Optional[str] = None
    proximo_control: Optional[date] = None
    estado: str = "pendiente"

class SeguimientoOut(SeguimientoCreate):
    id: int
    class Config:
        from_attributes = True

# Examen
class ExamenCreate(BaseModel):
    paciente_id: int
    tipo_examen: str
    resultado: Optional[str] = None
    fecha_solicitud: date
    fecha_resultado: Optional[date] = None
    laboratorio: Optional[str] = None
    observaciones: Optional[str] = None

class ExamenOut(ExamenCreate):
    id: int
    archivo_nombre: Optional[str] = None
    class Config:
        from_attributes = True