from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

# Importaciones locales
from database import engine, SessionLocal
import models
from models import Usuario
from auth import hash_password
from routers import (
    auth, propietarios, pacientes, citas, 
    historial, recetas, inventario, seguimiento, 
    examenes, reportes
)

# 1. Crear las tablas de la base de datos
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="AMVet API")

# 2. Configuración de CORS mejorada
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Permite todas las conexiones en desarrollo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Gestión de archivos de exámenes (RF09)
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.router.redirect_slashes = True
# 4. Inclusión de rutas
app.include_router(auth.router,prefix="/api/auth",tags=["auth"])
app.include_router(propietarios.router,prefix="/api/propietarios",tags=["propietarios"])
app.include_router(pacientes.router,prefix="/api/pacientes",tags=["pacientes"])
app.include_router(citas.router,prefix="/api/citas",tags=["citas"])
app.include_router(historial.router,prefix="/api/historial",tags=["historial"])
app.include_router(recetas.router,prefix="/api/recetas",tags=["recetas"])
app.include_router(inventario.router,prefix="/api/inventario",tags=["inventario"])
app.include_router(seguimiento.router,prefix="/api/seguimiento",tags=["seguimiento"])
app.include_router(examenes.router,prefix="/api/examenes",tags=["examenes"])
app.include_router(reportes.router,prefix="/api/reportes",tags=["reportes"])

# 5. Lógica del Administrador Inicial
def crear_admin():
    db = SessionLocal()
    try:
        # Buscamos si ya existe el admin
        admin_existente = db.query(Usuario).filter(Usuario.email == "admin@amvet.bo").first()
        
        if not admin_existente:
            print("--- Iniciando AMVet: Creando médico administrador ---")
            pass_plano = str("admin123").strip()
            nuevo_admin = Usuario(
                nombre="Dr. Veterinario AMVet",
                email="admin@amvet.bo",
                password_hash=hash_password("admin123"), 
                rol="admin",
                activo=True
            )
            db.add(nuevo_admin)
            db.commit()
            print("--- LOGIN LISTO: admin@amvet.bo / admin123 ---")
        else:
            print("--- AMVet: El administrador ya existe en la base de datos ---")
    except Exception as e:
        db.rollback()
        print(f"Error al crear admin: {e}")
    finally:
        db.close()

# 6. Eventos de inicio
@app.on_event("startup")
async def startup_event():
    crear_admin()

# 7. Servir frontend (React SPA) si existe (ideal para Render.com / contenedor único)
if os.path.exists("dist"):
    from fastapi.responses import FileResponse
    
    # Servir la carpeta de assets directamente
    app.mount("/assets", StaticFiles(directory="dist/assets"), name="assets")
    
    # Manejar cualquier otra ruta que no sea API para el React Router (SPA)
    @app.get("/{catchall:path}")
    def serve_spa(catchall: str):
        # Evitar capturar rutas de la API (dejar que FastAPI las resuelva o devuelva 404 de API)
        if catchall.startswith("api") or catchall.startswith("docs") or catchall.startswith("openapi.json"):
            raise HTTPException(status_code=404, detail="Not Found")
            
        # Comprobar si existe el archivo en la carpeta raíz de dist (ej: favicon.ico, robots.txt)
        file_path = os.path.join("dist", catchall)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
            
        # Servir siempre index.html para soportar rutas del frontend (React Router)
        return FileResponse("dist/index.html")
else:
    @app.get("/")
    def root():
        return {"msg": "AMVet API funcionando"}