# ------------------------------
# @brief Blueprint para herramientas GPT-4
#
# @details
# Este módulo agrupa los endpoints relacionados con la gestión de archivos
# que serán utilizados con el modelo GPT-4 a través de la API de OpenAI.
#
# Define varias rutas de la API que permiten interactuar con los archivos,
# como su eliminación, carga, y otros procesos relacionados.
#
# @note
# Asegúrese de tener acceso a la API de OpenAI para usar este Blueprint correctamente.
#
# @version 1.0
# @author RASG
##
# @file tools.py

from flask import Blueprint, request, jsonify
import openai

# Definición del Blueprint
tools_bp = Blueprint('tools', __name__, url_prefix='/api/tools')


@tools_bp.route('/list', methods=['GET'])
def list_openai_files():
    '''
    @brief Recupera la lista de archivos subidos a la API de OpenAI.

    Este endpoint recupera la lista de archivos que han sido subidos a la API de OpenAI,
    filtrando únicamente aquellos cuyo propósito sea "assistants". Esto evita incluir archivos
    de fine-tuning u otros usos no relevantes para el sistema de asistentes.

    @details
    Esta función realiza una solicitud GET a la API de OpenAI para obtener la lista completa de archivos
    subidos. Luego filtra los archivos para incluir solo aquellos cuyo propósito es 'assistants', y retorna
    la lista filtrada de archivos como un objeto JSON.

    @note
    Este endpoint no requiere parámetros en la solicitud, y solo devuelve archivos relacionados con el uso
    de asistentes en la API de OpenAI.

    @return
    - 200 OK: Retorna una lista de archivos cuyo propósito es 'assistants'. Cada archivo tiene los siguientes campos:
        - id: Identificador único del archivo.
        - filename: Nombre del archivo.
        - purpose: Propósito del archivo (solo 'assistants' será incluido).
        - status: Estado del archivo (ej. 'processed').
        - created_at: Fecha de creación del archivo en formato timestamp.

    - 500 Internal Server Error: Si ocurre un error al intentar obtener la lista de archivos de la API de OpenAI.

    @code
    Ejemplo de respuesta:
    [
        {
            "id": "file-abc123",
            "filename": "documento.pdf",
            "purpose": "assistants",
            "status": "processed",
            "created_at": 1710000000
        },
        ...
    ]
    @endcode

    @note
    - 500: Error al comunicarse con la API de OpenAI o al procesar la respuesta.
    '''
    try:
        #! Solicita a la API de OpenAI la lista completa de archivos subidos
        response = openai.files.list()

        #! Procesa los archivos recibidos, filtrando sólo aquellos con propósito 'assistants'
        files_info = [
            {
                'id': f.id,
                'filename': f.filename,
                'purpose': f.purpose,
                'status': f.status,
                'created_at': f.created_at,
            }
            for f in response.data
            if f.purpose == 'assistants'  # <-- Filtro relevante
        ]

        #! Retorna la lista procesada de archivos como JSON
        return jsonify(files_info)

    except Exception as e:
        #! En caso de error, devuelve un error 500
        return jsonify({'error': str(e)}), 500

@tools_bp.route('/upload', methods=['POST'])
def upload_file_to_openai():
    """
    @brief Carga un archivo a la API de OpenAI.

    Este endpoint permite cargar un archivo a la API de OpenAI, lo que hace posible
    su uso con los modelos de OpenAI, incluyendo GPT-4. El archivo debe ser enviado
    en el cuerpo de la solicitud bajo el formato adecuado (multipart/form-data).

    @details
    El archivo cargado se almacena en la infraestructura de OpenAI y puede ser utilizado
    para tareas asociadas con el modelo GPT-4. El endpoint espera un archivo y un propósito
    (como "assistants") como parámetros.

    @param file Archivo que se va a cargar a la API de OpenAI.

    @return
    - 200 OK: Si el archivo se carga correctamente, se devuelve un objeto JSON con
              el ID del archivo y otros detalles asociados.
    - 400 Bad Request: Si el archivo no se proporciona o no es válido.
    - 500 Internal Server Error: Si ocurre un error durante el proceso de carga.

    @note
    - 400: Si no se envía un archivo válido en la solicitud.
    - 500: Error al comunicarse con la API de OpenAI.
    """
    try:
        #! Se obtiene el archivo desde la solicitud POST
        file = request.files.get('file')

        if not file:
            return jsonify({'error': 'No se proporcionó el archivo'}), 400

        #! Carga el archivo en la API de OpenAI
        response = openai.files.create(file=file, purpose='assistants')

        #! Retorna la información del archivo cargado
        return jsonify({
            'id': response.id,
            'filename': response.filename,
            'purpose': response.purpose,
            'status': response.status,
            'created_at': response.created_at
        })

    except Exception as e:
        #! En caso de error, se maneja el error y se devuelve un código 500
        return jsonify({'error': str(e)}), 500


@tools_bp.route('/delete', methods=['POST'])
def delete_file_from_openai():
    """
    @brief Elimina un archivo previamente subido a la API de OpenAI.

    Esta ruta permite eliminar un archivo que ha sido previamente cargado a la API de OpenAI.
    Es útil cuando ya no se necesita el archivo o se desea liberar espacio en el sistema.

    @details
    Esta función espera recibir una solicitud POST con un JSON en el cuerpo que contiene el ID de archivo (`file_id`) a eliminar.
    La respuesta será un objeto JSON confirmando si la eliminación fue exitosa, junto con el ID del archivo eliminado.

    @param file_id Identificador del archivo que se desea eliminar.

    @return
    - 200 OK: Si el archivo fue eliminado correctamente, devuelve un objeto JSON con la propiedad `deleted` igual a `true`
              y el `id` del archivo eliminado.
    - 400 Bad Request: Si no se proporciona el parámetro `file_id`.
    - 500 Internal Server Error: Si ocurre un error al intentar eliminar el archivo en la API de OpenAI.

    @note
    El parámetro `file_id` debe ser una cadena de texto representando el identificador único del archivo en OpenAI.

    @throws
    Lanzará una excepción si ocurre un error durante la interacción con la API de OpenAI.

    @pre El archivo debe haber sido previamente cargado en la API de OpenAI.
    @post El archivo será eliminado de manera permanente si se encuentra y se elimina correctamente.

    @code
    Ejemplo de solicitud:
    POST /api/tools/delete
    {
        "file_id": "file-abc123"
    }

    Respuesta esperada:
    {
        "deleted": true,
        "id": "file-abc123"
    }
    @endcode

    @note
    - 400: El `file_id` es obligatorio.
    - 500: Error al comunicarse con OpenAI.
    """
    data = request.get_json()
    file_id = data.get('file_id')

    #! Validamos que se haya enviado un ID de archivo
    if not file_id:
        return jsonify({'error': 'Falta el file_id'}), 400

    try:
        #! Se solicita el borrado del archivo en la API de OpenAI
        response = openai.files.delete(file_id)

        #! Se devuelve la confirmación del borrado
        return jsonify({
            'deleted': response.deleted,
            'id': response.id
        })

    except Exception as e:
        #! Cualquier excepción se maneja devolviendo un error genérico de servidor
        return jsonify({'error': str(e)}), 500
