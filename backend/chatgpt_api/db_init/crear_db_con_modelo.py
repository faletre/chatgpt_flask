import sqlite3

# Crear conexión a la base de datos (se crea automáticamente si no existe)
conn = sqlite3.connect('chatgpt.db')

# Crear un cursor
cur = conn.cursor()

# Crear la tabla de Conversacion con la columna 'modelo' incluida
cur.execute('''
CREATE TABLE IF NOT EXISTS conversacion (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    contexto BOOLEAN NOT NULL DEFAULT 1,  -- Activa o desactiva el contexto
    modelo TEXT NOT NULL DEFAULT 'gpt-3.5-turbo',  -- Modelo por defecto
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
)
''')

# Crear la tabla de Mensaje
cur.execute('''
CREATE TABLE IF NOT EXISTS mensaje (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversacion_id INTEGER,
    mensaje TEXT NOT NULL,
    es_usuario BOOLEAN NOT NULL,  -- Si es del usuario o de la IA
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversacion_id) REFERENCES conversacion(id)
)
''')

# Confirmar la transacción
conn.commit()

# Cerrar la conexión
conn.close()

print("Base de datos y tablas creadas con éxito.")
