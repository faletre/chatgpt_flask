import sqlite3
from sqlalchemy import inspect
from db import db_engine
from models import Conversacion, Base

def agregar_columna_modelo_si_no_existe(db_path='chatgpt.db'):
    # Usando SQLAlchemy para inspección
    inspector = inspect(db_engine)
    columns = [col['name'] for col in inspector.get_columns('conversacion')]

    if 'modelo' not in columns:
        print("Columna 'modelo' no encontrada. Añadiéndola...")
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()
        cur.execute("ALTER TABLE conversacion ADD COLUMN modelo TEXT NOT NULL DEFAULT 'gpt-3.5-turbo'")
        conn.commit()
        conn.close()
        print("Columna 'modelo' añadida con éxito.")
    else:
        print("La columna 'modelo' ya existe. No se requiere ninguna acción.")

if __name__ == "__main__":
    agregar_columna_modelo_si_no_existe()
