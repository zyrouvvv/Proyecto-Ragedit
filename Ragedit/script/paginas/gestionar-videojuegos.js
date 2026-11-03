var iconoBorrar = '<span class="icono icono-delete" aria-hidden="true"></span>';
var iconoEditar = '<span class="icono icono-editar" aria-hidden="true"></span>';

var cuerpoTabla = document.getElementById("tabla-juegos");
var cajaBuscar = document.getElementById("buscar-juego");
var cajaCategoria = document.getElementById("filtro-categoria");
var botonLimpiar = document.getElementById("boton-limpiar");


function dibujarJuegos(lista) {
  cuerpoTabla.innerHTML = "";

  if (lista.length == 0) {
    cuerpoTabla.innerHTML = '<tr><td colspan="7">No hay videojuegos que coincidan.</td></tr>';
  }

  for (var i = 0; i < lista.length; i++) {
    var j = lista[i];


    var imagen = "";
    if (j.imagen != "") {
      imagen = '<img class="miniatura-juego" src="' + urlImagenJuego(j.imagen) + '" alt="">';
    } else {
      imagen = '<span class="muestra-color" style="background-color:' + escaparHtml(j.fondo) + '" title="Sin imagen: se usa este color"></span>';
    }

    var fila = document.createElement("tr");
    fila.innerHTML =
      "<td>" + j.id + "</td>" +
      "<td>" + imagen + "</td>" +
      "<td>" + escaparHtml(j.nombre) + "</td>" +
      "<td>" + escaparHtml(j.categoria) + "</td>" +
      "<td>$" + j.precio.toFixed(2) + "</td>" +
      "<td>" + (j.destacado != "" ? escaparHtml(j.destacado) : "-") + "</td>" +
      '<td><div class="tabla-acciones">' +
        '<a class="cuadrado cuadrado-editar" href="formulario-videojuego.html?id=' + j.id + '" aria-label="Editar">' + iconoEditar + '</a>' +
        '<button type="button" class="cuadrado cuadrado-borrar boton-eliminar" data-id="' + j.id + '" aria-label="Eliminar">' + iconoBorrar + '</button>' +
      "</div></td>";
    cuerpoTabla.appendChild(fila);
  }
}


function mostrarJuegos() {
  var datos = {
    accion: "listar",
    buscar: cajaBuscar.value.trim(),
    categoria: cajaCategoria.value
  };

  llamarApi("productos.php", datos, function (respuesta) {
    if (respuesta.ok == false) {
      mostrarMensaje("mensaje", respuesta.error, "error");
      return;
    }
    dibujarJuegos(respuesta.productos);
  });


  botonLimpiar.hidden = (datos.buscar == "" && datos.categoria == "");
}


function llenarCategorias() {
  cargarProductos(function (lista) {
    var vistas = [];
    for (var i = 0; i < lista.length; i++) {
      if (vistas.indexOf(lista[i].categoria) == -1) {
        vistas.push(lista[i].categoria);
      }
    }
    vistas.sort();
    for (var j = 0; j < vistas.length; j++) {
      var opcion = document.createElement("option");
      opcion.value = vistas[j];
      opcion.textContent = vistas[j];
      cajaCategoria.appendChild(opcion);
    }
  });
}

function eliminarJuego(id) {
  if (confirm("¿Seguro que queres eliminar este videojuego? Tambien se saca de los carritos.") == false) {
    return;
  }
  llamarApi("productos.php", { accion: "eliminar", id: id, csrf: CODIGO_CSRF }, function (respuesta) {
    if (respuesta.ok == false) {
      mostrarMensaje("mensaje", respuesta.error, "error");
      return;
    }
    mostrarMensaje("mensaje", "Videojuego eliminado.", "bien");
    mostrarJuegos();
  });
}

//  Eventos 
document.getElementById("formulario-filtros").addEventListener("submit", function (evento) {
  evento.preventDefault();
  mostrarJuegos();
});

cajaCategoria.addEventListener("change", mostrarJuegos);

botonLimpiar.addEventListener("click", function () {
  cajaBuscar.value = "";
  cajaCategoria.value = "";
  mostrarJuegos();
});

cuerpoTabla.addEventListener("click", function (evento) {
  var boton = evento.target.closest(".boton-eliminar");
  if (boton != null) {
    eliminarJuego(boton.getAttribute("data-id"));
  }
});

function iniciarGestionarJuegos() {
  if (exigirAdmin() == false) {
    return;
  }

  var ok = leerParametro("ok");
  if (ok == "creado") {
    mostrarMensaje("mensaje", "Videojuego creado.", "bien");
  } else if (ok == "editado") {
    mostrarMensaje("mensaje", "Cambios guardados.", "bien");
  }
  llenarCategorias();
  mostrarJuegos();
}

alCargarSesion(iniciarGestionarJuegos);
