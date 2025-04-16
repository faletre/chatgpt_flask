from flask import g
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import scoped_session, sessionmaker
from sqlalchemy import create_engine
import os

# Configuración de la base de datos
DATABASE_PATH = os.path.join(os.path.dirname(__file__), 'chatgpt.db')
DATABASE_URI = f'sqlite:///{DATABASE_PATH}'

db_engine = create_engine(DATABASE_URI, connect_args={"check_same_thread": False})
db_session = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=db_engine))

# Si se usa Flask, puede inicializar SQLAlchemy como extensión
# db = SQLAlchemy()  # Si se quiere usar la extensión de Flask directamente

def get_db():
    """
    @brief Obtiene la sesión de la base de datos.

    @details
    Retorna la sesión de SQLAlchemy para la base de datos, almacenada en el contexto global de Flask.

    @return
    - Sesión de SQLAlchemy para la base de datos.

    @note
    La base de datos se encuentra en el archivo `chatgpt.db` en el directorio del proyecto.
    """
    if 'db_session' not in g:
        g.db_session = db_session
    return g.db_session

def close_db(error=None):
    """
    @brief Cierra la sesión de la base de datos.

    @details
    Cierra la sesión de SQLAlchemy almacenada en el contexto global de Flask.

    @param error Opción de capturar un error (no se utiliza en este contexto).

    @note
    La función es llamada automáticamente al finalizar la solicitud, gracias a su integración en el ciclo de vida de Flask.
    """
    db_sess = g.pop('db_session', None)
    if db_sess is not None:
        db_sess.remove()

def init_app(app):
    """
    @brief Inicializa la aplicación Flask para gestionar la base de datos.

    @details
    Integra el cierre de la sesión de SQLAlchemy en el ciclo de vida de Flask.

    @param app Instancia de la aplicación Flask.

    @note
    La función `close_db` se ejecutará automáticamente después de cada solicitud gracias a `teardown_appcontext`.
    """
    app.teardown_appcontext(close_db)
