document.addEventListener("DOMContentLoaded", function () {
    const conversationList = document.getElementById("conversation-list");
    const chatContent = document.getElementById("chat-content");

    // Simulación de contenido (puedes luego pedirlo por otro endpoint)
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

    function renderConversationMessages(conversationId) {
        chatContent.innerHTML = "";

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

    // 👇 Función que carga la lista de conversaciones desde Flask
    function loadConversations(callback=null) {
        fetch("/api/historial")
            .then((res) => res.json())
            .then((data) => {
                conversationList.innerHTML = ""; // Limpia lista actual
                data.forEach((conv, index) => {
                    const li = document.createElement("li");
                    li.classList.add("conversation-item");
                    li.textContent = conv.nombre;
                    li.dataset.id = conv.id;

                    // Agregar comportamiento al hacer clic
                    li.addEventListener("click", () => {
                        // Quitar active de otros
                        document
                            .querySelectorAll(".conversation-item")
                            .forEach((item) => item.classList.remove("active"));
                        li.classList.add("active");

                        renderConversationMessages(conv.id);
                    });

                    conversationList.appendChild(li);
                });

                // Si hay al menos una conversación, mostrar la primera por defecto
                if (data.length > 0 && !document.querySelector(".conversation-item.active")) {
                    const first = document.querySelector(".conversation-item");
                    first.classList.add("active");
                    renderConversationMessages(data[0].id);
                }

                if (callback) callback(data);

            })
            .catch((err) => {
                console.error("Error al cargar conversaciones:", err);
            });
    }

    // Simula envío de mensaje
    document.getElementById("send-btn").addEventListener("click", () => {
        const input = document.getElementById("message-input");
        const text = input.value.trim();
        if (text !== "") {
            const msg = document.createElement("div");
            msg.classList.add("message", "user");
            msg.textContent = text;
            chatContent.appendChild(msg);

            input.value = "";

            setTimeout(() => {
                const reply = document.createElement("div");
                reply.classList.add("message", "bot");
                reply.textContent = "Este es un mensaje automático.";
                chatContent.appendChild(reply);
                chatContent.scrollTop = chatContent.scrollHeight;
            }, 1000);
        }
    });

    document.getElementById("new-conversation-btn").addEventListener("click", () => {
        fetch("/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({}) // Puedes añadir datos si es necesario
        })
        .then(response => {
            if (!response.ok) throw new Error("Error al crear la conversación");
            return response.json(); // Asumimos que devuelve la conversación nueva
        })
        .then(newConv => {
            loadConversations(() => {
                // Opcional: seleccionar la nueva conversación si devuelve un ID
                const newItem = document.querySelector(
                     `.conversation-item[data-id="${newConv.id}"]`
                );
                if (newItem) {
                    newItem.classList.add("active");
                    renderConversationMessages(newConv.id);
                }
            });
        })
        .catch(err => {
            console.error("Error al crear la conversación:", err);
        });
    });

    // 🧠 Llamada inicial
    loadConversations();
});
