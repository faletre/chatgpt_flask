/**
 * @fileoverview Módulo principal para la gestión de conversaciones y chat
 * @author Rafael Sánchez
 * @version 2.3
 */

/**
 * @namespace ChatApp
 * @description Namespace principal que contiene toda la funcionalidad de la aplicación de chat
 */
const ChatApp = {
    /** @type {HTMLElement} Lista de conversaciones */
    conversationList: null,
    /** @type {HTMLElement} Contenido del chat */
    chatContent: null,
    /** @type {HTMLElement} Encabezado del chat */
    chatHeader: null,

    /**
     * @function init
     * @description Inicializa la aplicación y configura los elementos DOM principales
     */
    init() {
        this.conversationList = document.getElementById("conversation-list");
        this.chatContent = document.getElementById("chat-content");
        this.chatHeader = document.querySelector(".chat-header");
        this.setupEventListeners();
        this.setupTextArea();
        this.loadConversations();
    },

    /**
     * @function setupEventListeners
     * @description Configura los event listeners principales de la aplicación
     */
    setupEventListeners() {
        const newConversationBtn = document.getElementById("new-conversation-btn");
        if (newConversationBtn) {
            newConversationBtn.addEventListener("click", () => this.createNewConversation());
        }

        document.getElementById("send-btn").addEventListener("click", () => this.sendMessage());
        document.getElementById("message-input").addEventListener("keydown", (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
    },

    /**
     * @function loadConversations
     * @description Carga las conversaciones desde el servidor
     * @param {Function} [callback=null] - Callback opcional a ejecutar después de cargar las conversaciones
     */
    loadConversations(callback = null) {
    const conversationList = document.getElementById("conversation-list");
    const chatContent = document.getElementById("chat-content");
    const chatHeader = document.querySelector(".chat-header");

    // Función para cargar conversaciones desde Flask
    function loadConversations(callback = null) {
        fetch("/api/historial")
            .then((res) => res.json())
            .then((data) => {
                conversationList.innerHTML = ""; // Limpia lista actual
                data.forEach((conv) => {
                    const li = document.createElement("li");
                    li.classList.add("conversation-item");
                    li.dataset.id = conv.id;

                    // 👇 Añadimos el nombre dentro de un span
                    const nameSpan = document.createElement("span");
                    nameSpan.classList.add("conversation-name");
                    nameSpan.textContent = conv.nombre;
                    li.appendChild(nameSpan);

                    // Comportamiento al hacer clic
                    li.addEventListener("click", () => {
                        // Quitar active de otros
                        document
                            .querySelectorAll(".conversation-item")
                            .forEach((item) => item.classList.remove("active"));
                        li.classList.add("active");

                        loadMessages(conv.id);

                        //chatHeader.textContent = conv.nombre; // Si las siguientes 4 lineas funcionan, borrar.
			const headerSpan = chatHeader.querySelector("span");  // Encuentra el span dentro del h2
			if (headerSpan) {
			    headerSpan.textContent = conv.nombre;  // Actualiza el nombre en el span
			}
  			renderConversationHeader(conv);
                    });

                    const actionsContainer = document.createElement("div");
                    actionsContainer.classList.add("actions");

                    // Botón Editar
                    const editBtn = document.createElement("button");
                    editBtn.textContent = "✏️";
                    editBtn.classList.add("edit-btn");
                    editBtn.addEventListener("click", (event) => {
                        event.stopPropagation(); // Para evitar que se active el click de la conversación
                        editConversationName(conv.id);
                    });

                    // Botón Eliminar
                    const deleteBtn = document.createElement("button");
                    deleteBtn.textContent = "🗑️";
                    deleteBtn.classList.add("delete-btn");
                    deleteBtn.addEventListener("click", (event) => {
                        event.stopPropagation(); // Para evitar que se active el click de la conversación
                        deleteConversation(conv.id);
                    });

                    // Añadir botones al contenedor de la conversación
                    actionsContainer.appendChild(editBtn);
                    actionsContainer.appendChild(deleteBtn);

                    li.appendChild(actionsContainer);

                    conversationList.appendChild(li);
                });

                // Si hay al menos una conversación, mostrar la primera por defecto
                if (data.length > 0 && !document.querySelector(".conversation-item.active")) {
                    const first = document.querySelector(".conversation-item");
                    first.classList.add("active");

                    // Mostrar el nombre de la conversación activa en la zona de chat
                    //chatHeader.textContent = first.querySelector(".conversation-name").textContent; // Borrar?
		    const headerSpan = chatHeader.querySelector("span");
		    if (headerSpan) {
		         headerSpan.textContent = first.querySelector(".conversation-name").textContent;
		    }

                    loadMessages(data[0].id);
                }

                if (callback) callback(data);
            })
            .catch((err) => {
                console.error("Error al cargar conversaciones:", err);
            });
    }

    // Función para obtener el estado actual del contexto de la conversación
    /**
     * @function getContextState
     * @description Obtiene el estado del contexto de una conversación
     * @param {string} conversationId - ID de la conversación
     */
    getContextState(conversationId) {
        fetch(`/api/contexto/${conversationId}`)
            .then((res) => res.json())
            .then((data) => {
                const contextSwitch = document.querySelector(`#context-switch-${conversationId} input`);
                if (contextSwitch) {
                    // Aseguramos que el estado del switch sea igual al que se devuelve en la API
                    contextSwitch.checked = data.contexto; // Estado del contexto real
                }
            })
            .catch((err) => {
                console.error("Error al obtener el estado del contexto:", err);
            });
    }

    // Función para cambiar el estado del contexto de la conversación
    /**
     * @function toggleContextState
     * @description Cambia el estado del contexto de una conversación
     * @param {string} conversationId - ID de la conversación
     * @param {boolean} isChecked - Nuevo estado del contexto
     */
    toggleContextState(conversationId, isChecked) {
        fetch(`/api/contexto/${conversationId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ contexto_activo: isChecked }), // Enviar el nuevo estado del contexto
        })
            .then((res) => {
                if (!res.ok) throw new Error("Error al actualizar el contexto");
                return res.json();
            })
            .then((data) => {
                console.log("Estado de contexto actualizado:", data);
            })
            .catch((err) => {
                console.error("Error al actualizar el contexto:", err);
            });
    }

    /**
     * @function renderConversationHeader
     * @description Renderiza el encabezado de una conversación
     * @param {Object} conv - Objeto de conversación
     * @param {string} conv.id - ID de la conversación
     * @param {string} conv.nombre - Nombre de la conversación
     * @param {string} conv.modelo - Modelo de IA utilizado
     */
    renderConversationHeader(conv) {
        // Limpiar contenido previo del encabezado
        chatHeader.innerHTML = "";

        // Crear el contenedor principal para el título y el switch
        const headerContainer = document.createElement("div");
        headerContainer.classList.add("header-container");

	// Crear contenedor para el SELECT
	const selectContainer = document.createElement("div");
        selectContainer.classList.add("modelo-selector-container");

        // 🔽 Crear el SELECT (desplegable de modelo)
        const modelSelect = document.createElement("select");
        modelSelect.classList.add("modelo-selector");
        modelSelect.id = `modelo-selector-${conv.id}`;

        const modelos = ["gpt-3.5-turbo", "gpt-4", "claude-3", "mistral"];
        modelos.forEach((modelo) => {
            const option = document.createElement("option");
            option.value = modelo;
            option.textContent = modelo.toUpperCase();
            if (conv.modelo === modelo) {
                option.selected = true;
            }
            modelSelect.appendChild(option);
        });

        modelSelect.addEventListener("change", (e) => {
            const nuevoModelo = e.target.value;
            fetch(`/api/modelo/${conv.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ modelo: nuevoModelo })
            })
            .then(res => {
                if (!res.ok) throw new Error("Error al actualizar modelo");
                return res.json();
            })
            .then(data => {
                console.log("Modelo actualizado:", data);
            })
            .catch(err => {
                console.error("Error al actualizar el modelo:", err);
            });
        });

        // 🔄 Consultar el modelo actual desde el backend
        fetch(`/api/modelo/${conv.id}`)
            .then(res => {
                if (!res.ok) throw new Error("Error al obtener modelo");
                return res.json();
            })
            .then(data => {
                const modeloActual = data.modelo;
                modelSelect.value = modeloActual;
            })
            .catch(err => {
                console.error("Error al cargar el modelo:", err);
            });

        // Crear el H2 solo con el nombre de la conversación
        const title = document.createElement("h2");
        title.textContent = conv.nombre;

        // Crear el switch
        const contextSwitch = document.createElement("label");
        contextSwitch.classList.add("switch");
        contextSwitch.id = `context-switch-${conv.id}`;

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.addEventListener("change", (event) => {
            const isChecked = event.target.checked;
            toggleContextState(conv.id, isChecked); // Cambia el estado del contexto
        });

        const slider = document.createElement("span");
        slider.classList.add("slider");

        contextSwitch.appendChild(checkbox);
        contextSwitch.appendChild(slider);

        // Crear la leyenda
        const switchLabel = document.createElement("span");
        switchLabel.classList.add("switch-label");
        switchLabel.textContent = "Contexto Conversacional";

	// Añadir el selector al contenedor
	selectContainer.appendChild(modelSelect);
        // Añadir el selector del modelo, el título y el switch al contenedor principal
        headerContainer.appendChild(selectContainer);
        headerContainer.appendChild(title);
        headerContainer.appendChild(contextSwitch);
        headerContainer.appendChild(switchLabel);

        // Insertar el contenedor en el chatHeader
        chatHeader.appendChild(headerContainer);

        // Obtener el estado actual del contexto
        getContextState(conv.id);
    }

    // 👇 Función que carga los mensajes de una conversación
    /**
     * @function loadMessages
     * @description Carga los mensajes de una conversación específica
     * @param {string} conversationId - ID de la conversación
     */
    loadMessages(conversationId) {
        fetch(`/api/chat/${conversationId}`)
            .then((res) => res.json())
            .then((data) => {
                console.log(data);
                chatContent.innerHTML = ""; // Limpia los mensajes actuales

                if (data.length === 0) {
                    const noMessages = document.createElement("div");
                    noMessages.classList.add("message", "bot", "no-messages");
                    noMessages.textContent = "No hay mensajes en esta conversación.";
                    chatContent.appendChild(noMessages);
                } else {
                    data.forEach((msg) => {
                        // Crear el contenedor para el mensaje
                        const messageContainer = document.createElement("div");
                        messageContainer.classList.add("message-container");

                        // Crear el elemento del mensaje
                        const el = document.createElement("div");
                        // Añadir la clase según si el mensaje es del usuario o del sistema
                        el.classList.add("message", msg.es_usuario === 1 ? "user" : "bot");
//                        el.textContent = msg.mensaje;
                        el.innerHTML = marked.parse(msg.mensaje);

                        // Añadir el mensaje al contenedor
                        messageContainer.appendChild(el);

                        // Añadir el contenedor con el mensaje al chat
                        chatContent.appendChild(messageContainer);
                    });
                }

                chatContent.scrollTop = chatContent.scrollHeight;
                cargarLenguajesDinamicamente();
                // 🪄 Aplicar resaltado de sintaxis a los nuevos bloques de código
                if (typeof Prism !== "undefined") {
                    Prism.highlightAll();
                } else {
                    console.warn("Prism no está disponible aún");
                }

            })
            .catch((err) => {
                console.error("Error al cargar los mensajes:", err);
            });
    }

    // ✅ Crear nueva conversación
    const newConversationBtn = document.getElementById("new-conversation-btn");
    if (newConversationBtn) {
        newConversationBtn.addEventListener("click", () => {
            console.log("Clic en nueva conversación");

            fetch("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({})
            })
            .then(response => {
                if (!response.ok) throw new Error("Error al crear la conversación");
                return response.json();
            })
            .then(newConv => {
                // Recargar conversaciones y seleccionar la nueva
                loadConversations(() => {
                    const newItem = document.querySelector(
                        `.conversation-item[data-id="${newConv.id}"]`
                    );
                    if (newItem) {
                        newItem.classList.add("active");
                        loadMessages(newConv.id);
                    }
                });
            })
            .catch(err => {
                console.error("Error al crear la conversación:", err);
            });
        });
    } else {
        console.error("El botón de nueva conversación no se encuentra en el DOM.");
    }

    // Función para eliminar una conversación
    /**
     * @function deleteConversation
     * @description Elimina una conversación
     * @param {string} conversationId - ID de la conversación a eliminar
     */
    deleteConversation(conversationId) {
        if (confirm("¿Estás seguro de que quieres eliminar esta conversación?")) {
            fetch(`/api/eliminar_conversacion/${conversationId}`, {
                method: "DELETE"
            })
            .then((response) => {
                if (response.ok) {
                    // Si la eliminación fue exitosa, eliminamos la conversación del DOM
                    const conversationItem = document.querySelector(`.conversation-item[data-id="${conversationId}"]`);
                    conversationItem.remove();
                } else {
                    alert("Hubo un error al eliminar la conversación.");
                }
            })
            .catch((error) => {
                console.error("Error al eliminar la conversación:", error);
            });
        }
    }

    // Función para editar el nombre de la conversación
    /**
     * @function editConversationName
     * @description Inicia la edición del nombre de una conversación
     * @param {string} conversationId - ID de la conversación a editar
     */
    editConversationName(conversationId) {
        const conversationItem = document.querySelector(`.conversation-item[data-id="${conversationId}"]`);
        const conversationName = conversationItem.querySelector(".conversation-name");

        // Crear un campo de texto editable
        const input = document.createElement("input");
        input.value = conversationName.textContent;
        input.classList.add("conversation-name-input"); // Para poder aplicarle estilos

        let hasUpdated = false;

        const finalizeEdit = () => {
            if (hasUpdated) return;
            hasUpdated = true;
            input.disabled = true;
            updateConversationName(conversationId, input.value);
        };

        input.addEventListener("blur", finalizeEdit);
        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                finalizeEdit();
            }
        });

        conversationName.replaceWith(input);
        input.focus();
    }

    // Función que hace la solicitud a la API para actualizar el nombre de la conversación
    /**
     * @function updateConversationName
     * @description Actualiza el nombre de una conversación en el servidor
     * @param {string} conversationId - ID de la conversación
     * @param {string} newName - Nuevo nombre para la conversación
     * @returns {Promise} Promesa que resuelve cuando se actualiza el nombre
     */
    updateConversationName(conversationId, newName) {
        fetch(`/api/cambiar_nombre_conversacion/${conversationId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ nombre: newName })
        })
        .then((response) => {
            if (!response.ok) {
               return response.text().then((text) => {
                  console.error("Error al actualizar el nombre:", response.status, text);
                  throw new Error("Error al actualizar el nombre");
               });
            }
            return response.json();
        })
        .then((data) => {
            // Si la respuesta es exitosa, actualizamos el nombre en el DOM
            const input = document.querySelector(`.conversation-item[data-id="${conversationId}"] input`);
            if (input) {
                const newConversationName = document.createElement("span");
                newConversationName.classList.add("conversation-name"); // Para los estilos
                newConversationName.textContent = newName;
                input.replaceWith(newConversationName);
            }

            // Si esta es la conversación activa, actualizamos el nombre en el encabezado del chat
            const activeConversation = document.querySelector(".conversation-item.active");
            if (activeConversation && activeConversation.dataset.id === String(conversationId)) {
                const chatHeader = document.querySelector(".chat-header h2");
                chatHeader.textContent = newName;
            }
        })
        .catch((error) => {
            console.error("Error al editar el nombre de la conversación:", error);
        });
    }

    // ✅ Botón "Enviar" (enviar mensaje)
    document.getElementById("send-btn").addEventListener("click", () => {
        sendMessage();
    });

    // También permitir enviar mensaje al presionar "Enter"
    document.getElementById("message-input").addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            sendMessage();
        }
    });

    /**
     * @function sendMessage
     * @description Envía un mensaje al servidor y actualiza la interfaz
     */
    sendMessage() {
        // Obtener el valor del input de mensaje
        const input = document.getElementById("message-input");
        let text = input.value.trim(); // Eliminar espacios innecesarios al principio y al final del texto
//        const text = input.value;

        // Si el texto no está vacío, procesamos el mensaje
        if (text !== "") {
            // 1. Eliminar el mensaje "No hay mensajes" si está presente
            const noMessages = document.querySelector(".message.bot.no-messages");
            if (noMessages) {
                noMessages.remove(); // Eliminar el mensaje de "No hay mensajes"
            }

            text = text.replace(/\n/g,"\\n");

            // 1. Crear un nuevo contenedor para el mensaje del usuario
            const messageContainer = document.createElement("div");
            messageContainer.classList.add("message-container");

            // 2. Crear el div para mostrar el mensaje del usuario
            const msg = document.createElement("div");
            msg.classList.add("message", "user"); // Añadir clases para estilizar el mensaje del usuario
//            msg.textContent = text; // Asignar el texto del mensaje
            msg.innerHTML =  text.replace(/\n/g,"<br>");

            // 3. Añadir el mensaje al contenedor
            messageContainer.appendChild(msg);

            // 4. Agregar el contenedor del mensaje al área de chat
            chatContent.appendChild(messageContainer);

            // Limpiar el campo de entrada de texto
            input.value = "";

            // Obtener el ID de la conversación activa
            const conversationId = getActiveConversationId(); // Función que obtiene el ID de la conversación activa

            // Realizar una solicitud PUT a la API de Flask para enviar el mensaje
            fetch(`/api/chat/${conversationId}`, {
                method: "POST", // Usamos el método POST para añadir un nuevo mensaje, que es lo que espera la API
                headers: {
                    "Content-Type": "application/json", // Indicamos que los datos enviados son en formato JSON
                },
                body: JSON.stringify({ mensaje: text }) // Enviamos el mensaje como un objeto JSON y con los saltos de linea "escapados" (así: \\n)
            })
            .then((response) => {
                // Verificamos si la respuesta de la API fue exitosa
                if (!response.ok) {
                    throw new Error("Error al enviar el mensaje"); // Si hay un error en la respuesta, lanzamos una excepción
                }
                return response.json(); // Si todo está bien, parseamos la respuesta como JSON
            })
            .then((data) => {
                // Después de recibir la respuesta de la IA, procesamos la respuesta
                // Crear el contenedor para el mensaje de la IA
                const messageContainerBot = document.createElement("div");
                messageContainerBot.classList.add("message-container");

                // Crear un nuevo div para mostrar el mensaje de la IA
                const reply = document.createElement("div");
                reply.classList.add("message", "bot"); // Añadimos clases para estilizar el mensaje de la IA
//                reply.innerHTML = data.respuesta.replace(/\\n/g,"<br>"); // Usamos la respuesta de la IA que nos devuelve la API.
                reply.innerHTML = marked.parse(data.respuesta.replace(/\\n/g,"\n")); // Usamos la respuesta de la IA que nos devuelve la API.

                // Añadir el mensaje al contenedor del bot
                messageContainerBot.appendChild(reply);

                // Agregar el contenedor del mensaje de la IA al área de chat
                chatContent.appendChild(messageContainerBot);

                // Carga de lenguajes de Prism dinánicamente
                cargarLenguajesDinamicamente();

                // Hacemos scroll hacia abajo para mostrar el último mensaje
                chatContent.scrollTop = chatContent.scrollHeight;
            })
            .catch((error) => {
                // Si hay un error en el proceso, mostramos el error en la consola
                console.error("Error al enviar el mensaje:", error);
            });
        }
    }

    // Función para obtener el ID de la conversación activa
    /**
     * @function getActiveConversationId
     * @description Obtiene el ID de la conversación actualmente activa
     * @returns {string|null} ID de la conversación activa o null si no hay ninguna
     */
    getActiveConversationId() {
        const activeConversation = document.querySelector(".conversation-item.active");
        if (activeConversation) {
            return activeConversation.dataset.id;
        }
        return null;
    }

    /**
     * @function setupTextArea
     * @description Configura el comportamiento del área de texto
     */
    setupTextArea() {
        const input = document.getElementById("message-input");

        // Escuchar el evento de tecla presionada
        input.addEventListener("keydown", function(event) {
            // Si el usuario presiona 'Enter' sin 'Shift', enviamos el mensaje
            if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault(); // Evitar que se inserte un salto de línea
    //            sendMessage(); // Llamamos a la función para enviar el mensaje
            }
            else if (event.key === 'Enter' && event.shiftKey) {
                event.preventDefault();  // Prevenir el comportamiento por defecto de Enter
                const cursorPos = input.selectionStart;  // Obtener la posición del cursor
                // Insertar un salto de línea en la posición del cursor
                input.value = input.value.slice(0, cursorPos) + '\n' + input.value.slice(cursorPos);
                input.selectionStart = input.selectionEnd = cursorPos + 1;  // Mover el cursor después del salto de línea
            }
        });

        input.addEventListener('input', function () {
          this.style.height = 'auto'; // Reinicia la altura
          this.style.height = Math.min(this.scrollHeight, 200) + 'px'; // Ajusta según contenido
        });

    }

    /**
     * @function cargarLenguajesDinamicamente
     * @description Carga dinámicamente los lenguajes de programación soportados
     */
    cargarLenguajesDinamicamente() {
        const bloques = document.querySelectorAll('pre code[class^="language-"]');
        const lenguajesCargados = new Set(); // Para evitar cargar el mismo dos veces

        bloques.forEach(block => {
            const clase = block.className;
            const langMatch = clase.match(/language-([a-zA-Z0-9]+)/);

            if (langMatch) {
                const lang = langMatch[1];

                if (Prism.languages[lang]) {
                    // Ya está cargado, aplicar directamente
                    Prism.highlightElement(block);
                } else if (!lenguajesCargados.has(lang)) {
                    // No cargado aún, insertamos el script
                    lenguajesCargados.add(lang);

                    const script = document.createElement('script');
                    script.src = `https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/prism-${lang}.min.js`;
                    script.onload = () => {
                        console.log(`Lenguaje cargado dinámicamente: ${lang}`);
                        document.querySelectorAll(`code.language-${lang}`).forEach(el => {
                            Prism.highlightElement(el);
                        });
                    };
                    script.onerror = () => {
                        console.warn(`⚠️ No se pudo cargar el resaltado para: ${lang}`);
                    };

                    document.body.appendChild(script);
                }
            }
        });
    }


};

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => ChatApp.init());
    // Usamos el evento 'load' para asegurarnos de que Prism esté cargado
    window.onload = function() {
      if (typeof Prism !== "undefined") {
        // Resaltar todo el código que está en la página
        Prism.highlightAll();
      } else {
        console.error("Prism no está definido correctamente.");
      }
    }
});
