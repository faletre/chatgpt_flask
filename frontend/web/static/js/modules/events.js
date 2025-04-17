/**
 * @fileoverview Módulo para gestionar los eventos de la aplicación
 * @module events
 */

import { API } from './api.js';
import { UI } from './ui.js';
import { ConversationManager } from './conversation.js';

export const EventHandler = {
    /**
     * @function init
     * @description Inicializa los manejadores de eventos
     */
    init() {
        this.setupMessageEvents();
        this.setupConversationEvents();
    },

    /**
     * @function setupMessageEvents
     * @description Configura los eventos relacionados con mensajes
     */
    setupMessageEvents() {
        const sendBtn = document.getElementById("send-btn");
        const messageInput = document.getElementById("message-input");

        sendBtn.addEventListener("click", () => this.handleSendMessage());

        messageInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                this.handleSendMessage();
            }
        });
    },

    /**
     * @function setupConversationEvents
     * @description Configura los eventos relacionados con conversaciones
     */
    setupConversationEvents() {
        const newConversationBtn = document.getElementById("new-conversation-btn");
        if (newConversationBtn) {
            newConversationBtn.addEventListener("click", () => {
                ConversationManager.createNewConversation();
            });
        }
    },

    /**
     * @function handleSendMessage
     * @description Maneja el envío de mensajes
     */
    async handleSendMessage() {
        const input = document.getElementById("message-input");
        const text = input.value.trim();
        
        if (!text) return;

        const conversationId = ConversationManager.getActiveConversationId();
        if (!conversationId) return;

        // Mostrar mensaje del usuario
        await UI.renderMessage({ 
            mensaje: text,
            es_usuario: 1,
            fecha_creacion: new Date().toISOString()
        });
        input.value = '';
        input.style.height = "auto";

        try {
            const response = await API.sendMessage(conversationId, text);
            await UI.renderMessage({ 
                mensaje: response.mensaje, // Ahora response.mensaje contiene la respuesta
                es_usuario: 0,
                fecha_creacion: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error al enviar mensaje:', error);
            await UI.renderMessage({ 
                mensaje: 'Error al enviar el mensaje. Por favor, intenta de nuevo.',
                es_usuario: 0,
                fecha_creacion: new Date().toISOString()
            });
        }
    }
};
