// reportes.js
// Pantalla de administracion de reportes (reportes.html). Solo para administradores.
// Los datos vienen de api/reportes.php
var iconoBorrar = '<span class="icono icono-delete" aria-hidden="true"></span>';

var estadoActual = "Pendiente";   // la pestaña elegida: Pendiente | Resuelto | Descartado | "" (todos)
var numeroDePedido = 0;           // para ignorar respuestas viejas si se cambia de pestaña rapido
var cuerpoTabla = document.getElementById("tabla-reportes");

// Pone los numeritos en las pestañas: PENDIENTES (2)
function mostrarCuentas(cuentas) {
  var nombres = { "Pendiente": "PENDIENTES", "Resuelto": "RESUELTOS", "Descartado": "DESCARTADOS" };
  var total = 0;
  var pestanias = document.querySelectorAll("#filtros-reportes .pestania");
  for (var i = 0; i < pestanias.length; i++) {
    var estado = pestanias[i].getAttribute("data-estado");
    if (estado == "") {
      pestanias[i].textContent = "TODOS (" + (cuentas.Pendiente + cuentas.Resuelto + cuentas.Descartado) + ")";
    } else {
      pestanias[i].textContent = nombres[estado] + " (" + cuentas[estado] + ")";
    }
  }
}

// "Reportado": el nombre con un enlace a la publicacion o al perfil (si todavia existe)
function celdaReportado(r) {
  var nombre = escaparHtml(r.nombre);
  if (r.existe == false) {
    return "<em>" + nombre + "</em><br><small>(ya no existe)</small>";
  }
  if (r.tipo == "publicacion") {
    return '<a href="publicacion.html?id=' + r.destino + '">' + nombre + "</a>" +
           (r.autor != "" ? "<br><small>de " + escaparHtml(r.autor) + "</small>" : "");
  }
  return '<a href="perfil.html?u=' + encodeURIComponent(r.nombre) + '">' + nombre + "</a>";
}

// Los botones de cada fila dependen del estado del reporte
function botonesReporte(r) {
  var html = "";
  if (r.estado == "Pendiente") {
    html += '<button type="button" class="boton boton-pastilla boton-verde" data-accion="Resuelto" data-id="' + r.id + '">Resuelto</button>';
    html += '<button type="button" class="boton boton-pastilla boton-gris" data-accion="Descartado" data-id="' + r.id + '">Descartar</button>';
  } else {
    html += '<button type="button" class="boton boton-pastilla boton-gris" data-accion="Pendiente" data-id="' + r.id + '">Reabrir</button>';
  }
  // si lo reportado es una publicacion que todavia existe, se puede borrar desde aca
  if (r.tipo == "publicacion" && r.existe) {
    html += '<button type="button" class="cuadrado cuadrado-borrar boton-eliminar" data-accion="eliminar_publicacion" data-id="' + r.id + '" aria-label="Eliminar publicacion">' + iconoBorrar + '</button>';
  }
  return html;
}

function dibujarReportes(lista) {
  cuerpoTabla.innerHTML = "";

  if (lista.length == 0) {
    var vacia = document.createElement("tr");
    vacia.innerHTML = '<td colspan="9" class="tabla-vacia">No hay reportes en esta pestaña.</td>';
    cuerpoTabla.appendChild(vacia);
    return;
  }

  for (var i = 0; i < lista.length; i++) {
    var r = lista[i];
    var fila = document.createElement("tr");
    fila.innerHTML =
      "<td>" + r.id + "</td>" +
      '<td title="' + escaparHtml(new Date(r.fecha).toLocaleString("es-AR")) + '">' + haceCuanto(r.fecha) + "</td>" +
      "<td>" + (r.tipo == "publicacion" ? "Publicacion" : "Usuario") + "</td>" +
      "<td>" + celdaReportado(r) + "</td>" +
      "<td>" + escaparHtml(r.motivo) + "</td>" +
      "<td>" + (r.detalle != "" ? escaparHtml(r.detalle) : "-") + "</td>" +
      "<td>" + (r.quien != "" ? '<a href="perfil.html?u=' + encodeURIComponent(r.quien) + '">' + escaparHtml(r.quien) + "</a>" : "-") + "</td>" +
      '<td><span class="etiqueta-estado etiqueta-' + r.estado.toLowerCase() + '">' + r.estado + "</span></td>" +
      '<td><div class="tabla-acciones">' + botonesReporte(r) + "</div></td>";
    cuerpoTabla.appendChild(fila);
  }
}

function cargarReportes() {
  numeroDePedido++;
  var estePedido = numeroDePedido;

  llamarApi("reportes.php", { accion: "listar", estado: estadoActual }, function (respuesta) {
    if (estePedido != numeroDePedido) {
      return; // llego una respuesta vieja, la ignoramos
    }
    if (respuesta.ok == false) {
      mostrarMensaje("mensaje", respuesta.error, "error");
      return;
    }
    mostrarCuentas(respuesta.cuentas);
    dibujarReportes(respuesta.reportes);
  });
}

// Cambia el estado de un reporte (Pendiente, Resuelto o Descartado)
function cambiarEstado(id, estado) {
  var datos = { accion: "cambiar_estado", id: id, estado: estado, csrf: CODIGO_CSRF };
  llamarApi("reportes.php", datos, function (respuesta) {
    if (respuesta.ok == false) {
      mostrarMensaje("mensaje", respuesta.error, "error");
      return;
    }
    mostrarMensaje("mensaje", "Reporte marcado como " + estado.toLowerCase() + ".", "bien");
    cargarReportes();
  });
}

function eliminarPublicacion(id) {
  if (confirm("¿Seguro que queres eliminar la publicacion reportada? Tambien se borran sus comentarios y no se puede deshacer.") == false) {
    return;
  }
  llamarApi("reportes.php", { accion: "eliminar_publicacion", id: id, csrf: CODIGO_CSRF }, function (respuesta) {
    if (respuesta.ok == false) {
      mostrarMensaje("mensaje", respuesta.error, "error");
      return;
    }
    mostrarMensaje("mensaje", "Publicacion eliminada. Sus reportes quedaron como resueltos.", "bien");
    cargarReportes();
  });
}

// ----- Eventos -----
// Delegacion de eventos: un solo listener para los botones de todas las filas
cuerpoTabla.addEventListener("click", function (evento) {
  var boton = evento.target.closest("button");
  if (boton == null) {
    return;
  }
  var id = boton.getAttribute("data-id");
  var accion = boton.getAttribute("data-accion");
  if (accion == "eliminar_publicacion") {
    eliminarPublicacion(id);
  } else {
    cambiarEstado(id, accion);
  }
});

document.getElementById("filtros-reportes").addEventListener("click", function (evento) {
  var pestania = evento.target.closest(".pestania");
  if (pestania == null) {
    return;
  }
  estadoActual = pestania.getAttribute("data-estado");

  var pestanias = this.querySelectorAll(".pestania");
  for (var i = 0; i < pestanias.length; i++) {
    pestanias[i].setAttribute("aria-selected", String(pestanias[i] == pestania));
  }
  document.getElementById("mensaje").hidden = true;
  cargarReportes();
});

function iniciarReportes() {
  if (exigirAdmin() == false) {
    return;
  }
  cargarReportes();
}

alCargarSesion(iniciarReportes);
