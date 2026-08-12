// ============================
// CONFIGURACIÓN
// ============================
// Asegúrate de que esta URL sea la correcta de tu última implementación
const API_URL = 'https://script.google.com/macros/s/AKfycbwgIX-hNGMdUozL7lBsHrNmkTBGSBzl_j0MJxibUh_bX0A9UC5REd0A3oitcFmYUvX6/exec';

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
    
    // 3. REDIRECCIÓN TEMPORAL A FULLFRIOS SI YA ACEPTÓ ANTES
    if (resultado.yaAcepto) {
      localStorage.setItem('usuario', JSON.stringify(resultado.usuario));
      window.location.href = 'https://fullfrios.com'; 
      return;
    }
    
    mostrarPantallaAceptacion(resultado.usuario);

  } catch (error) {
    console.error('Error en el login:', error);
    mensajeError.style.color = 'red';
    mensajeError.textContent = '❌ Ocurrió un error en el sistema. Intenta de nuevo.';
  } finally {
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
  // Validación del Checkbox Legal
  const checkLegal = document.getElementById('checkLegal');
  if (!checkLegal.checked) {
    mensajeAceptacion.style.color = 'red';
    mensajeAceptacion.textContent = '❌ Debes marcar la casilla para aceptar los términos.';
    return; 
  }

  const cedula = btnAceptar.dataset.cedula;
  btnAceptar.disabled = true;
  
  mensajeAceptacion.style.color = 'blue';
  mensajeAceptacion.textContent = '⏳ Registrando firma digital y validando datos...';
  
// 1. OBTENER IP CON LÍMITE DE 3 SEGUNDOS PARA EVITAR CONGELAMIENTOS
  let ipUsuario = 'Desconocida';
  try {
    const controlador = new AbortController();
    const idTiempo = setTimeout(() => controlador.abort(), 3000); // Límite de 3 segundos
    
    const resIp = await fetch('https://api.ipify.org?format=json', { signal: controlador.signal });
    clearTimeout(idTiempo); // Apaga el cronómetro si respondió rápido
    
    const dataIp = await resIp.json();
    ipUsuario = dataIp.ip;
  } catch (e) {
    console.warn('La IP tardó demasiado. Se avanza sin ella para no hacer esperar al usuario.');
  }
  
  const datosDispositivo = navigator.userAgent;
  
  // Enviar al Backend
  const resultado = await llamarBackend('aceptarResponsabilidades', { 
    cedula: cedula,
    ip: ipUsuario,
    dispositivo: datosDispositivo
  });
  
  // RESPUESTA Y REDIRECCIÓN TEMPORAL A FULLFRIOS AL ACEPTAR POR PRIMERA VEZ
  if (resultado.success) {
    mensajeAceptacion.style.color = 'green';
    mensajeAceptacion.textContent = '✅ Aceptación legal registrada con éxito. Redirigiendo...';
    
    setTimeout(() => {
      window.location.href = 'https://fullfrios.com';
    }, 1500);
  } else {
    mensajeAceptacion.style.color = 'red';
    mensajeAceptacion.textContent = '❌ Error: ' + (resultado.mensaje || 'Intenta nuevamente.');
    btnAceptar.disabled = false;
  }
});
