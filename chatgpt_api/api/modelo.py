from flask import Blueprint, request, jsonify
from chatgpt_api.db import get_db
from chatgpt_api.models import Conversacion
from chatgpt_api.services.openai_service import get_available_models

modelo_bp = Blueprint('modelo', __name__)

@modelo_bp.route('/api/modelo/<int:id>', methods=['GET'])
def obtener_modelo(id):
    """
    @brief Recupera el modelo asociado a una conversación específica.

    @details
    Este endpoint permite obtener el modelo que está asociado a una conversación
    en la base de datos. La búsqueda se realiza mediante el ID de la conversación.

    @param id Identificador único de la conversación.

    @return
    - 200 OK: Si la conversación se encuentra, devuelve el modelo asociado.
    - 404 Not Found: Si no se encuentra una conversación con el ID proporcionado.

    @note
    Si el ID de la conversación no existe en la base de datos, se retornará un error 404.

    @code
    Ejemplo de solicitud:
    GET /api/modelo/1

    Respuesta esperada:
    {
        "modelo": "gpt-3.5-turbo"
    }
    @endcode
    """
    db_session = get_db()
    conv = db_session.query(Conversacion).filter_by(id=id).first()
    if conv is None:
        return jsonify({'error': 'Conversación no encontrada'}), 404
    return jsonify({'modelo': conv.modelo})


@modelo_bp.route('/api/modelo/<int:id>', methods=['PUT'])
def actualizar_modelo(id):
    """
    @brief Actualiza el modelo asociado a una conversación específica.

    @details
    Este endpoint permite actualizar el modelo de una conversación almacenada
    en la base de datos. Se valida que el nuevo modelo sea uno de los permitidos
    (dinámicamente desde la caché OpenAI).

    @param id Identificador único de la conversación.
    @param modelo El modelo a actualizar, que debe ser uno de los modelos permitidos.

    @return
    - 200 OK: Si el modelo se actualiza correctamente, devuelve un mensaje de éxito y el nuevo modelo.
    - 400 Bad Request: Si el modelo proporcionado no es válido.
    """
    db_session = get_db()
    data = request.get_json()
    nuevo_modelo = data.get('modelo')
    modelos_disponibles = [m["id"] for m in get_available_models()]
    if nuevo_modelo not in modelos_disponibles:
        return jsonify({'error': 'Modelo no permitido'}), 400
    conv = db_session.query(Conversacion).filter_by(id=id).first()
    if conv is None:
        return jsonify({'error': 'Conversación no encontrada'}), 404
    conv.modelo = nuevo_modelo
    db_session.commit()
    return jsonify({'mensaje': 'Modelo actualizado correctamente', 'modelo': conv.modelo})

# Endpoint para obtener la lista de modelos disponibles
@modelo_bp.route('/api/models', methods=['GET'])
def listar_modelos():
    """
    @brief Devuelve la lista de modelos disponibles (dinámicamente desde la caché OpenAI).
    """
    modelos = get_available_models()
    return jsonify({"models": modelos})
