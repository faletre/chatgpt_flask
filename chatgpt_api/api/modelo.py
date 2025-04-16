from flask import Blueprint, request, jsonify
from chatgpt_api.db import get_db

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
    db = get_db()
    cursor = db.cursor()
    cursor.execute("SELECT modelo FROM conversacion WHERE id = ?", (id,))
    row = cursor.fetchone()
    if row is None:
        return jsonify({'error': 'Conversación no encontrada'}), 404
    return jsonify({'modelo': row['modelo']})


@modelo_bp.route('/api/modelo/<int:id>', methods=['PUT'])
def actualizar_modelo(id):
    """
    @brief Actualiza el modelo asociado a una conversación específica.

    @details
    Este endpoint permite actualizar el modelo de una conversación almacenada
    en la base de datos. Se valida que el nuevo modelo sea uno de los permitidos
    (`gpt-3.5-turbo` o `gpt-4`).

    @param id Identificador único de la conversación.
    @param modelo El modelo a actualizar, que debe ser uno de los modelos permitidos.

    @return
    - 200 OK: Si el modelo se actualiza correctamente, devuelve un mensaje de éxito y el nuevo modelo.
    - 400 Bad Request: Si el modelo proporcionado no es válido.

    @note
    Los modelos permitidos son: `gpt-3.5-turbo` y `gpt-4`. Si se intenta actualizar con un modelo diferente,
    se devuelve un error 400.

    @throws Exception: Lanza una excepción si ocurre un error al actualizar la base de datos.

    @pre La conversación debe existir en la base de datos con el ID proporcionado.
    @post El modelo de la conversación será actualizado con el nuevo modelo.

    @code
    Ejemplo de solicitud:
    PUT /api/modelo/1
    {
        "modelo": "gpt-4"
    }

    Respuesta esperada:
    {
        "mensaje": "Modelo actualizado correctamente",
        "modelo": "gpt-4"
    }
    @endcode
    """
    db = get_db()
    cursor = db.cursor()
    data = request.get_json()
    nuevo_modelo = data.get('modelo')
    modelos_permitidos = ['gpt-3.5-turbo', 'gpt-4']
    if nuevo_modelo not in modelos_permitidos:
        return jsonify({'error': f'Modelo no válido. Modelos permitidos: {", ".join(modelos_permitidos)}'}), 400
    cursor.execute("UPDATE conversacion SET modelo = ? WHERE id = ?", (nuevo_modelo, id))
    db.commit()
    return jsonify({'mensaje': 'Modelo actualizado correctamente', 'modelo': nuevo_modelo})
