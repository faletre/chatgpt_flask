/**
 * @fileoverview Módulo para gestionar las conversaciones
 * @module conversation
 */

import { API } from './api.js';
import { UI } from './ui.js';

export const ConversationManager = {
    /** @type {HTMLElement} Lista de conversaciones */
    conversationList: null,
    /** @type {number|null} ID de la conversación activa */
    activeConversationId: null,

    /**
     * @function editConversationName
     * @description Edita el nombre de una conversación
     * @param {number} id - ID de la conversación
     * @param {HTMLElement} nameSpan - Elemento que contiene el nombre
     */
    async editConversationName(id, nameSpan) {
        const currentName = nameSpan.textContent;
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentName;
        input.classList.add('edit-conversation-input');

        // Reemplazar el span con el input
        nameSpan.replaceWith(input);
        input.focus();

        const saveChanges = async () => {
            const newName = input.value.trim();
            if (newName && newName !== currentName) {
                try {
                    await API.updateConversationName(id, newName);
                    nameSpan.textContent = newName;
                    // Actualizar el nombre en el header si es la conversación activa
                    if (id === this.activeConversationId) {
                        UI.chatHeader.querySelector('h2').textContent = newName;
                    }
                } catch (error) {
                    console.error('Error al actualizar nombre:', error);
                    nameSpan.textContent = currentName;
                }
            } else {
                nameSpan.textContent = currentName;
            }
            input.replaceWith(nameSpan);
        };

        input.addEventListener('blur', saveChanges);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveChanges();
            }
        });
    },

    /**
     * @function deleteConversation
     * @description Elimina una conversación
     * @param {number} id - ID de la conversación
     */
    async deleteConversation(id) {
        if (!confirm('¿Estás seguro de que deseas eliminar esta conversación?')) return;

        try {
            await API.deleteConversation(id);
            const item = this.conversationList.querySelector(`[data-id="${id}"]`);
            if (item) {
                const wasActive = id === this.activeConversationId;
                item.remove();
                
                // Si era la conversación activa, seleccionar otra
                if (wasActive) {
                    const firstConv = this.conversationList.querySelector('.conversation-item');
                    if (firstConv) {
                        this.selectConversation(firstConv.dataset.id);
                    } else {
                        this.activeConversationId = null;
                        UI.clearChat();
                        UI.renderConversationHeader({ id: null, nombre: '' });
                    }
                }
            }
        } catch (error) {
            console.error('Error al eliminar conversación:', error);
            alert('Error al eliminar la conversación');
        }
    },

    /**
     * @function selectConversation
     * @description Selecciona una conversación
     * @param {number} id - ID de la conversación
     */
    selectConversation(id) {
        if (!id) return;

        // Remover la clase active de todas las conversaciones
        const items = this.conversationList.querySelectorAll('.conversation-item');
        items.forEach(item => item.classList.remove('active'));

        // Añadir la clase active a la conversación seleccionada
        const selectedItem = this.conversationList.querySelector(`[data-id="${id}"]`);
        if (selectedItem) {
            selectedItem.classList.add('active');
            this.activeConversationId = id;

            // Actualizar el nombre en el header
            const conversationName = selectedItem.querySelector('.conversation-name').textContent;
            UI.renderConversationHeader({ id, nombre: conversationName });

            // Cargar los mensajes
            this.loadMessages(id);
        }
    },

    /**
     * @function init
     * @description Inicializa el gestor de conversaciones
     */
    async init() {
        this.conversationList = document.getElementById('conversation-list');
        if (!this.conversationList) {
            console.error('[ERROR] No se encontró el elemento conversation-list');
            return;
        }
        await this.loadConversations();
    },

    /**
     * @function loadConversations
     * @description Carga las conversaciones desde el servidor
     */
    async loadConversations() {
        try {
            const conversations = await API.loadConversations();
            this.renderConversationList(conversations);

            // Si hay conversaciones y ninguna está activa, seleccionar la primera
            if (conversations.length > 0 && !this.activeConversationId) {
                this.selectConversation(conversations[0].id);
            }
        } catch (error) {
            console.error('[ERROR] Error al cargar conversaciones:', error);
        }
    },

    /**
     * @function renderConversationList
     * @description Renderiza la lista de conversaciones
     * @param {Array} conversations - Lista de conversaciones
     */
    renderConversationList(conversations) {
        this.conversationList.innerHTML = '';
        conversations.forEach(conv => {
            const li = document.createElement('li');
            li.classList.add('conversation-item');
            li.dataset.id = conv.id;

            // Contenedor para el nombre
            const nameSpan = document.createElement('span');
            nameSpan.classList.add('conversation-name');
            nameSpan.textContent = conv.nombre;
            li.appendChild(nameSpan);

            // Contenedor para los botones de acción
            const actionsContainer = document.createElement('div');
            actionsContainer.classList.add('actions');

            // Botón Editar
            const editBtn = document.createElement('button');
            editBtn.textContent = '✏️';
            editBtn.classList.add('edit-btn');
            editBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                this.editConversationName(conv.id, nameSpan);
            });

            // Botón Eliminar
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '🗑️';
            deleteBtn.classList.add('delete-btn');
            deleteBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                this.deleteConversation(conv.id);
            });

            // Añadir botones al contenedor
            actionsContainer.appendChild(editBtn);
            actionsContainer.appendChild(deleteBtn);
            li.appendChild(actionsContainer);

            li.addEventListener('click', () => this.handleConversationClick(conv));
            
            this.conversationList.appendChild(li);
        });
    },

    /**
     * @function handleConversationClick
     * @description Maneja el clic en una conversación
     * @param {Object} conv - Objeto de conversación
     */
    async handleConversationClick(conv) {
        if (conv && conv.id) {
            this.selectConversation(conv.id);
        }
    },

    /**
     * @function getActiveConversationId
     * @description Obtiene el ID de la conversación activa
     * @returns {string|null} ID de la conversación activa o null si no hay ninguna
     */
    getActiveConversationId() {
        const activeConv = document.querySelector(".conversation-item.active");
        return activeConv ? activeConv.dataset.id : null;
    },

    /**
     * @function loadMessages
     * @description Carga los mensajes de una conversación
     * @param {string} conversationId - ID de la conversación
     */
    async loadMessages(conversationId) {
        try {
            const messages = await API.loadMessages(conversationId);
            
            UI.clearChat();
            if (!Array.isArray(messages)) {
                console.warn("[WARN] Los mensajes recibidos no son un array:", messages);
                return;
            }

            if (messages.length === 0) {
                return;
                await UI.renderMessage({
                    mensaje: "No hay mensajes en esta conversación.",
                    es_usuario: 0,
                    fecha_creacion: new Date().toISOString()
                });
                return;
            }

            // Procesar mensajes secuencialmente para mantener el orden
            for (const message of messages) {
                if (message && typeof message.mensaje === "string") {
                    await UI.renderMessage(message);
                } else {
                    console.warn("[WARN] Mensaje inválido:", message);
                }
            }
        } catch (error) {
            console.error("[ERROR] Error al cargar mensajes:", error);
            await UI.renderMessage({
                mensaje: 'Error al cargar los mensajes. Por favor, intenta de nuevo.',
                es_usuario: 0,
                fecha_creacion: new Date().toISOString()
            });
        }
    },

    /**
     * @function createNewConversation
     * @description Crea una nueva conversación
     */
    async createNewConversation() {
        try {
            const newConv = await API.createConversation();
            this.renderConversationList([newConv]);
            await this.selectConversation(newConv.id);
        } catch (error) {
            console.error("[ERROR] Error al crear nueva conversación:", error);
        }
    }
};
