"""! @brief Elemento principal de la aplicación FlaskChat"""
##
# @mainpage Flask Chat API
#
# @section description_main Descripción
# Aplicación backend en Flask para la generación de la API que consultará
# el frontend web de Flask Chat
#
# @section notes_main Notas
# - Notas principales del proyecto
#
# Copyright (c) 2025 Rafael Sanchez.  Todos los derechos reservados.
##
# @file app.py
#
# @brief Fichero principal de la aplicación. Punto de entrada y carga
# de los blueprint existentes
#
# @section description_flaskchat Descripción
# Un Backend conectado a la API de OpenAI para dar servicio a 
# la parte de Frontend de la aplicación Flask Chat
#
# @section libraries_main Libraries/Modules
# - time standard library (https://docs.python.org/3/library/time.html)
#   - Access to sleep function.
# - sensors module (local)
#   - Access to Sensor and TempSensor classes.
#
# @section notes_flaskchat Notas
# - Todos los comentarios deben ser compatibles con Doxygen
#
# @section todo_flaskchat TODO
# - Nada específico en el horizonte
#
# @section author_flaskchat Autor(es)
# - Created by Rafael Sanchez on 14/04/2025.
#
# Copyright (c) 2025 Rafael Sanchez.  All rights reserved.

from flask import Flask
from chatgpt_api.api.conversacion import conversacion_bp
from chatgpt_api.api.mensaje import mensaje_bp
from chatgpt_api.api.modelo import modelo_bp
from chatgpt_api.api.contexto import contexto_bp
from chatgpt_api.db import init_app
import logging
logging.basicConfig(level=logging.DEBUG)

def create_app():
    """! Inicializar el programa """
    app = Flask(__name__)
    init_app(app)

    app.register_blueprint(conversacion_bp)
    app.register_blueprint(mensaje_bp)
    app.register_blueprint(modelo_bp)
    app.register_blueprint(contexto_bp)

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5000, debug=True)
