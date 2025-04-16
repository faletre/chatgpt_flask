/**
 * @fileoverview Módulo para gestionar las llamadas a la API
 * @module api
 */

export const API = {
    /**
     * @function updateConversationName
     * @description Actualiza el nombre de una conversación
     * @param {number} id - ID de la conversación
     * @param {string} newName - Nuevo nombre para la conversación
     */
    async updateConversationName(id, newName) {
        const response = await fetch(`/api/cambiar_nombre_conversacion/${id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nombre: newName })
        });
        if (!response.ok) throw new Error('Error al actualizar el nombre de la conversación');
        return response.json();
    },

    /**
     * @function deleteConversation
     * @description Elimina una conversación
     * @param {number} id - ID de la conversación
     */
    async deleteConversation(id) {
        const response = await fetch(`/api/eliminar_conversacion/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Error al eliminar la conversación');
        return response.json();
    },

    /**
     * @function loadConversations
     * @description Carga las conversaciones desde el servidor
     * @returns {Promise} Promesa que resuelve con las conversaciones
     */
    async loadConversations() {
        //console.log("[DEBUG API] Solicitando lista de conversaciones...");
        const response = await fetch("/api/historial");
        if (!response.ok) {
            console.error("[ERROR API] Error al obtener conversaciones:", response.status);
            throw new Error(`Error HTTP: ${response.status}`);
        }
        const data = await response.json();
        //console.log("[DEBUG API] Conversaciones recibidas:", data);
        return data;
    },

    /**
     * @function loadMessages
     * @description Carga los mensajes de una conversación específica
     * @param {string} conversationId - ID de la conversación
     * @returns {Promise} Promesa que resuelve con los mensajes
     */
    async loadMessages(conversationId) {
        //console.log(`[DEBUG API] Solicitando mensajes para conversación ${conversationId}...`);
        const response = await fetch(`/api/chat/${conversationId}`);
        if (!response.ok) {
            console.error("[ERROR API] Error al obtener mensajes:", response.status);
            throw new Error(`Error HTTP: ${response.status}`);
        }
        const data = await response.json();
        //console.log("[DEBUG API] Mensajes recibidos:", data);
        return data;
    },

    /**
     * @function sendMessage
     * @description Envía un mensaje al servidor
     * @param {string} conversationId - ID de la conversación
     * @param {string} message - Mensaje a enviar
     * @returns {Promise} Promesa que resuelve con la respuesta
     */
    async sendMessage(conversationId, message) {
        const response = await fetch(`/api/chat/${conversationId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ mensaje: message }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return { mensaje: data.respuesta };
    },

    /**
     * @function createConversation
     * @description Crea una nueva conversación
     * @returns {Promise<Object>} Promesa que resuelve con la nueva conversación
     */
    async createConversation(nombre = 'Nueva Conversación') {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ nombre })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    },

    /**
     * @function updateConversationName
     * @description Actualiza el nombre de una conversación
     * @param {string} conversationId - ID de la conversación
     * @param {string} newName - Nuevo nombre
     * @returns {Promise} Promesa que resuelve con la respuesta
     */
    async updateConversationName(conversationId, newName) {
        const response = await fetch(`/api/cambiar_nombre_conversacion/${conversationId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ nombre: newName }),
        });
        return response.json();
    },

    /**
     * @function deleteConversation
     * @description Elimina una conversación
     * @param {string} conversationId - ID de la conversación
     * @returns {Promise} Promesa que resuelve con la respuesta
     */
    async deleteConversation(conversationId) {
        const response = await fetch(`/api/eliminar_conversacion/${conversationId}`, {
            method: "DELETE"
        });
        return response.json();
    },

    /**
     * @function toggleContext
     * @description Cambia el estado del contexto de una conversación
     * @param {string} conversationId - ID de la conversación
     * @param {boolean} isActive - Estado del contexto
     * @returns {Promise} Promesa que resuelve con la respuesta
     */
    async toggleContext(conversationId, isActive) {
        const response = await fetch(`/api/contexto/${conversationId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ contexto_activo: isActive }),
        });
        return response.json();
    },

    /**
     * @function updateModel
     * @description Actualiza el modelo de IA para una conversación
     * @param {string} conversationId - ID de la conversación
     * @param {string} model - Nuevo modelo
     * @returns {Promise} Promesa que resuelve con la respuesta
     */
    async updateModel(conversationId, model) {
        const response = await fetch(`/api/modelo/${conversationId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ modelo: model })
        });
        return response.json();
    },

    /**
     * @function getModel
     * @description Fetches the current model for a given conversation
     * @param {number} conversationId - ID of the conversation
     * @returns {Promise<string>} Promise resolving with the model ID
     */
    async getModel(conversationId) {
        console.log(`[API] Fetching current model for conversation ${conversationId}`);
        const response = await fetch(`/api/modelo/${conversationId}`);
        if (!response.ok) {
            console.error(`[API] Error fetching model for conversation ${conversationId}:`, response.status);
            throw new Error("Error fetching model");
        }
        const data = await response.json();
        console.log(`[API] Model for conversation ${conversationId}:`, data.modelo);
        return data.modelo;
    },

    /**
     * @function loadModels
     * @description Fetches the list of available models from the backend
     * @returns {Promise<Array>} Promise resolving with the list of models
     */
    async loadModels() {
        console.log('[API] Fetching available models from /api/models');
        const response = await fetch("/api/models");
        if (!response.ok) {
            console.error('[API] Error fetching models:', response.status);
            throw new Error("Error fetching models");
        }
        const data = await response.json();
        console.log('[API] Models received:', data.models);
        return data.models;
    },
};
