-- ============================================================
-- BASE DE DATOS: AMVet - Sistema de Información Veterinaria
-- Motor: SQLite (desarrollo) / PostgreSQL (producción)
-- ============================================================

-- TABLA: usuarios (médico/admin + propietarios)
CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL CHECK (rol IN ('admin', 'propietario')),
    telefono VARCHAR(20),
    direccion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLA: propietarios (vinculado a usuario)
CREATE TABLE IF NOT EXISTS propietarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    ci VARCHAR(20),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLA: pacientes (mascotas)
CREATE TABLE IF NOT EXISTS pacientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    propietario_id INTEGER NOT NULL REFERENCES propietarios(id) ON DELETE CASCADE,
    nombre VARCHAR(80) NOT NULL,
    especie VARCHAR(50) NOT NULL,
    raza VARCHAR(80),
    edad_anios INTEGER,
    edad_meses INTEGER,
    sexo VARCHAR(10) CHECK (sexo IN ('macho', 'hembra')),
    peso DECIMAL(5,2),
    color VARCHAR(50),
    observaciones TEXT,
    activo BOOLEAN DEFAULT TRUE,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLA: citas
CREATE TABLE IF NOT EXISTS citas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    paciente_id INTEGER NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    propietario_id INTEGER NOT NULL REFERENCES propietarios(id),
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    tipo_consulta VARCHAR(60) NOT NULL CHECK (tipo_consulta IN (
        'control', 'vacuna', 'cirugia', 'esterilizacion',
        'peluqueria', 'emergencia', 'otro'
    )),
    motivo TEXT,
    estado VARCHAR(20) DEFAULT 'programada' CHECK (estado IN (
        'programada', 'confirmada', 'completada', 'cancelada'
    )),
    notas TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLA: historial_clinico
CREATE TABLE IF NOT EXISTS historial_clinico (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    paciente_id INTEGER NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    cita_id INTEGER REFERENCES citas(id),
    fecha DATE NOT NULL,
    tipo VARCHAR(60) NOT NULL CHECK (tipo IN (
        'consulta', 'vacuna', 'cirugia', 'esterilizacion',
        'peluqueria', 'control', 'emergencia', 'otro'
    )),
    diagnostico TEXT,
    tratamiento TEXT,
    vacuna_nombre VARCHAR(100),
    vacuna_lote VARCHAR(50),
    proxima_vacuna DATE,
    peso_actual DECIMAL(5,2),
    temperatura DECIMAL(4,1),
    observaciones TEXT,
    veterinario VARCHAR(100) DEFAULT 'Dr. AMVet',
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLA: recetas
CREATE TABLE IF NOT EXISTS recetas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    historial_id INTEGER REFERENCES historial_clinico(id),
    paciente_id INTEGER NOT NULL REFERENCES pacientes(id),
    fecha DATE NOT NULL,
    indicaciones TEXT,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLA: receta_items (medicamentos por receta)
CREATE TABLE IF NOT EXISTS receta_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    receta_id INTEGER NOT NULL REFERENCES recetas(id) ON DELETE CASCADE,
    medicamento VARCHAR(100) NOT NULL,
    dosis VARCHAR(80),
    frecuencia VARCHAR(80),
    duracion VARCHAR(80),
    observaciones TEXT
);

-- TABLA: inventario
CREATE TABLE IF NOT EXISTS inventario (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre VARCHAR(100) NOT NULL,
    categoria VARCHAR(60) CHECK (categoria IN (
        'medicamento', 'vacuna', 'insumo', 'peluqueria', 'otro'
    )),
    descripcion TEXT,
    cantidad INTEGER DEFAULT 0,
    cantidad_minima INTEGER DEFAULT 5,
    unidad VARCHAR(30),
    precio_unitario DECIMAL(10,2),
    proveedor VARCHAR(100),
    fecha_vencimiento DATE,
    activo BOOLEAN DEFAULT TRUE,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLA: movimientos_inventario
CREATE TABLE IF NOT EXISTS movimientos_inventario (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inventario_id INTEGER NOT NULL REFERENCES inventario(id),
    tipo VARCHAR(20) CHECK (tipo IN ('entrada', 'salida', 'ajuste')),
    cantidad INTEGER NOT NULL,
    motivo TEXT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLA: seguimiento
CREATE TABLE IF NOT EXISTS seguimiento (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    paciente_id INTEGER NOT NULL REFERENCES pacientes(id),
    historial_id INTEGER REFERENCES historial_clinico(id),
    fecha_seguimiento DATE NOT NULL,
    observaciones_evolucion TEXT,
    proximo_control DATE,
    estado VARCHAR(30) DEFAULT 'pendiente' CHECK (estado IN (
        'pendiente', 'realizado', 'cancelado'
    )),
    alerta_enviada BOOLEAN DEFAULT FALSE,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLA: examenes_laboratorio
CREATE TABLE IF NOT EXISTS examenes_laboratorio (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    paciente_id INTEGER NOT NULL REFERENCES pacientes(id),
    historial_id INTEGER REFERENCES historial_clinico(id),
    tipo_examen VARCHAR(80) NOT NULL,
    fecha_solicitud DATE NOT NULL,
    fecha_resultado DATE,
    laboratorio VARCHAR(100),
    resultado TEXT,
    archivo_nombre VARCHAR(255),
    archivo_path VARCHAR(500),
    observaciones TEXT,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLA: recordatorios
CREATE TABLE IF NOT EXISTS recordatorios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    propietario_id INTEGER NOT NULL REFERENCES propietarios(id),
    paciente_id INTEGER NOT NULL REFERENCES pacientes(id),
    tipo VARCHAR(40) CHECK (tipo IN ('cita', 'vacuna', 'control', 'seguimiento')),
    mensaje TEXT,
    fecha_envio TIMESTAMP,
    enviado BOOLEAN DEFAULT FALSE,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- DATOS INICIALES
-- ============================================================

-- Usuario administrador (médico veterinario)
-- Password: admin123 (hash bcrypt)


-- Categorías de inventario iniciales
INSERT OR IGNORE INTO inventario (nombre, categoria, cantidad, cantidad_minima, unidad, precio_unitario)
VALUES
    ('Amoxicilina 500mg', 'medicamento', 50, 10, 'comprimidos', 2.50),
    ('Ivermectina 1%', 'medicamento', 30, 5, 'ml', 15.00),
    ('Vacuna Antirrábica', 'vacuna', 20, 5, 'dosis', 45.00),
    ('Vacuna Polivalente Canina', 'vacuna', 15, 5, 'dosis', 60.00),
    ('Gasas estériles', 'insumo', 100, 20, 'unidades', 0.50),
    ('Jeringas 5ml', 'insumo', 80, 20, 'unidades', 1.00),
    ('Shampoo medicado', 'peluqueria', 10, 3, 'frascos', 35.00);