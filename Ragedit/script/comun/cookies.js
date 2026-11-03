

var NOMBRE_COOKIE_CONSENTO = "ragedit_cookies";
var DIAS_CONSENTO = 180;

var COOKIES_PREFERENCIAS = [];
var COOKIES_ESTADISTICAS = [];


function leerCookie(nombre) {
  var partes = document.cookie.split("; ");
  for (var i = 0; i < partes.length; i++) {
    var par = partes[i].split("=");
    if (par[0] == nombre) {
      return decodeURIComponent(par.slice(1).join("="));
    }
  }
  return null;
}

function guardarCookie(nombre, valor, dias) {
  var vence = new Date(Date.now() + dias * 24 * 60 * 60 * 1000);
  var texto = nombre + "=" + encodeURIComponent(valor) + "; expires=" + vence.toUTCString() + "; path=/; SameSite=Lax";
  if (window.location.protocol == "https:") {
    texto += "; Secure";
  }
  document.cookie = texto;
}

function borrarCookie(nombre) {
  document.cookie = nombre + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax";
}



function leerConsentimiento() {
  var crudo = leerCookie(NOMBRE_COOKIE_CONSENTO);
  if (crudo == null) {
    // respaldo: si el navegador no deja guardar cookies (por ejemplo al abrir con file://)
    try {
      crudo = window.localStorage.getItem(NOMBRE_COOKIE_CONSENTO);
    } catch (error) {
      crudo = null;
    }
  }
  if (crudo == null) {
    return null;
  }
  try {
    var datos = JSON.parse(crudo);
    return { preferencias: datos.preferencias == true, estadisticas: datos.estadisticas == true };
  } catch (error) {
    return null;
  }
}

function cookiesPermitidas(categoria) {
  if (categoria == "esenciales") {
    return true;
  }
  var consentimiento = leerConsentimiento();
  if (consentimiento == null) {
    return false;
  }
  return consentimiento[categoria] == true;
}

function guardarConsentimiento(preferencias, estadisticas) {
  var valor = JSON.stringify({ preferencias: preferencias, estadisticas: estadisticas });
  guardarCookie(NOMBRE_COOKIE_CONSENTO, valor, DIAS_CONSENTO);
  try {
    window.localStorage.setItem(NOMBRE_COOKIE_CONSENTO, valor);
  } catch (error) {
    // si tampoco se puede, la eleccion vale solo para esta pagina
  }

  var i;
  if (preferencias == false) {
    for (i = 0; i < COOKIES_PREFERENCIAS.length; i++) {
      borrarCookie(COOKIES_PREFERENCIAS[i]);
    }
  }
  if (estadisticas == false) {
    for (i = 0; i < COOKIES_ESTADISTICAS.length; i++) {
      borrarCookie(COOKIES_ESTADISTICAS[i]);
    }
  }
  // por si alguna pagina quiere reaccionar al cambio
  document.dispatchEvent(new CustomEvent("cookies-actualizadas", { detail: { preferencias: preferencias, estadisticas: estadisticas } }));
}


// ----- Cartel -----

var avisoCookies = null;

function cerrarAvisoCookies() {
  if (avisoCookies != null) {
    avisoCookies.remove();
    avisoCookies = null;
  }
}

function mostrarVistaCookies(nombre) {
  document.getElementById("cookies-vista-principal").hidden = (nombre != "principal");
  document.getElementById("cookies-vista-config").hidden = (nombre != "config");
}

