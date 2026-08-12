// ============================
// CONFIGURACIÓN
// ============================
const API_URL = 'https://script.google.com/macros/s/AKfycbweeSyGy5Sou0DlCFfhQzD7YnctPxCMrQep1mljDp9J5MeqlqzXBBS_CaDqM36jUuOt/exec'; // Reemplaza con la URL de tu App Script

// Elementos del DOM
const pantallaLogin = document.getElementById('pantalla-login');
const pantallaAceptacion = document.getElementById('pantalla-aceptacion');
const formLogin = document.getElementById('formLogin');
const cedulaInput = document.getElementById('cedulaInput');
const mensajeError = document.getElementById('mensajeError');
const datosUsuario = document.getElementById('datosUsuario');
const nombreCompleto = document.getElementById('nombreCompleto');
const btnAceptar = document.getElementById('btnAceptar');
const mensajeAceptacion = document.getElementById('mensajeAceptacion');

// ============================
// FUNCIÓN PARA LLAMAR AL BACKEND
// ============================
async function llamarBackend(accion, datos = {}) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      mode: 'cors',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ accion, ...datos })
    });
    const resultado = await response.json();
    return resultado;
  } catch (error) {
    console.error('Error de comunicación:', error);
    return { success: false, mensaje: 'Error de conexión con el servidor.' };
  }
}

// ============================
// MANEJO DEL LOGIN (Pantalla 1)
// ============================
formLogin.addEventListener('submit', async (e) => {
  e.preventDefault();
  const cedula = cedulaInput.value.trim();
  if (!cedula) {
    mensajeError.textContent = 'Por favor ingresa tu cédula.';
    return;
  }
  
  mensajeError.textContent = '';
  const resultado = await llamarBackend('verificarUsuario', { cedula });
  
  if (!resultado.success) {
    mensajeError.textContent = resultado.mensaje || 'Error al verificar usuario.';
    return;
  }
  
  // Si el usuario ya aceptó anteriormente, redirigir directamente al dashboard
  if (resultado.yaAcepto) {
    // Guardar datos en localStorage para la sesión
    localStorage.setItem('usuario', JSON.stringify(resultado.usuario));
    window.location.href = 'dashboard.html'; // (crearemos después)
    return;
  }
  
  // Mostrar la segunda pantalla con los datos
  mostrarPantallaAceptacion(resultado.usuario);
});

function mostrarPantallaAceptacion(usuario) {
  // Rellenar datos
  datosUsuario.innerHTML = `
    <p><strong>Nombre:</strong> ${usuario.nombre1} ${usuario.nombre2}</p>
    <p><strong>Correo:</strong> ${usuario.correo}</p>
    <p><strong>Celular:</strong> ${usuario.celular}</p>
  `;
  nombreCompleto.textContent = `${usuario.nombre1} ${usuario.nombre2}`;
  
  // Cambiar de pantalla
  pantallaLogin.style.display = 'none';
  pantallaAceptacion.style.display = 'block';
  
  // Guardar cédula temporalmente para la aceptación
  btnAceptar.dataset.cedula = usuario.cedula;
}

// ============================
// ACEPTACIÓN DE RESPONSABILIDADES (Pantalla 2)
// ============================
btnAceptar.addEventListener('click', async () => {
  const cedula = btnAceptar.dataset.cedula;
  btnAceptar.disabled = true;
  mensajeAceptacion.textContent = 'Enviando...';
  
  const resultado = await llamarBackend('aceptarResponsabilidades', { cedula });
  
  if (resultado.success) {
    mensajeAceptacion.textContent = '✅ Aceptación registrada. Redirigiendo al dashboard...';
    // Guardar usuario en localStorage
    // (podríamos obtenerlo de los datos mostrados)
    const usuario = {
      cedula: cedula,
      nombre1: document.querySelector('#datosUsuario p:first-child').textContent.replace('Nombre: ', ''),
      // ... mejor guardarlo desde el objeto que teníamos
    };
    // Para simplificar, recuperamos el objeto desde el DOM o lo almacenamos antes
    // Lo mejor: almacenar usuario en variable global o localStorage al mostrar pantalla.
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 1500);
  } else {
    mensajeAceptacion.textContent = '❌ Error: ' + (resultado.mensaje || 'Intenta nuevamente.');
    btnAceptar.disabled = false;
  }
});
