// ============================
// CONFIGURACIÓN
// ============================
const API_URL = 'https://script.google.com/macros/s/AKfycbwHtqXBshtSSy6TSTITPV13KDXj6q-sgah6qJA04ylwLETDl1cLE1EngUuWfTS_TJkC/exec';

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
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
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
formLogin.addEventListener('submit', async (e) => {
  e.preventDefault();
  const cedula = cedulaInput.value.trim();
  
  if (!cedula) {
    mensajeError.style.color = 'red';
    mensajeError.textContent = 'Por favor ingresa tu cédula.';
    return;
  }
  
  try {
    // 1. TEXTO MIENTRAS INGRESA (ESTADO DE ESPERA)
    mensajeError.style.color = 'blue'; 
    mensajeError.textContent = '⏳ Verificando, por favor espera...';
    cedulaInput.disabled = true; // Bloqueamos para evitar doble clic
    
    // Llamada al backend
    const resultado = await llamarBackend('verificarUsuario', { cedula });
    
    // 2. TEXTO DE NO AUTORIZADO
    if (!resultado.success) {
      mensajeError.style.color = 'red';
      mensajeError.textContent = '❌ ' + (resultado.mensaje || 'Usted no está autorizado.');
      return; // Detenemos la ejecución aquí
    }
    
    // Limpiamos el mensaje si todo sale bien
    mensajeError.textContent = '';
    
    // 3. REDIRECCIÓN O PANTALLA DE ACEPTACIÓN
    if (resultado.yaAcepto) {
      localStorage.setItem('usuario', JSON.stringify(resultado.usuario));
      window.location.href = 'dashboard.html'; 
      return;
    }
    
    mostrarPantallaAceptacion(resultado.usuario);

  } catch (error) {
    // Si algo catastrófico pasa, no se congela la pantalla
    console.error('Error en el login:', error);
    mensajeError.style.color = 'red';
    mensajeError.textContent = '❌ Ocurrió un error en el sistema. Intenta de nuevo.';
  } finally {
    // Siempre desbloqueamos el input al terminar (ya sea éxito o error)
    cedulaInput.disabled = false; 
  }
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
  // --- NUEVA VALIDACIÓN LEGAL ---
  const checkLegal = document.getElementById('checkLegal');
  if (!checkLegal.checked) {
    mensajeAceptacion.style.color = 'red';
    mensajeAceptacion.textContent = '❌ Debes marcar la casilla para aceptar los términos.';
    return; // Evita que el código continúe si no ha marcado la casilla
  }
  // ------------------------------

  const cedula = btnAceptar.dataset.cedula;
  btnAceptar.disabled = true;
  
  mensajeAceptacion.style.color = 'blue';
  mensajeAceptacion.textContent = '⏳ Registrando firma digital y validando datos...';
  
  // 1. OBTENER DATOS LEGALES (IP y Dispositivo)
  let ipUsuario = 'Desconocida';
  try {
    // Llamada rápida a una API pública para ver la IP
    const resIp = await fetch('https://api.ipify.org?format=json');
    const dataIp = await resIp.json();
    ipUsuario = dataIp.ip;
  } catch (e) {
    console.warn('No se pudo obtener la IP, el firewall del usuario podría estar bloqueándolo.');
  }
  
  const datosDispositivo = navigator.userAgent; // Ej: Chrome en Windows, Safari en iPhone
  
  // 2. ENVIAR AL BACKEND
  const resultado = await llamarBackend('aceptarResponsabilidades', { 
    cedula: cedula,
    ip: ipUsuario,
    dispositivo: datosDispositivo
  });
  
  // 3. RESPUESTA
  if (resultado.success) {
    mensajeAceptacion.style.color = 'green';
    mensajeAceptacion.textContent = '✅ Aceptación legal registrada con éxito. Redirigiendo...';
    
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 1500);
  } else {
    mensajeAceptacion.style.color = 'red';
    mensajeAceptacion.textContent = '❌ Error: ' + (resultado.mensaje || 'Intenta nuevamente.');
    btnAceptar.disabled = false;
  }
});
