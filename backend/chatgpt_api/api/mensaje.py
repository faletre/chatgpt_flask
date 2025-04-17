import logging
from flask import Blueprint, request, jsonify
from chatgpt_api.db import get_db
from chatgpt_api.models import Mensaje, Conversacion
from chatgpt_api.services.openai_service import obtener_respuesta_openai, obtener_resumen_historial, contar_tokens

mensaje_bp = Blueprint('mensaje', __name__)

@mensaje_bp.route('/api/chat/<int:id>', methods=['GET'])
def obtener_mensajes(id):
    """
    @brief Recupera los mensajes de una conversación específica.

    @details
    Este endpoint permite obtener todos los mensajes asociados a una conversación 
    específica en orden de fecha de creación. Devuelve tanto los mensajes de los usuarios 
    como los del sistema (si existen).

    @param id Identificador único de la conversación cuyos mensajes se desean obtener.

    @return
    - 200 OK: Devuelve una lista de mensajes de la conversación en formato JSON.

    @note
    El historial de mensajes se devuelve ordenado por la fecha de creación de cada mensaje.
    Incluye información de si el mensaje es del usuario o de OpenAI (es_usuario)

    @code
    Ejemplo de solicitud:
    GET /api/chat/123

    Respuesta esperada:
    [
        {
            "mensaje": "Hola, ¿cómo estás?",
            "es_usuario": true,
            "fecha_creacion": "2025-04-14T10:00:00"
        },
        ...
    ]
    @endcode
    """
    db_session = get_db()
    mensajes = db_session.query(Mensaje).filter_by(conversacion_id=id).order_by(Mensaje.fecha_creacion).all()
    resultado = [
        {
            'mensaje': m.mensaje,
            'es_usuario': bool(m.es_usuario),
            'fecha_creacion': m.fecha_creacion.isoformat() if m.fecha_creacion else None
        }
        for m in mensajes
    ]
    logging.info(f"[DEBUG] Mensajes recuperados: {resultado}")
    return jsonify(resultado)

@mensaje_bp.route('/api/chat/<int:id>', methods=['POST'])
def enviar_mensaje(id):
    """
    @brief Envía un mensaje de usuario y obtiene la respuesta del asistente.

    @details
    Este endpoint permite enviar un mensaje de usuario a la conversación especificada.
    Después de recibir el mensaje, el sistema genera una respuesta utilizando la API de OpenAI.
    Si el contexto está activado, se conserva el historial de mensajes, y si el número de tokens 
    excede el límite, el historial se resume. El modelo de conversación también se consulta 
    antes de generar una respuesta.

    @param id Identificador único de la conversación a la que se está enviando el mensaje.

    @return
    - 200 OK: Si el mensaje es procesado correctamente, devuelve la respuesta del asistente en formato JSON.
    - 400 Bad Request: Si el mensaje proporcionado está vacío.
    - 500 Internal Server Error: Si ocurre un error al comunicarse con OpenAI.

    @note
    Si el contexto está activado en la conversación, el sistema almacenará y procesará el historial de mensajes.
    Si se excede el límite de tokens, el historial será resumido para ajustarse al límite.

    @code
    Ejemplo de solicitud:
    POST /api/chat/123
    {
        "mensaje": "¿Cómo puedo integrar la API de OpenAI?"
    }

    Respuesta esperada:
    {
        "respuesta": "Para integrar la API de OpenAI, necesitas obtener una clave de API..."
    }
    @endcode
    """
    data = request.get_json()
    mensaje_usuario = data.get('mensaje')
    if not mensaje_usuario:
        return jsonify({'error': 'Mensaje vacío'}), 400

    db_session = get_db()
    mensajes_db = db_session.query(Mensaje).filter_by(conversacion_id=id).order_by(Mensaje.fecha_creacion).all()
    mensajes_historial = [
        {'role': 'user' if msg.es_usuario else 'assistant', 'content': msg.mensaje}
        for msg in mensajes_db
    ]
    conv = db_session.query(Conversacion).filter_by(id=id).first()
    if not conv:
        return jsonify({'error': 'Conversación no encontrada'}), 404
    contexto_activado = conv.contexto
    if contexto_activado:
        mensajes_historial.append({'role': 'user', 'content': mensaje_usuario})
        num_tokens = contar_tokens(mensajes_historial)
        if num_tokens > 1000:
            resumen = obtener_resumen_historial(mensajes_historial)
            mensajes_historial = [{'role': 'user', 'content': mensaje_usuario}, {'role': 'assistant', 'content': resumen}]
    else:
        mensajes_historial = [{'role': 'user', 'content': mensaje_usuario}]
    modelo = conv.modelo
    if not any(msg['role'] == 'system' for msg in mensajes_historial):
        mensajes_historial.insert(0, {"role": "system", "content": "Salida formato Markdown"})
    logging.info(f"[DEBUG] Enviando historial al modelo {modelo}.")
    respuesta = obtener_respuesta_openai(mensajes_historial, modelo)
    if "Error" in respuesta:
        return jsonify({'error': respuesta}), 500
    nuevo_mensaje = Mensaje(conversacion_id=id, mensaje=mensaje_usuario, es_usuario=True)
    db_session.add(nuevo_mensaje)
    nuevo_mensaje_ia = Mensaje(conversacion_id=id, mensaje=respuesta, es_usuario=False)
    db_session.add(nuevo_mensaje_ia)
    db_session.commit()
    return jsonify({'respuesta': respuesta})
