import openai
import os
import tiktoken
import logging

'''! @brief La clave de la API de la cuenta a la que está conectada la aplicación FlaskChat'''
openai.api_key = os.getenv('OPENAI_API_KEY')
logger = logging.getLogger(__name__)

def obtener_respuesta_openai(mensajes_historial, modelo):
    """
    @brief Obtiene la respuesta de OpenAI para un conjunto de mensajes.

    @details
    Esta función envía el historial de mensajes a la API de OpenAI para obtener una respuesta del modelo especificado.
    Se utiliza el modelo indicado para generar una respuesta basada en los mensajes previos. El parámetro `modelo` 
    puede ser un modelo como `gpt-3.5-turbo` o `gpt-4`.

    @param mensajes_historial Lista de diccionarios que contienen el historial de mensajes. Cada mensaje debe tener
    un campo `role` ('user' o 'assistant') y un campo `content` con el contenido del mensaje.

    @param modelo Nombre del modelo de OpenAI que se utilizará para generar la respuesta (e.g., "gpt-3.5-turbo").

    @return
    - String con la respuesta generada por el modelo de OpenAI.

    @throws Exception Si ocurre un error al interactuar con la API de OpenAI, se registrará el error y se devolverá 
    un mensaje indicando el fallo.

    @note
    La función realiza una solicitud a OpenAI usando el método `openai.chat.completions.create`, y tiene configurado 
    un límite de tokens de 550.

    @code
    Ejemplo de uso:
    respuesta = obtener_respuesta_openai(mensajes_historial, "gpt-3.5-turbo")
    @endcode
    """

    logger.info(f"El modelo utilizado es: {modelo}")
    try:
        response = openai.chat.completions.create(
            model=modelo,
            messages=mensajes_historial,
            max_tokens=550,
            temperature=0.7,
        )
        return response.choices[0].message.content
    except Exception as e:
        logger.error(f"Error al obtener respuesta de OpenAI: {str(e)}")
        return f"Error al obtener respuesta de OpenAI: {str(e)}"

def obtener_resumen_historial(mensajes_historial):
    """
    @brief Obtiene un resumen del historial de mensajes.

    @details
    Esta función envía el historial de mensajes a la API de OpenAI para obtener un resumen de los mensajes de manera
    concisa y clara. El resumen se realiza utilizando el modelo `gpt-3.5-turbo`.

    @param mensajes_historial Lista de diccionarios que contienen el historial de mensajes. Cada mensaje debe tener
    un campo `role` ('user' o 'assistant') y un campo `content` con el contenido del mensaje.

    @return
    - String con el resumen generado por el modelo de OpenAI.

    @throws Exception Si ocurre un error al interactuar con la API de OpenAI, se registrará el error y se devolverá 
    un mensaje indicando el fallo.

    @note
    El modelo utilizado para resumir es `gpt-3.5-turbo` y tiene configurado un límite de tokens de 500.

    @code
    Ejemplo de uso:
    resumen = obtener_resumen_historial(mensajes_historial)
    @endcode
    """
    try:
        resumen = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{'role': 'system', 'content': 'Resuma los siguientes mensajes de forma clara y concisa'}] + mensajes_historial,
            max_tokens=500,
            temperature=0.7,
        )
        return resumen.choices[0].message.content
    except Exception as e:
        logger.error(f"Error al obtener resumen de OpenAI: {str(e)}")
        return f"Error: {str(e)}"

def contar_tokens(mensajes, modelo="gpt-3.5-turbo"):
    """
    @brief Cuenta el número de tokens utilizados por un conjunto de mensajes.

    @details
    Esta función calcula el número de tokens necesarios para enviar un conjunto de mensajes a la API de OpenAI. 
    El número de tokens es importante para determinar si se excede el límite de tokens del modelo. 
    La función toma en cuenta el modelo utilizado, dado que la codificación y el número de tokens varían entre 
    diferentes modelos.

    @param mensajes Lista de diccionarios que contienen el historial de mensajes. Cada mensaje debe tener
    un campo `content` con el contenido del mensaje.

    @param modelo Nombre del modelo de OpenAI que se utilizará para calcular los tokens (e.g., "gpt-3.5-turbo").

    @return
    - Integer que representa el número total de tokens utilizados por los mensajes.

    @note
    La función utiliza el paquete `tiktoken` para calcular los tokens de manera precisa.

    @code
    Ejemplo de uso:
    tokens = contar_tokens(mensajes_historial, "gpt-3.5-turbo")
    @endcode
    """
    encoding = tiktoken.encoding_for_model(modelo)
    tokens = 0
    for msg in mensajes:
        tokens += 4  # El número de tokens por cada mensaje (aproximación inicial).
        tokens += len(encoding.encode(msg.get("content", "")))  # Tokens del contenido del mensaje.
    tokens += 2  # Para los tokens de inicio y fin del mensaje.
    return tokens
