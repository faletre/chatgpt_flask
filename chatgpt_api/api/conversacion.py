from flask import Blueprint, request, jsonify
from chatgpt_api.db import get_db
from chatgpt_api.models import Conversacion, Mensaje

def conversacion_to_dict(conv):
    return {
        'id': conv.id,
        'nombre': conv.nombre,
        'fecha_creacion': conv.fecha_creacion.isoformat() if conv.fecha_creacion else None
    }

conversacion_bp = Blueprint('conversacion', __name__)

@conversacion_bp.route('/api/chat', methods=['POST'])
def nueva_conversacion():
    """
    @brief Crea una nueva conversación en la base de datos.

    @details
    Este endpoint permite crear una nueva conversación. El nombre de la conversación
    se puede especificar en la solicitud, o se asignará el nombre "Nueva Conversación" 
    por defecto si no se proporciona. La nueva conversación se almacena en la base de datos 
    y se devuelve el ID generado y el nombre asignado.

    @param nombre Nombre de la nueva conversación. Si no se proporciona, se utiliza el valor predeterminado "Nueva Conversación".

    @return
    - 201 Created: Si la conversación se crea correctamente, devuelve el ID y el nombre de la nueva conversación.

    @note
    El nombre de la conversación es opcional. Si no se especifica en la solicitud, se utilizará el valor predeterminado.

    @code
    Ejemplo de solicitud:
    POST /api/chat
    {
        "nombre": "Mi Conversación"
    }

    Respuesta esperada:
    {
        "id": 123,
        "nombre": "Mi Conversación"
    }
    @endcode
    """
    data = request.get_json()
    nombre = data.get('nombre', 'Nueva Conversación')
    db_session = get_db()
    nueva_conv = Conversacion(nombre=nombre)
    db_session.add(nueva_conv)
    db_session.commit()
    return jsonify({'id': nueva_conv.id, 'nombre': nueva_conv.nombre}), 201


@conversacion_bp.route('/api/historial', methods=['GET'])
def historial():
    """
    @brief Recupera el historial de todas las conversaciones.

    @details
    Este endpoint devuelve una lista de todas las conversaciones almacenadas en la base de datos, 
    ordenadas por fecha de creación en orden descendente. Cada conversación incluye su ID, nombre 
    y fecha de creación.

    @return
    - 200 OK: Devuelve un historial de conversaciones en formato JSON.

    @code
    Ejemplo de solicitud:
    GET /api/historial

    Respuesta esperada:
    [
        {
            "id": 123,
            "nombre": "Mi Conversación",
            "fecha_creacion": "2025-04-14T10:00:00"
        },
        ...
    ]
    @endcode
    """
    db_session = get_db()
    conversaciones = db_session.query(Conversacion).order_by(Conversacion.fecha_creacion.desc()).all()
    resultados = [conversacion_to_dict(conv) for conv in conversaciones]
    return jsonify(resultados)


@conversacion_bp.route('/api/eliminar_conversacion/<int:id>', methods=['DELETE'])
def eliminar_conversacion(id):
    """
    @brief Elimina una conversación y sus mensajes asociados.

    @details
    Este endpoint permite eliminar una conversación de la base de datos, incluyendo todos los
    mensajes que estén relacionados con dicha conversación. Se utiliza típicamente cuando
    el usuario desea limpiar su historial o descartar una conversación que ya no es relevante.

    @param id ID numérico de la conversación a eliminar.

    @return
    - 200 OK: Si la conversación y sus mensajes fueron eliminados correctamente.
        @code
        {
            "mensaje": "Conversación eliminada correctamente"
        }
        @endcode
    - 404 Not Found: Si la conversación no existe (no se valida explícitamente en esta función).

    @pre La conversación con el ID indicado debe existir en la base de datos.
    @post La conversación y todos sus mensajes asociados son eliminados permanentemente.

    @throws
    Puede lanzar una excepción si ocurre un error durante la ejecución de las operaciones de base de datos.

    @note
    Este endpoint realiza dos operaciones de borrado: una para los mensajes y otra para la conversación.
    El borrado se efectúa de forma transaccional.
    """
    db_session = get_db()
    conv = db_session.query(Conversacion).filter_by(id=id).first()
    if conv:
        db_session.delete(conv)
        db_session.commit()
        return jsonify({'mensaje': 'Conversación eliminada correctamente'})
    else:
        return jsonify({'error': 'Conversación no encontrada'}), 404


@conversacion_bp.route('/api/cambiar_nombre_conversacion/<int:id>', methods=['PUT'])
def cambiar_nombre(id):
    """
    @brief Cambia el nombre de una conversación existente.

    @details
    Este endpoint permite actualizar el nombre de una conversación específica. Es útil cuando
    el usuario desea renombrar una conversación para identificarla más fácilmente.

    @param id ID numérico de la conversación que se desea actualizar.
    @param nombre Nuevo nombre que se asignará a la conversación. Este valor debe ser
    proporcionado en el cuerpo de la solicitud como JSON:
        @code
        {
            "nombre": "Mi nueva conversación"
        }
        @endcode

    @return
    - 200 OK: Si el nombre fue actualizado correctamente.
        @code
        {
            "mensaje": "Nombre actualizado correctamente",
            "nuevo_nombre": "Mi nueva conversación"
        }
        @endcode
    - 400 Bad Request: Si no se proporciona un nuevo nombre válido.

    @pre La conversación con el ID proporcionado debe existir en la base de datos.
    @post El campo `nombre` de la conversación es actualizado con el nuevo valor indicado.

    @throws
    Puede lanzar una excepción si ocurre un error durante la ejecución de la operación de actualización en la base de datos.

    @note
    El nuevo nombre debe enviarse como una cadena en formato JSON dentro del cuerpo del request.
    """
    data = request.get_json()
    nuevo_nombre = data.get('nombre')
    if not nuevo_nombre:
        return jsonify({'error': 'Nombre vacío'}), 400

    db_session = get_db()
    conv = db_session.query(Conversacion).filter_by(id=id).first()
    if conv:
        conv.nombre = nuevo_nombre
        db_session.commit()
        return jsonify({'mensaje': 'Nombre actualizado correctamente', 'nuevo_nombre': nuevo_nombre})
    else:
        return jsonify({'error': 'Conversación no encontrada'}), 404
