import sqlite3
from flask import g
import os

DATABASE = os.path.join(os.path.dirname(__file__), 'chatgpt.db')

def get_db():
    """
    @brief Obtiene la conexión a la base de datos.

    @details
    Esta función establece una conexión con la base de datos SQLite si no se ha creado una conexión
    previamente en el contexto de la aplicación. Si ya existe una conexión, se reutiliza para evitar
    conexiones duplicadas. Utiliza la variable global `g` para almacenar la conexión durante el ciclo de vida
    de la solicitud.

    @return
    - Conexión a la base de datos SQLite.

    @note
    La base de datos se encuentra en el archivo `chatgpt.db` en el directorio del proyecto.
    """
    if 'db' not in g:
        g.db = sqlite3.connect(DATABASE)
        g.db.row_factory = sqlite3.Row  # Permite acceder a las columnas por nombre en lugar de por índice.
    return g.db

def close_db(error=None):
    """
    @brief Cierra la conexión a la base de datos.

    @details
    Esta función cierra la conexión a la base de datos que se ha abierto durante la solicitud. La conexión
    se gestiona utilizando la variable global `g`. Si no hay una conexión abierta, no se realiza ninguna acción.

    @param error Opción de capturar un error (no se utiliza en este contexto).

    @note
    La función es llamada automáticamente al finalizar la solicitud, gracias a su integración en el ciclo de vida de Flask.
    """
    db = g.pop('db', None)  # Se elimina la conexión de la variable global 'g'.
    if db is not None:
        db.close()  # Cierra la conexión a la base de datos.

def init_app(app):
    """
    @brief Inicializa la aplicación Flask para gestionar la base de datos.

    @details
    Esta función se utiliza para integrar las funciones de la base de datos dentro del ciclo de vida de Flask.
    Registra la función `close_db` para que se ejecute automáticamente cuando la solicitud termine,
    asegurando que la conexión a la base de datos se cierre correctamente.

    @param app Instancia de la aplicación Flask.

    @note
    La función `close_db` se ejecutará automáticamente después de cada solicitud gracias a `teardown_appcontext`.
    """
    app.teardown_appcontext(close_db)
