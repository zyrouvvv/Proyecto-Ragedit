
function mostrarMensaje(id, texto, tipo) {
  var caja = document.getElementById(id);
  caja.textContent = texto;
  caja.className = "estado estado-" + tipo;
  caja.hidden = false;
}


function escaparHtml(texto) {
  return String(texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}


function ponerError(id, texto) {
  document.getElementById(id).textContent = texto;
}

// Convierte un numero grande en texto corto: 1500 -> 1.5K
function formatearNumero(n) {
  if (n >= 1000000) {
    return (Math.round(n / 100000) / 10) + "M";
  }
  if (n >= 1000) {
    return (Math.round(n / 100) / 10) + "K";
  }
  return String(n);
}

// Devuelve un texto tipo "Hace 2 dias" a partir de una fecha (en milisegundos)
function haceCuanto(fecha) {
  var segundos = (Date.now() - fecha) / 1000;
  var minutos = segundos / 60;
  var horas = minutos / 60;
  var dias = horas / 24;

  if (segundos < 60) {
    return "Hace un momento";
  }
  if (minutos < 60) {
    return "Hace " + Math.floor(minutos) + " min";
  }
  if (horas < 24) {
    return "Hace " + Math.floor(horas) + "h";
  }
  if (dias < 2) {
    return "Hace 1 dia";
  }
  if (dias < 30) {
    return "Hace " + Math.floor(dias) + " dias";
  }
  if (dias < 60) {
    return "Hace 1 mes";
  }
  return "Hace " + Math.floor(dias / 30) + " meses";
}

// 29.99 -> "US$ 29,99"
function textoPrecio(n) {
  return "US$ " + n.toFixed(2).replace(".", ",");
}

// Lee un dato de la url. Ej: en publicacion.html?id=2 -> leerParametro("id") da "2"
function leerParametro(nombre) {
  var parametros = new URLSearchParams(window.location.search);
  var valor = parametros.get(nombre);
  if (valor == null) {
    return "";
  }
  return valor;
}

function crearEstrellas(valor) {
  var llenas = Math.round(valor);
  var caja = document.createElement("span");
  caja.className = "estrellas";
  caja.setAttribute("role", "img");
  caja.setAttribute("aria-label", valor + " de 5 estrellas");
  caja.textContent = "★★★★★".slice(0, llenas) + "☆☆☆☆☆".slice(0, 5 - llenas);
  return caja;
}