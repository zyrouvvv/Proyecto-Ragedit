// reportes.js
// El cartelito para REPORTAR una publicacion o un usuario. Lo usan publicacion.html y perfil.html.
//
// Uso:   abrirReporte("publicacion", 9, "SALIO EL GTA?");
//        abrirReporte("usuario", 4, "fer_13");
//
// Arma la ventanita solita (no hace falta escribirla en el HTML) y manda el reporte a api/reportes.php.

// Tiene que ser la misma lista que MOTIVOS_REPORTE de api/reportes.php
var MOTIVOS_REPORTE = [
  "Spam",
  "Contenido ofensivo",
  "Acoso",
  "Suplantacion de identidad",
  "Informacion falsa",
  "Otro"
];

var ventanaReporte = null;   // la ventanita (se crea la primera vez que se usa)
var reporteActual = null;    // { tipo, id } de lo que se esta reportando

function crearVentanaReporte() {
  var ventana = document.createElement("dialog");
  ventana.className = "ventana";
  ventana.setAttribute("aria-labelledby", "reporte-titulo");

  var opciones = '<option value="">Elegi un motivo...</option>';
  for (var i = 0; i < MOTIVOS_REPORTE.length; i++) {
    opciones += '<option value="' + MOTIVOS_REPORTE[i] + '">' + MOTIVOS_REPORTE[i] + "</option>";
  }

  ventana.innerHTML =
    '<form class="ventana-formulario" id="formulario-reporte" novalidate>' +
      '<h2 class="ventana-titulo" id="reporte-titulo">REPORTAR</h2>' +
      '<p class="ventana-referencia" id="reporte-referencia"></p>' +
      '<p class="estado estado-error" id="reporte-mensaje" role="alert" hidden></p>' +
      '<div class="campo">' +
        '<label class="campo-etiqueta" for="reporte-motivo">Motivo</label>' +
        '<select class="desplegable desplegable-panel" id="reporte-motivo">' + opciones + "</select>" +
      "</div>" +
      '<div class="campo">' +
        '<label class="campo-etiqueta" for="reporte-detalle">Detalle <span id="reporte-detalle-opcional">(opcional)</span></label>' +
        '<textarea class="campo-entrada campo-texto" id="reporte-detalle" maxlength="300" rows="4" placeholder="Contanos que paso..."></textarea>' +
        '<p class="campo-ayuda campo-ayuda-chica"><span id="reporte-contador">0</span>/300 caracteres</p>' +
      "</div>" +
      '<div class="tabla-acciones">' +
        '<button class="boton boton-pastilla boton-verde" id="reporte-enviar" type="submit">ENVIAR REPORTE</button>' +
        '<button class="boton boton-pastilla boton-gris" id="reporte-cancelar" type="button">CANCELAR</button>' +
      "</div>" +
    "</form>" +
    '<div class="ventana-gracias" id="reporte-gracias" hidden>' +
      '<h2 class="ventana-titulo">¡GRACIAS!</h2>' +
      '<p class="ventana-texto">Recibimos tu reporte. Un administrador lo va a revisar.</p>' +
      '<div class="tabla-acciones"><button class="boton boton-pastilla boton-gris" id="reporte-cerrar" type="button">CERRAR</button></div>' +
    "</div>";
  document.body.appendChild(ventana);

  var detalle = ventana.querySelector("#reporte-detalle");
  detalle.addEventListener("input", function () {
    ventana.querySelector("#reporte-contador").textContent = detalle.value.length;
  });

  // si el motivo es "Otro" el detalle pasa a ser obligatorio
  ventana.querySelector("#reporte-motivo").addEventListener("change", function () {
    ventana.querySelector("#reporte-detalle-opcional").textContent = (this.value == "Otro") ? "(obligatorio)" : "(opcional)";
  });

  ventana.querySelector("#reporte-cancelar").addEventListener("click", function () { ventana.close(); });
  ventana.querySelector("#reporte-cerrar").addEventListener("click", function () { ventana.close(); });

  // un click en el fondo oscuro (fuera de la ventana) tambien la cierra
  ventana.addEventListener("click", function (evento) {
    if (evento.target == ventana) {
      ventana.close();
    }
  });

  ventana.querySelector("#formulario-reporte").addEventListener("submit", function (evento) {
    evento.preventDefault();
    enviarReporte(ventana);
  });

  return ventana;
}

function enviarReporte(ventana) {
  var mensaje = ventana.querySelector("#reporte-mensaje");
  var motivo = ventana.querySelector("#reporte-motivo").value;
  var detalle = ventana.querySelector("#reporte-detalle").value.trim();

  var error = "";
  if (motivo == "") {
    error = "Elegi un motivo de la lista.";
  } else if (motivo == "Otro" && detalle == "") {
    error = "Si el motivo es \"Otro\", contanos que paso.";
  }
  if (error != "") {
    mensaje.textContent = error;
    mensaje.hidden = false;
    return;
  }

  var boton = ventana.querySelector("#reporte-enviar");
  boton.disabled = true;   // para que un doble clic no mande el reporte dos veces

  var datos = { accion: "crear", tipo: reporteActual.tipo, id: reporteActual.id, motivo: motivo, detalle: detalle };
  llamarApi("reportes.php", datos, function (respuesta) {
    boton.disabled = false;
    if (respuesta.ok == false) {
      mensaje.textContent = respuesta.error;
      mensaje.hidden = false;
      return;
    }
    ventana.querySelector("#formulario-reporte").hidden = true;
    ventana.querySelector("#reporte-gracias").hidden = false;
  });
}

// Abre la ventanita. "tipo" es "publicacion" o "usuario"; "id" el de lo que se reporta; "nombre" es lo que se muestra
function abrirReporte(tipo, id, nombre) {
  if (exigirLogin() == false) {
    return;
  }
  if (ventanaReporte == null) {
    ventanaReporte = crearVentanaReporte();
  }

  reporteActual = { tipo: tipo, id: id };
  ventanaReporte.querySelector("#reporte-titulo").textContent = (tipo == "usuario") ? "REPORTAR USUARIO" : "REPORTAR PUBLICACION";
  ventanaReporte.querySelector("#reporte-referencia").textContent = nombre;

  // la ventanita se deja limpia cada vez que se abre
  ventanaReporte.querySelector("#formulario-reporte").hidden = false;
  ventanaReporte.querySelector("#reporte-gracias").hidden = true;
  ventanaReporte.querySelector("#reporte-mensaje").hidden = true;
  ventanaReporte.querySelector("#reporte-motivo").value = "";
  ventanaReporte.querySelector("#reporte-detalle").value = "";
  ventanaReporte.querySelector("#reporte-contador").textContent = "0";
  ventanaReporte.querySelector("#reporte-detalle-opcional").textContent = "(opcional)";

  ventanaReporte.showModal();
}
