document.addEventListener("DOMContentLoaded", function() {
    // Contenido simulado de las conversaciones
    const conversations = {
        1: [
            { sender: 'bot', message: '¡Hola! ¿En qué puedo ayudarte hoy?' },
            { sender: 'user', message: 'Quiero saber más sobre ChatGPT.' },
            { sender: 'bot', message: 'ChatGPT es un modelo de lenguaje creado por OpenAI.' },
        ],
        2: [
            { sender: 'bot', message: '¡Bienvenido a la conversación 2!' },
            { sender: 'user', message: '¿Qué tal? ¿De qué se trata este chat?' },
            { sender: 'bot', message: 'Este es otro chat, donde exploramos cosas diferentes.' },
        ]
    };

    // Función para seleccionar una conversación
    function selectConversation(conversationId) {
        const chatContent = document.getElementById('chat-content');
        const conversationItems = document.querySelectorAll('.conversation-item');
        
        // Desmarcar las conversaciones anteriores
        conversationItems.forEach(item => item.classList.remove('active'));
        
        // Marcar la conversación seleccionada
        const selectedItem = document.querySelector(`.conversation-item:nth-child(${conversationId})`);
        selectedItem.classList.add('active');
        
        // Cambiar contenido de la conversación
        chatContent.innerHTML = ''; // Limpiar contenido anterior
        
        // Recorrer los mensajes de la conversación seleccionada y mostrar
        conversations[conversationId].forEach(msg => {
            const messageElement = document.createElement('div');
            messageElement.classList.add('message', msg.sender);
            messageElement.textContent = msg.message;
            chatContent.appendChild(messageElement);
        });
        
        // Desplazar hacia abajo el chat
        chatContent.scrollTop = chatContent.scrollHeight;
    }

    // Agregar evento onclick a las conversaciones
    const conversationItems = document.querySelectorAll('.conversation-item');
    conversationItems.forEach((item, index) => {
        item.addEventListener('click', () => selectConversation(index + 1));
    });

    // Llamar a la primera conversación por defecto
    selectConversation(1);

    // Enviar mensaje (simulado)
    document.getElementById('send-btn').addEventListener('click', () => {
        const messageInput = document.getElementById('message-input');
        const messageText = messageInput.value.trim();
        
        if (messageText !== "") {
            // Mostrar el mensaje del usuario
            const userMessage = document.createElement('div');
            userMessage.classList.add('message', 'user');
            userMessage.textContent = messageText;
            document.getElementById('chat-content').appendChild(userMessage);
            
            // Limpiar el campo de entrada
            messageInput.value = '';
            
            // Simular la respuesta del bot
            setTimeout(() => {
                const botMessage = document.createElement('div');
                botMessage.classList.add('message', 'bot');
                botMessage.textContent = 'Este es un mensaje de respuesta automática.';
                document.getElementById('chat-content').appendChild(botMessage);
                
                // Desplazar hacia abajo el chat
                document.getElementById('chat-content').scrollTop = document.getElementById('chat-content').scrollHeight;
            }, 1000);
        }
    });
});
