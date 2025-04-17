import openai
import os
import tiktoken
import logging
import json
from datetime import datetime, timedelta
import requests

'''! @brief La clave de la API de la cuenta a la que está conectada la aplicación FlaskChat'''
openai.api_key = os.getenv('OPENAI_API_KEY')
logger = logging.getLogger(__name__)

# --- INICIO: Gestión de caché de modelos OpenAI ---
'''
@file openai_service.py
@brief Gestión de la caché de modelos de OpenAI y funciones auxiliares para refresco y consulta.
'''

'''
@brief Archivo de caché de modelos de OpenAI.
El archivo se utiliza para almacenar la lista de modelos disponibles y la fecha de última actualización.
'''
CACHE_FILE = os.path.join(os.path.dirname(__file__), "models_cache.json")

'''
@brief Número de días después de los cuales se considera que la caché de modelos está obsoleta.
Si han pasado más días que este valor desde la última actualización, se refresca la caché.
'''
CACHE_REFRESH_DAYS = 14

'''
@brief Caché de modelos de OpenAI.
La caché almacena la lista de modelos disponibles y la fecha de última actualización.
'''
models_cache = {
    "models": [],
    "last_update": None
}

'''
@brief Carga la caché de modelos desde disco, si existe.
@return True si la caché se cargó correctamente, False en caso contrario.
'''
def load_cache_from_disk():
    """Carga la caché de modelos desde disco, si existe."""
    if not os.path.exists(CACHE_FILE):
        logger.debug(f"Cache file {CACHE_FILE} does not exist.")
        return False
    try:
        with open(CACHE_FILE, "r") as f:
            global models_cache
            models_cache = json.load(f)
            logger.debug(f"Loaded models cache from disk: {models_cache.get('last_update')}")
        return True
    except Exception as e:
        logger.debug(f"Error loading cache file: {e}")
        return False

'''
@brief Guarda la caché de modelos en disco.
'''
def save_cache_to_disk():
    """Guarda la caché de modelos en disco."""
    try:
        with open(CACHE_FILE, "w") as f:
            json.dump(models_cache, f, default=str)
            logger.debug(f"Saved models cache to disk at {models_cache.get('last_update')}")
    except Exception as e:
        logger.debug(f"Error saving cache file: {e}")

'''
@brief Comprueba si la caché de modelos necesita ser refrescada.
@return True si la caché está obsoleta o no existe, False si está actualizada.
'''
def cache_needs_refresh():
    """
    Devuelve True si han pasado más de CACHE_REFRESH_DAYS desde la última actualización
    (usando preferentemente el campo last_update del JSON), o si hay algún problema.
    """
    if not os.path.exists(CACHE_FILE):
        logger.debug("Cache file does not exist, refresh needed.")
        return True
    try:
        with open(CACHE_FILE, "r") as f:
            cache = json.load(f)
            last_update = cache.get("last_update")
            if last_update:
                last_update_dt = datetime.fromisoformat(last_update)
                age = datetime.utcnow() - last_update_dt
                logger.debug(f"Cache last_update age: {age.days} days")
                return age > timedelta(days=CACHE_REFRESH_DAYS)
            else:
                # Fallback: usar mtime del fichero si no hay last_update
                mtime = datetime.fromtimestamp(os.path.getmtime(CACHE_FILE))
                age = datetime.utcnow() - mtime
                logger.debug(f"Cache file mtime age: {age.days} days (no last_update in cache)")
                return age > timedelta(days=CACHE_REFRESH_DAYS)
    except Exception as e:
        logger.debug(f"Error reading cache file: {e}")
        return True

'''
@brief Consulta la API de OpenAI para obtener la lista de modelos, actualiza la caché y la guarda en disco.
'''
def fetch_openai_models():
    """Consulta la API de OpenAI, actualiza la caché y la guarda en disco."""
    logger.debug("Fetching models from OpenAI API...")
    api_key = os.getenv("OPENAI_API_KEY")
    headers = {"Authorization": f"Bearer {api_key}"}
    response = requests.get("https://api.openai.com/v1/models", headers=headers)
    response.raise_for_status()
    data = response.json()
    logger.debug(f"Respuesta completa de la API de modelos OpenAI: {json.dumps(data, indent=2, ensure_ascii=False)}")
    models_cache["models"] = data.get("data", [])
    models_cache["last_update"] = datetime.utcnow().isoformat()
    logger.debug(f"Fetched {len(models_cache['models'])} models from OpenAI.")
    save_cache_to_disk()

'''
@brief Inicializa la caché de modelos al arrancar el servidor.
Sólo consulta OpenAI si han pasado más de CACHE_REFRESH_DAYS desde el último refresco.
'''
def initialize_models_cache():
    """
    Inicializa la caché de modelos al arrancar el servidor.
    Solo consulta OpenAI si han pasado más de CACHE_REFRESH_DAYS desde el último refresco.
    """
    if cache_needs_refresh():
        logger.debug("Cache is stale or missing. Updating...")
        fetch_openai_models()
    else:
        logger.debug("Cache is fresh. Loading from disk.")
        load_cache_from_disk()

'''
@brief Devuelve la lista de modelos disponibles (lista de dicts).
@return Lista de modelos disponibles en la caché.
'''
def get_available_models():
    """Devuelve la lista de modelos disponibles (lista de dicts)."""
    return models_cache["models"]
# --- FIN: Gestión de caché de modelos OpenAI ---

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
    un límite de tokens de 1550.

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
            max_tokens=1550,
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

initialize_models_cache()
