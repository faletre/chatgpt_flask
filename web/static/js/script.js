// Cargar historial de conversaciones al cargar la página
document.addEventListener('DOMContentLoaded', async function () {
  await cargarHistorialConversaciones();
});

// Cargar el historial de conversaciones desde el servidor
async function cargarHistorialConversaciones() {
  const res = await fetch('/api/historial');
  const data = await res.json();

  const listaConversaciones = document.getElementById("lista-conversaciones");
  listaConversaciones.innerHTML = '';  // Limpiar lista existente

  data.forEach(conversacion => {
    const li = document.createElement("li");
    li.textContent = conversacion.nombre;
    li.setAttribute('data-id', conversacion.id);  // Asignar ID de la conversación

    // Menú contextual con opciones de cambiar nombre y eliminar
    const menuButton = document.createElement("button");
    menuButton.textContent = '⋮';
    menuButton.classList.add('menu-button');
    li.appendChild(menuButton);

    const menu = document.createElement('div');
    menu.classList.add('menu');
    
    // Opción para cambiar nombre
    const cambiarNombre = document.createElement('button');
    cambiarNombre.textContent = 'Cambiar nombre';
    cambiarNombre.onclick = () => cambiarNombreConversacion(conversacion.id);
    menu.appendChild(cambiarNombre);

    // Opción para eliminar conversación
    const eliminar = document.createElement('button');
    eliminar.textContent = 'Eliminar';
    eliminar.onclick = () => eliminarConversacion(conversacion.id);
    menu.appendChild(eliminar);

    li.appendChild(menu);

    // Añadir evento para mostrar/ocultar el menú contextual
    menuButton.addEventListener('click', function() {
      menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
    });

    // Añadir evento para cambiar el nombre de la conversación
    li.addEventListener('mouseenter', function() {
      menu.style.display = 'none'; // Mostrar menú solo cuando el ratón esté encima
    });

    // Añadir conversación a la lista
    listaConversaciones.appendChild(li);
  });
}

// Enviar el mensaje al servidor
async function enviarPrompt() {
  const prompt = document.getElementById("prompt").value;
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: prompt })
  });

  const data = await res.json();
  alert("Respuesta: " + data.respuesta);
}

// Cambiar el nombre de una conversación
async function cambiarNombreConversacion(id) {
  const nuevoNombre = prompt('Introduce el nuevo nombre para la conversación');
  if (nuevoNombre) {
    const res = await fetch(`/api/cambiar_nombre_conversacion/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nuevo_nombre: nuevoNombre })
    });
    const data = await res.json();
    alert(data.message);
    cargarHistorialConversaciones();  // Recargar el historial
  }
}

// Eliminar una conversación
async function eliminarConversacion(id) {
  const confirmacion = confirm('¿Estás seguro de que quieres eliminar esta conversación?');
  if (confirmacion) {
    const res = await fetch(`/api/eliminar_conversacion/${id}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    alert(data.message);
    cargarHistorialConversaciones();  // Recargar el historial
  }
}
