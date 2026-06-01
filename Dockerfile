# ==========================================
# Etapa 1: Construcción del Frontend (React + Vite)
# ==========================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copiar archivos de dependencias del frontend
COPY frontend/package*.json ./
RUN npm ci

# Copiar el resto de archivos del frontend
COPY frontend/ ./

# Definir la URL de la API como ruta relativa para el contenedor unificado
ENV VITE_API_URL=/api

# Compilar frontend para producción (genera la carpeta dist)
RUN npm run build

# ==========================================
# Etapa 2: Servidor Backend (FastAPI) y Servidor de Archivos
# ==========================================
FROM python:3.11-slim AS backend-runner

WORKDIR /app

# Instalar dependencias del sistema necesarias
RUN apt-get update && apt-get install -y \
    build-essential \
    libsqlite3-dev \
    && rm -rf /var/lib/apt/lists/*

# Copiar e instalar requerimientos de Python
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copiar todo el código del backend
COPY backend/ ./

# Copiar el frontend compilado (dist) desde la etapa 1 al directorio de ejecución del backend
COPY --from=frontend-builder /app/frontend/dist ./dist

# Crear el directorio de subidas de archivos (uploads)
RUN mkdir -p uploads

# Render.com define dinámicamente la variable de entorno $PORT
ENV PORT=8000
EXPOSE 8000

# Arrancar la aplicación usando Uvicorn, escuchando en el puerto asignado por Render
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT}"]
