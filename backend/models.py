# backend/models.py
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Date, Time, Numeric, Text, CheckConstraint,Float
from sqlalchemy.orm import relationship
from database import Base
import datetime

class Usuario(Base):
    __tablename__ = "usuarios"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    rol = Column(String(20), nullable=False) # 'admin', 'propietario'
    activo = Column(Boolean, default=True)
    
    # Relación con propietarios
    propietario_perfil = relationship("Propietario", back_populates="usuario", uselist=False)

class Paciente(Base):
    __tablename__ = "pacientes"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String)
    especie = Column(String)
    raza = Column(String, nullable=True)
    edad = Column(Float, nullable=True) # <--- ¡ASEGÚRATE DE QUE ESTA LÍNEA ESTÉ!
    sexo = Column(String, nullable=True)
    peso = Column(Float, nullable=True)
    propietario_id = Column(Integer, ForeignKey("propietarios.id"))
    
    propietario = relationship("Propietario", back_populates="mascotas")
    citas = relationship("Cita", back_populates="paciente")

class Propietario(Base):
    __tablename__ = "propietarios"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String)  # <--- Esta es la columna que faltaba en la tabla
    direccion = Column(String, nullable=True)
    telefono = Column(String, nullable=True)
    correo = Column(String, nullable=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    usuario = relationship("Usuario", back_populates="propietario_perfil")
    mascotas = relationship("Paciente", back_populates="propietario")

class Cita(Base):
    __tablename__ = "citas"
    id = Column(Integer, primary_key=True, index=True)
    paciente_id = Column(Integer, ForeignKey("pacientes.id"))
    fecha = Column(Date, nullable=False)
    hora = Column(Time, nullable=False)
    tipo_consulta = Column(String(60)) # 'control', 'vacuna', 'cirugia', etc.
    motivo = Column(Text, nullable=True)
    notas = Column(Text, nullable=True)
    estado = Column(String(20), default="programada")
    
    paciente = relationship("Paciente", back_populates="citas")

class HistorialClinico(Base):
    __tablename__ = "historial_clinico"
    id = Column(Integer, primary_key=True, index=True)
    paciente_id = Column(Integer, ForeignKey("pacientes.id"), nullable=False)
    cita_id = Column(Integer, ForeignKey("citas.id"), nullable=True)
    fecha = Column(Date, nullable=False)
    tipo = Column(String(60), nullable=False)
    diagnostico = Column(Text)
    tratamiento = Column(Text)
    vacuna_nombre = Column(String(100))
    vacuna_lote = Column(String(50))
    proxima_vacuna = Column(Date)
    peso_actual = Column(Float)
    temperatura = Column(Float)
    observaciones = Column(Text)

class MovimientoInventario(Base):
    __tablename__ = "movimientos_inventario"
    id = Column(Integer, primary_key=True, index=True)
    inventario_id = Column(Integer, ForeignKey("inventario.id"), nullable=False)
    tipo = Column(String(20), nullable=False) # 'entrada', 'salida', 'ajuste'
    cantidad = Column(Integer, nullable=False)
    motivo = Column(Text)
    fecha = Column(DateTime, default=datetime.datetime.utcnow)
    veterinario = Column(String(100), default="Dr. AMVet")

class Receta(Base):
    __tablename__ = "recetas"
    id = Column(Integer, primary_key=True, index=True)
    historial_id = Column(Integer, ForeignKey("historial_clinico.id"), nullable=True)
    paciente_id = Column(Integer, ForeignKey("pacientes.id"), nullable=False)
    fecha = Column(Date, nullable=False)
    indicaciones = Column(Text)
    items = Column(Text)

class Medicamento(Base):
    __tablename__ = "inventario"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    categoria = Column(String(60)) # 'medicamento', 'vacuna', 'insumo', etc.
    descripcion = Column(Text)
    cantidad_stock = Column("cantidad", Integer, default=0)
    cantidad_minima = Column(Integer, default=5)
    unidad = Column(String(30))
    precio_unitario = Column(Float)
    proveedor = Column(String(100))
    fecha_vencimiento = Column(Date)
    activo = Column(Boolean, default=True)

class Seguimiento(Base):
    __tablename__ = "seguimiento"
    id = Column(Integer, primary_key=True, index=True)
    paciente_id = Column(Integer, ForeignKey("pacientes.id"), nullable=False)
    historial_id = Column(Integer, ForeignKey("historial_clinico.id"))
    fecha_seguimiento = Column(Date, nullable=False)
    observaciones_evolucion = Column(Text)
    proximo_control = Column(Date)
    estado = Column(String(30), default="pendiente")

class Examen(Base):
    __tablename__ = "examenes_laboratorio"
    id = Column(Integer, primary_key=True, index=True)
    paciente_id = Column(Integer, ForeignKey("pacientes.id"), nullable=False)
    historial_id = Column(Integer, ForeignKey("historial_clinico.id"))
    tipo_examen = Column(String(80), nullable=False)
    fecha_solicitud = Column(Date, nullable=False)
    fecha_resultado = Column(Date)
    laboratorio = Column(String(100))
    resultado = Column(Text)
    archivo_nombre = Column(String(255))
    archivo_ruta = Column("archivo_path", String(500))
    observaciones = Column(Text)