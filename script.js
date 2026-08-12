// ============================
// CONFIGURACIÓN
// ============================
// Quitamos el proxy. Usa tu URL de Google Apps Script directamente.
const API_URL = 'https://script.google.com/macros/s/AKfycbxyQ28yTG_13N3WZtEB4aixe8PoHFtglRHEJlMnQMf3_67GQiTjbcbrq0vlDaF_E5Hd/exec';

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
      // CAMBIO CLAVE 1: Usar text/plain evita el bloqueo de CORS (preflight OPTIONS)
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      // CAMBIO CLAVE 2: Google siempre responde con un 302 Redirect, debemos seguirlo
      redirect: 'follow', 
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
// ============================
// MANEJO DEL LOGIN (Pantalla 1)
// ============================
formLogin.addEventListener('submit', async (e) => {
  e.preventDefault();
  const cedula = cedulaInput.value.trim();
  
  if (!cedula) {
    mensajeError.style.color = 'red';
    mensajeError.textContent = 'Por favor ingresa tu cédula.';
    return;
  }
  
  // 1. ESTADO DE ESPERA
  mensajeError.style.color = 'blue'; // Puedes cambiar el color según tu diseño
  mensajeError.textContent = '⏳ Verificando, por favor espera...';
  cedulaInput.disabled = true; // Bloqueamos el input mientras consulta
  
  // Llamada al backend
  const resultado = await llamarBackend('verificarUsuario', { cedula });
  
  // Desbloqueamos el input en cuanto llega la respuesta
  cedulaInput.disabled = false; 
  
  // 2. ESTADO DE NO AUTORIZADO / NO REGISTRADO
  if (!resultado.success) {
    mensajeError.style.color = 'red';
    // El backend enviará: "Usuario no autorizado..." o "Cédula no registrada..."
    // Le agregamos un ícono para que sea más visible
    mensajeError.textContent = '❌ ' + (resultado.mensaje || 'Usted no está autorizado.');
    return;
  }
  
  // Limpiamos el mensaje si todo sale bien
  mensajeError.textContent = '';
  
  // Si el usuario ya aceptó anteriormente, redirigir directamente al dashboard
  if (resultado.yaAcepto) {
    localStorage.setItem('usuario', JSON.stringify(resultado.usuario));
    window.location.href = 'dashboard.html'; 
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
