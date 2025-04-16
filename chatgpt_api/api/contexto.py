from flask import Blueprint, request, jsonify
from chatgpt_api.db import get_db

contexto_bp = Blueprint('contexto', __name__)

@contexto_bp.route('/api/contexto/<int:id>', methods=['POST'])
def toggle_contexto(id):
    """
    @brief Cambia el estado del contexto de una conversación específica.

    @details
    Este endpoint permite alternar el estado del contexto de una conversación en la base de datos.
    Si el contexto está desactivado (`False`), se activa (`True`), y si está activado, se desactiva.

    @param id Identificador único de la conversación cuya configuración de contexto se quiere modificar.

    @return
    - 200 OK: Si la operación es exitosa, devuelve el nuevo estado del contexto.
    - 404 Not Found: Si no se encuentra una conversación con el ID proporcionado.

    @note
    Si la conversación con el ID proporcionado no existe, se devuelve un error 404.

    @code
    Ejemplo de solicitud:
    POST /api/contexto/1

    Respuesta esperada:
    {
        "contexto": true
    }
    @endcode
    """
    db = get_db()
    cursor = db.cursor()
    cursor.execute("SELECT contexto FROM conversacion WHERE id = ?", (id,))
    row = cursor.fetchone()
    if row is None:
        return jsonify({'error': 'Conversación no encontrada'}), 404
    nuevo_estado = not bool(row['contexto'])
    cursor.execute("UPDATE conversacion SET contexto = ? WHERE id = ?", (nuevo_estado, id))
    db.commit()
    return jsonify({'contexto': nuevo_estado})


@contexto_bp.route('/api/contexto/<int:id>', methods=['GET'])
def obtener_contexto(id):
    """
    @brief Recupera el estado del contexto de una conversación específica.

    @details
    Este endpoint permite obtener el estado del contexto asociado a una conversación.
    El contexto se guarda como un valor booleano (`True` o `False`).

    @param id Identificador único de la conversación cuya configuración de contexto se quiere consultar.

    @return
    - 200 OK: Si la operación es exitosa, devuelve el estado actual del contexto.
    - 404 Not Found: Si no se encuentra una conversación con el ID proporcionado.

    @note
    Si la conversación con el ID proporcionado no existe, se devuelve un error 404.

    @code
    Ejemplo de solicitud:
    GET /api/contexto/1

    Respuesta esperada:
    {
        "contexto": true
    }
    @endcode
    """
    db = get_db()
    cursor = db.cursor()
    cursor.execute("SELECT contexto FROM conversacion WHERE id = ?", (id,))
    row = cursor.fetchone()
    if row is None:
        return jsonify({'error': 'Conversación no encontrada'}), 404
    return jsonify({'contexto': bool(row['contexto'])})
