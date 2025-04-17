/**
 * @fileoverview Archivo principal que inicializa la aplicación
 * @module main
 * 
 * @note
 * static/js/
 * ├── modules/
 * │   ├── api.js          # Gestión de llamadas a la API
 * │   ├── ui.js           # Gestión de la interfaz de usuario
 * │   ├── events.js       # Gestión de eventos
 * │   └── conversation.js # Gestión de conversaciones
 * ├── main.js             # Archivo principal
 * └── prism.min.js        # (existente)
 */

import { UI } from './modules/ui.js';
import { EventHandler } from './modules/events.js';
import { ConversationManager } from './modules/conversation.js';

/**
 * @function initApp
 * @description Inicializa todos los componentes de la aplicación
 */
async function initApp() {
    UI.init();
    EventHandler.init();
    await ConversationManager.init();
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initApp);
