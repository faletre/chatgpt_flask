document.addEventListener("DOMContentLoaded", function () {
    const conversationList = document.getElementById("conversation-list");
    const chatContent = document.getElementById("chat-content");
    const chatHeader = document.querySelector(".chat-header h2");

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

                        chatHeader.textContent = conv.nombre;
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
                    chatHeader.textContent = first.querySelector(".conversation-name").textContent;

                    loadMessages(data[0].id);
                }

                if (callback) callback(data);
            })
            .catch((err) => {
                console.error("Error al cargar conversaciones:", err);
            });
    }

    // Función para renderizar mensajes de la conversación
    function renderConversationMessages(conversationId) {
        chatContent.innerHTML = "";

        const dummyMessages = {
            1: [
                { sender: "bot", message: "Hola, soy ChatGPT." },
                { sender: "user", message: "Hola, ¿qué puedes hacer?" },
            ],
            2: [
                { sender: "bot", message: "¿En qué proyecto estás trabajando?" },
                { sender: "user", message: "Estoy armando una app con Flask." },
            ],
        };

        const messages = dummyMessages[conversationId] || [
            { sender: "bot", message: "No hay mensajes aún." },
        ];

        messages.forEach((msg) => {
            const el = document.createElement("div");
            el.classList.add("message", msg.sender);
            el.textContent = msg.message;
            chatContent.appendChild(el);
        });

        chatContent.scrollTop = chatContent.scrollHeight;
    }

    // 👇 Función que carga los mensajes de una conversación
    function loadMessages(conversationId) {
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
                        const el = document.createElement("div");
                        // Añadir la clase según si el mensaje es del usuario o del sistema
                        el.classList.add("message", msg.es_usuario === 1 ? "user" : "bot");
                        el.textContent = msg.mensaje;
                        chatContent.appendChild(el);
                    });
                }

                chatContent.scrollTop = chatContent.scrollHeight;
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
//                        renderConversationMessages(newConv.id);
//                        console.info("Cargando mensajes de la conversación:",newConv.id);
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
    function deleteConversation(conversationId) {
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
    function editConversationName(conversationId) {
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
    function updateConversationName(conversationId, newName) {
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
        })
        .catch((error) => {
            console.error("Error al editar el nombre de la conversación:", error);
        });
    }

    // ✅ Botón "Enviar" (enviar mensaje)
    document.getElementById("send-btn").addEventListener("click", () => {
        // Obtener el valor del input de mensaje
        const input = document.getElementById("message-input");
        const text = input.value.trim(); // Eliminar espacios innecesarios al principio y al final del texto

        // Si el texto no está vacío, procesamos el mensaje
        if (text !== "") {
            // 1. Eliminar el mensaje "No hay mensajes" si está presente
            const noMessages = document.querySelector(".message.bot.no-messages");
            if (noMessages) {
                noMessages.remove(); // Eliminar el mensaje de "No hay mensajes"
            }

            // 1. Crear un nuevo div para mostrar el mensaje del usuario
            const msg = document.createElement("div");
            msg.classList.add("message", "user"); // Añadir clases para estilizar el mensaje del usuario
            msg.textContent = text; // Asignar el texto del mensaje
            chatContent.appendChild(msg); // Agregar el mensaje al área de chat

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
                body: JSON.stringify({ mensaje: text }) // Enviamos el mensaje como un objeto JSON
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
                // Crear un nuevo div para mostrar el mensaje de la IA
                const reply = document.createElement("div");
                reply.classList.add("message", "bot"); // Añadimos clases para estilizar el mensaje de la IA
                reply.textContent = data.respuesta; // Usamos la respuesta de la IA que nos devuelve la API
                chatContent.appendChild(reply); // Agregamos el mensaje de la IA al área de chat

                // Hacemos scroll hacia abajo para mostrar el último mensaje
                chatContent.scrollTop = chatContent.scrollHeight;
            })
            .catch((error) => {
                // Si hay un error en el proceso, mostramos el error en la consola
                console.error("Error al enviar el mensaje:", error);
            });
        }
    });

    // Función para obtener el ID de la conversación activa
    function getActiveConversationId() {
        // Buscamos el elemento de la conversación activa
        const activeConversation = document.querySelector(".conversation-item.active");
        if (activeConversation) {
            // Si encontramos una conversación activa, devolvemos su ID
            return activeConversation.dataset.id;
        }
        return null; // Si no hay conversación activa, devolvemos null
    }

    // 🧠 Llamada inicial para cargar las conversaciones
    loadConversations();
});
