from sqlalchemy import inspect
from db import db_engine

inspector = inspect(db_engine)
tablas = inspector.get_table_names()

print("Tablas en la base de datos:")
for tabla in tablas:
    print(f"- {tabla}")
