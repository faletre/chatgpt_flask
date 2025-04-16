/**
 * @fileoverview Módulo para gestionar la interfaz de usuario
 * @module ui
 */

import { API } from './api.js';

export const UI = {
    /** @type {HTMLElement} Lista de conversaciones */
    conversationList: null,
    /** @type {HTMLElement} Contenido del chat */
    chatContent: null,
    /** @type {HTMLElement} Encabezado del chat */
    chatHeader: null,

    /**
     * @function init
     * @description Inicializa los elementos de la UI
     */
    init() {
        this.conversationList = document.getElementById("conversation-list");
        this.chatContent = document.getElementById("chat-content");
        this.chatHeader = document.querySelector(".chat-header");
        this.setupTextArea();
    },

    /**
     * @function setupTextArea
     * @description Configura el comportamiento del área de texto
     */
    setupTextArea() {
        const input = document.getElementById("message-input");
        input.addEventListener("input", () => {
            input.style.height = "auto";
            input.style.height = input.scrollHeight + "px";
        });
    },

    /**
     * @function renderConversationHeader
     * @description Renderiza el encabezado de una conversación
     * @param {Object} conv - Objeto de conversación
     */
    renderConversationHeader(conv) {
        this.chatHeader.innerHTML = "";
        const headerContainer = document.createElement("div");
        headerContainer.classList.add("header-container");

        const selectContainer = document.createElement("div");
        selectContainer.classList.add("modelo-selector-container");

        const modelSelect = document.createElement("select");
        modelSelect.classList.add("modelo-selector");
        modelSelect.id = `modelo-selector-${conv.id}`;

        const modelos = ["gpt-3.5-turbo", "gpt-4"];
        modelos.forEach((modelo) => {
            const option = document.createElement("option");
            option.value = modelo;
            option.textContent = modelo.toUpperCase();
            if (conv.modelo === modelo) {
                option.selected = true;
            }
            modelSelect.appendChild(option);
        });

        // Añadir event listener para el cambio de modelo
        modelSelect.addEventListener("change", async (e) => {
            try {
                await API.updateModel(conv.id, e.target.value);
            } catch (error) {
                console.error("Error al cambiar el modelo:", error);
                e.target.value = conv.modelo; // Revertir el cambio si hay error
            }
        });

        const title = document.createElement("h2");
        title.textContent = conv.nombre;

        // Crear el contenedor para el switch y su etiqueta
        const switchContainer = document.createElement("div");
        switchContainer.classList.add("context-switch-container");

        const contextSwitch = document.createElement("label");
        contextSwitch.classList.add("switch");
        contextSwitch.id = `context-switch-${conv.id}`;

        const input = document.createElement("input");
        input.type = "checkbox";
        input.checked = conv.contexto || false;
        
        const slider = document.createElement("span");
        slider.classList.add("slider");

        const switchLabel = document.createElement("span");
        switchLabel.classList.add("switch-label");
        switchLabel.textContent = "Contexto Conversacional";

        contextSwitch.appendChild(input);
        contextSwitch.appendChild(slider);
        switchContainer.appendChild(contextSwitch);
        switchContainer.appendChild(switchLabel);

        // Añadir event listener para el cambio de contexto
        input.addEventListener("change", async (e) => {
            try {
                await API.toggleContext(conv.id, e.target.checked);
            } catch (error) {
                console.error("Error al cambiar el contexto:", error);
                e.target.checked = !e.target.checked; // Revertir el cambio si hay error
            }
        });

        headerContainer.appendChild(title);
        headerContainer.appendChild(switchContainer);
        selectContainer.appendChild(modelSelect);
        this.chatHeader.appendChild(selectContainer);
        this.chatHeader.appendChild(headerContainer);
    },

    /**
     * @function renderMessage
     * @description Renderiza un mensaje en el chat
     * @param {Object} message - Objeto mensaje
     */
    async renderMessage(message) {
        // Si es el primer mensaje, limpiar el logo
        if (this.chatContent.classList.contains("empty")) {
            this.chatContent.innerHTML = "";
            this.chatContent.classList.remove("empty");
        }
        //console.log("[DEBUG UI] Renderizando mensaje:", message);
        
        if (!message || !message.mensaje) {
            console.warn("[WARN UI] Intento de renderizar mensaje inválido:", message);
            return;
        }

        // Crear el contenedor para el mensaje
        const messageContainer = document.createElement("div");
        messageContainer.classList.add("message-container");

        // Crear el elemento del mensaje
        const messageDiv = document.createElement("div");
        messageDiv.classList.add("message", message.es_usuario === 1 ? "user" : "bot");
        
        try {
            //console.log("[DEBUG UI] Parseando contenido con marked:", message.mensaje);
            messageDiv.innerHTML = marked.parse(message.mensaje);
            await this.cargarLenguajesDinamicamente();
        } catch (error) {
            console.error("[ERROR UI] Error al formatear mensaje:", error);
            messageDiv.textContent = message.mensaje; // Fallback a texto plano
        }

        // Añadir el mensaje al contenedor
        messageContainer.appendChild(messageDiv);

        // Añadir el contenedor al chat
        this.chatContent.appendChild(messageContainer);
        this.chatContent.scrollTop = this.chatContent.scrollHeight;
        //console.log("[DEBUG UI] Mensaje renderizado exitosamente");
    },

    /**
     * @function cargarLenguajesDinamicamente
     * @description Carga dinámicamente los lenguajes de programación soportados
     */
    async cargarLenguajesDinamicamente() {
        // Esperar a que Prism esté disponible
        if (typeof Prism === "undefined") {
            console.warn("[WARN] Prism no está disponible. Esperando...");
            await new Promise(resolve => setTimeout(resolve, 500));
            if (typeof Prism === "undefined") {
                console.error("[ERROR] Prism no está disponible después de esperar");
                return;
            }
        }

        const bloques = document.querySelectorAll('pre code[class^="language-"]');
        if (!bloques.length) return;

        const lenguajesCargados = new Set();
        const promesasCarga = [];

        for (const bloque of bloques) {
            const clases = Array.from(bloque.classList);
            const lenguaje = clases.find(clase => clase.startsWith('language-'));
            
            if (lenguaje) {
                const nombreLenguaje = lenguaje.replace('language-', '');
                if (!lenguajesCargados.has(nombreLenguaje) && !Prism.languages[nombreLenguaje]) {
                    console.log(`[DEBUG] Cargando lenguaje: ${nombreLenguaje}`);
                    lenguajesCargados.add(nombreLenguaje);
                    const promesa = new Promise((resolve, reject) => {
                        const script = document.createElement('script');
                        script.src = `https://cdn.jsdelivr.net/npm/prismjs/components/prism-${nombreLenguaje}.min.js`;
                        script.onload = () => {
                            console.log(`[DEBUG] Lenguaje cargado: ${nombreLenguaje}`);
                            resolve();
                        };
                        script.onerror = (e) => {
                            console.error(`[ERROR] Error al cargar ${nombreLenguaje}:`, e);
                            reject(e);
                        };
                        document.head.appendChild(script);
                    });
                    promesasCarga.push(promesa);
                }
            }
        }

        if (promesasCarga.length > 0) {
            try {
                await Promise.all(promesasCarga);
                console.log('[DEBUG] Todos los lenguajes cargados. Aplicando highlight...');
                // Dar tiempo para que los componentes se inicialicen
                await new Promise(resolve => setTimeout(resolve, 100));
                Prism.highlightAll();
            } catch (error) {
                console.error("[ERROR] Error al cargar lenguajes de Prism:", error);
            }
        } else {
            // Si no hay nuevos lenguajes que cargar, solo aplicar highlight
            Prism.highlightAll();
        }
    },

    /**
     * @function clearChat
     * @description Limpia el contenido del chat
     */
    clearChat() {
        //console.log("[DEBUG UI] Limpiando chat");
        this.chatContent.innerHTML = "";
        this.chatContent.classList.add("empty");
        const centerLogo = document.createElement("img");
        centerLogo.src = "static/images/flaskchat-logo.png";
        centerLogo.alt = "FlaskChat Logo";
        centerLogo.classList.add("center-logo");
        this.chatContent.appendChild(centerLogo);
        //console.log("[DEBUG UI] Chat limpiado");
    }
};
