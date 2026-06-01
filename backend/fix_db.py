import models
from database import SessionLocal, engine
from auth import hash_password

# 1. Crear las tablas físicamente en el archivo .db
print("Creando tablas...")
models.Base.metadata.create_all(bind=engine)

db = SessionLocal()

email = "carla@amvet.bo"
# 2. Limpiar si existe algo raro
db.query(models.Usuario).filter(models.Usuario.email == email).delete()

# 3. Crear el usuario nuevo
nuevo_usuario = models.Usuario(
    nombre="Carla",
    email=email,
    password_hash=hash_password("123456"), # Pon la contraseña que quieras
    rol="propietario"
)

try:
    db.add(nuevo_usuario)
    db.commit() # <--- El paso que está fallando en tu app
    db.refresh(nuevo_usuario)
    
    # Crear su perfil de propietario vinculado
    nuevo_propietario = models.Propietario(
        usuario_id=nuevo_usuario.id,
        nombre="Carla Propietaria",
        correo=email
    )
    db.add(nuevo_propietario)
    db.commit()
    print(f"ÉXITO: Usuario {email} creado y guardado.")
except Exception as e:
    db.rollback()
    print(f"ERROR: {e}")
finally:
    db.close()