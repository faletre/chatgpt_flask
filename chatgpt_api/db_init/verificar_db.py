import sqlite3

conn = sqlite3.connect("chatgpt.db")
cur = conn.cursor()

cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
tablas = cur.fetchall()

print("Tablas en la base de datos:")
for tabla in tablas:
    print(f"- {tabla[0]}")