function armarAvisoCookies() {
  var aviso = document.createElement("div");
  aviso.className = "cookies";
  aviso.id = "aviso-cookies";
  aviso.setAttribute("role", "dialog");
  aviso.setAttribute("aria-labelledby", "cookies-titulo");

  aviso.innerHTML =
    '<div class="cookies-caja panel">' +
      '<div class="cookies-vista" id="cookies-vista-principal">' +
        '<h2 class="cookies-titulo" id="cookies-titulo">Usamos cookies</h2>' +
        '<p class="cookies-texto">Ragedit usa cookies esenciales para que funcionen tu sesion y el carrito. ' +
        'Con tu permiso tambien usamos cookies de preferencias y de estadisticas para mejorar la experiencia. ' +
        'Podes cambiar tu eleccion cuando quieras desde el pie de la pagina.</p>' +
        '<div class="cookies-botones">' +
          '<button class="boton boton-pastilla boton-verde" type="button" id="cookies-aceptar">Aceptar todas</button>' +
          '<button class="boton boton-pastilla boton-gris" type="button" id="cookies-rechazar">Solo esenciales</button>' +
          '<button class="boton" type="button" id="cookies-configurar">Configurar</button>' +
        '</div>' +
      '</div>' +
      '<div class="cookies-vista" id="cookies-vista-config" hidden>' +
        '<h2 class="cookies-titulo">Configurar cookies</h2>' +
        '<ul class="cookies-lista">' +
          '<li><label class="cookies-opcion"><input type="checkbox" checked disabled>' +
            '<span><strong>Esenciales</strong>Mantienen tu sesion y el carrito. Siempre activas.</span></label></li>' +
          '<li><label class="cookies-opcion"><input type="checkbox" id="cookies-preferencias">' +
            '<span><strong>Preferencias</strong>Recuerdan tus ajustes de uso en el sitio.</span></label></li>' +
          '<li><label class="cookies-opcion"><input type="checkbox" id="cookies-estadisticas">' +
            '<span><strong>Estadisticas</strong>Nos ayudan a saber que partes del sitio se usan mas.</span></label></li>' +
        '</ul>' +
        '<div class="cookies-botones">' +
          '<button class="boton boton-pastilla boton-verde" type="button" id="cookies-guardar">Guardar eleccion</button>' +
          '<button class="boton" type="button" id="cookies-volver">Volver</button>' +
        '</div>' +
      '</div>' +
    '</div>';

  document.body.appendChild(aviso);
  avisoCookies = aviso;

  document.getElementById("cookies-aceptar").addEventListener("click", function () {
    guardarConsentimiento(true, true);
    cerrarAvisoCookies();
  });
  document.getElementById("cookies-rechazar").addEventListener("click", function () {
    guardarConsentimiento(false, false);
    cerrarAvisoCookies();
  });
  document.getElementById("cookies-configurar").addEventListener("click", function () {
    mostrarVistaCookies("config");
  });
  document.getElementById("cookies-volver").addEventListener("click", function () {
    mostrarVistaCookies("principal");
  });
  document.getElementById("cookies-guardar").addEventListener("click", function () {
    guardarConsentimiento(
      document.getElementById("cookies-preferencias").checked,
      document.getElementById("cookies-estadisticas").checked
    );
    cerrarAvisoCookies();
  });
}

function abrirAvisoCookies(conConfig) {
  if (avisoCookies == null) {
    armarAvisoCookies();
  }
  if (conConfig == true) {
    var actual = leerConsentimiento();
    document.getElementById("cookies-preferencias").checked = (actual != null && actual.preferencias);
    document.getElementById("cookies-estadisticas").checked = (actual != null && actual.estadisticas);
    mostrarVistaCookies("config");
  }
  document.getElementById("cookies-aceptar").focus({ preventScroll: true });
}

var pieCookies = document.querySelector(".pie");
if (pieCookies != null) {
  var enlaceCookies = document.createElement("a");
  enlaceCookies.href = "#";
  enlaceCookies.id = "abrir-cookies";
  enlaceCookies.textContent = "Cookies";
  enlaceCookies.addEventListener("click", function (evento) {
    evento.preventDefault();
    abrirAvisoCookies(true);
  });
  pieCookies.appendChild(enlaceCookies);
}

if (leerConsentimiento() == null) {
  abrirAvisoCookies(false);
}
