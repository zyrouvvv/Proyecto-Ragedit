var listaCarrito = document.getElementById("lista-carrito");


function buscarProducto(id) {
  for (var i = 0; i < productos.length; i++) {
    if (productos[i].id == id) {
      return productos[i];
    }
  }
  return null;
}


function dibujarCarrito(carrito) {
  listaCarrito.innerHTML = "";

  var total = 0;
  var unidades = 0;

  if (carrito.length == 0) {
    listaCarrito.innerHTML =
      '<p class="vacio">Tu carrito esta vacio. Mira los juegos en la tienda.</p>';
  }

  for (var i = 0; i < carrito.length; i++) {
    var p = buscarProducto(carrito[i].id);
    if (p == null) {
      continue;
    }
    var cantidad = carrito[i].cantidad;
    total = total + p.precio * cantidad;
    unidades = unidades + cantidad;

    var fila = document.createElement("div");
    fila.className = "fila-carrito";
    fila.innerHTML =
      '<div class="fila-carrito-portada"><span>' +
      escaparHtml(p.nombre.substring(0, 3).toUpperCase()) +
      "</span></div>" +
      '<div><p class="fila-carrito-nombre">' +
      escaparHtml(p.nombre) +
      '</p><p class="fila-carrito-categoria">' +
      escaparHtml(p.categoria) +
      " · " +
      textoPrecio(p.precio) +
      "</p></div>" +
      '<div class="cantidad">' +
      '<button type="button" data-accion="restar" data-id="' +
      p.id +
      '" aria-label="Quitar una unidad">−</button>' +
      "<output>" +
      cantidad +
      "</output>" +
      '<button type="button" data-accion="sumar" data-id="' +
      p.id +
      '" aria-label="Sumar una unidad">+</button>' +
      "</div>" +
      '<p class="fila-carrito-subtotal">' +
      textoPrecio(p.precio * cantidad) +
      "</p>" +
      '<button type="button" class="fila-carrito-borrar" data-accion="eliminar" data-id="' +
      p.id +
      '" aria-label="Eliminar">✕</button>';
    // la portada: color de fondo, o la imagen del juego si tiene
    var portada = fila.querySelector(".fila-carrito-portada");
    portada.style.backgroundColor = p.fondo;
    if (p.imagen != "") {
      portada.style.backgroundImage = 'url("' + urlImagenJuego(p.imagen) + '")';
      portada.classList.add("fila-carrito-portada-imagen");
    }
    listaCarrito.appendChild(fila);
  }

  document.getElementById("resumen-cantidad").textContent = unidades;
  document.getElementById("resumen-subtotal").textContent = textoPrecio(total);
  document.getElementById("resumen-total").textContent = textoPrecio(total);

  // si el carrito esta vacio desactivamos los botones
  document.getElementById("boton-comprar").disabled = carrito.length == 0;
  document.getElementById("boton-vaciar").disabled = carrito.length == 0;

  ponerContadorCarrito(unidades);
}

// Le pide el carrito al servidor y lo dibuja
function mostrarCarrito() {
  llamarApi("carrito.php", { accion: "listar" }, function (respuesta) {
    if (respuesta.ok == false) {
      mostrarMensaje("mensaje-carrito", respuesta.error, "error");
      return;
    }
    dibujarCarrito(respuesta.carrito);
  });
}

// Cambia la cantidad de un producto (cambio puede ser 1 o -1). Si llega a 0, el servidor lo saca.
function cambiarCantidad(id, cambio) {
  llamarApi(
    "carrito.php",
    { accion: "cambiar", id: id, cambio: cambio },
    function () {
      mostrarCarrito();
    },
  );
}

function eliminarProducto(id) {
  llamarApi("carrito.php", { accion: "eliminar", id: id }, function () {
    mostrarCarrito();
  });
}

//  Eventos 
// Delegacion de eventos: un solo listener para los botones de todas las filas
listaCarrito.addEventListener("click", function (evento) {
  var boton = evento.target.closest("button");
  if (boton == null) {
    return;
  }
  var accion = boton.getAttribute("data-accion");
  var id = boton.getAttribute("data-id");

  if (accion == "sumar") {
    cambiarCantidad(id, 1);
  } else if (accion == "restar") {
    cambiarCantidad(id, -1);
  } else if (accion == "eliminar") {
    eliminarProducto(id);
  }
});

document.getElementById("boton-vaciar").addEventListener("click", function () {
  if (confirm("¿Queres vaciar el carrito?")) {
    llamarApi("carrito.php", { accion: "vaciar" }, function () {
      mostrarCarrito();
    });
  }
});

document.getElementById("boton-comprar").addEventListener("click", function () {
  if (exigirLogin() == false) {
    return;
  }
  // el total lo calcula el servidor con los precios de la base de datos
  llamarApi("carrito.php", { accion: "comprar" }, function (respuesta) {
    if (respuesta.ok == false) {
      mostrarMensaje("mensaje-carrito", respuesta.error, "error");
      return;
    }
    mostrarCarrito();
    mostrarMensaje(
      "mensaje-carrito",
      "¡Gracias por tu compra, " +
        respuesta.nombre +
        "! Total: " +
        textoPrecio(respuesta.total) +
        " (simulado).",
      "bien",
    );
  });
});

// Primero la lista de juegos (nombres, precios), despues lo que hay en el carrito
cargarProductos(function () {
  mostrarCarrito();
});
