import sqlite3

def agregar_columna_modelo_si_no_existe(db_path='chatgpt.db'):
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    # Obtener información de las columnas de la tabla 'conversacion'
    cur.execute("PRAGMA table_info(conversacion)")
    columnas = [fila[1] for fila in cur.fetchall()]

    if 'modelo' not in columnas:
        print("Columna 'modelo' no encontrada. Añadiéndola...")
        cur.execute("ALTER TABLE conversacion ADD COLUMN modelo TEXT NOT NULL DEFAULT 'gpt-3.5-turbo'")
        conn.commit()
        print("Columna 'modelo' añadida con éxito.")
    else:
        print("La columna 'modelo' ya existe. No se requiere ninguna acción.")

    conn.close()

if __name__ == "__main__":
    agregar_columna_modelo_si_no_existe()
