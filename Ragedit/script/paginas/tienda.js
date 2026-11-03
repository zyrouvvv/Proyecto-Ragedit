var categoriaActual = "Todos";
var textoBuscado = leerParametro("q");

var grilla = document.getElementById("grilla-tienda");
var cajaFiltros = document.getElementById("filtros-tienda");

// Agrega un producto al carrito. El carrito vive en el servidor (base de datos):
// si el juego ya estaba, el servidor le suma 1 a la cantidad.
function agregarAlCarrito(id) {
  llamarApi("carrito.php", { accion: "agregar", id: id }, function (respuesta) {
    if (respuesta.ok == false) {
      mostrarAviso(respuesta.error);
      return;
    }
    actualizarContadorCarrito();
    mostrarAviso("Se agrego al carrito");
  });
}

// Cartelito que aparece un ratito abajo
function mostrarAviso(texto) {
  var aviso = document.getElementById("aviso");
  aviso.textContent = texto;
  aviso.hidden = false;
  setTimeout(function () {
    aviso.hidden = true;
  }, 1800);
}

// Crea los botones de categorias 
function crearFiltros() {
  var categorias = ["Todos"];
  for (var i = 0; i < productos.length; i++) {
    if (categorias.indexOf(productos[i].categoria) == -1) {
      categorias.push(productos[i].categoria);
    }
  }

  for (var j = 0; j < categorias.length; j++) {
    var boton = document.createElement("button");
    boton.type = "button";
    boton.className = "pestania";
    boton.textContent = categorias[j].toUpperCase();
    boton.setAttribute("data-categoria", categorias[j]);
    boton.setAttribute("aria-selected", String(j == 0));
    cajaFiltros.appendChild(boton);
  }
}

// Dibuja una tarjeta con un juego. Si el juego tiene imagen se muestra la imagen;
// si no, se queda el color de fondo con el nombre (como antes).
function crearTarjeta(p) {
  var tarjeta = document.createElement("article");
  tarjeta.className = "tarjeta";
  var enlace = "producto.html?id=" + p.id;
  var puntaje = p.totalResenas > 0 ? " · ★ " + p.promedio : "";
  tarjeta.innerHTML =
    '<a class="tarjeta-enlace" href="' + enlace + '" aria-label="Ver informacion de ' + escaparHtml(p.nombre) + '">' +
    '<div class="tarjeta-portada"><span>' +
    escaparHtml(p.nombre.toUpperCase()) +
    "</span></div>" +
    '<div class="tarjeta-cuerpo"><h3 class="tarjeta-nombre">' +
    escaparHtml(p.nombre) +
    '</h3><p class="tarjeta-categoria">' +
    escaparHtml(p.categoria) + puntaje +
    "</p></div></a>" +
    '<div class="tarjeta-pie"><span class="precio">' +
    textoPrecio(p.precio) +
    "</span>" +
    '<button type="button" class="boton boton-agregar" data-id="' +
    p.id +
    '">AGREGAR</button></div>';

  var portada = tarjeta.querySelector(".tarjeta-portada");
  portada.style.backgroundColor = p.fondo;
  if (p.imagen != "") {
    portada.style.backgroundImage = 'url("' + urlImagenJuego(p.imagen) + '")';
    portada.classList.add("tarjeta-portada-imagen");
  }
  return tarjeta;
}

function dibujarProductos(lista) {
  grilla.innerHTML = "";
  for (var i = 0; i < lista.length; i++) {
    grilla.appendChild(crearTarjeta(lista[i]));
  }
  if (lista.length == 0) {
    grilla.innerHTML =
      '<p class="vacio">No encontramos juegos con ese criterio.</p>';
  }
}



var numeroDePedido = 0;
var primeraVez = true;


function mostrarProductos() {
  if (productos == null) {
    return; // todavia no llego la lista: cuando llegue se llama a esta funcion otra vez
  }
  // La primera vez, sin filtros, ya tenemos todos los juegos (los acabamos de pedir)
  if (primeraVez == true && categoriaActual == "Todos" && textoBuscado == "") {
    primeraVez = false;
    dibujarProductos(productos);
    return;
  }
  primeraVez = false;

  numeroDePedido++;
  var estePedido = numeroDePedido;

  var datos = {
    accion: "listar",
    buscar: textoBuscado,
    categoria: categoriaActual == "Todos" ? "" : categoriaActual,
  };

  llamarApi("productos.php", datos, function (respuesta) {
    if (estePedido != numeroDePedido) {
      return; // llego una respuesta vieja, la ignoramos
    }
    if (respuesta.ok == false) {
      grilla.innerHTML =
        '<p class="vacio">No se pudieron cargar los juegos.</p>';
      return;
    }
    dibujarProductos(respuesta.productos);
  });
}

// El buscador del header llama a esta funcion
function filtrarPagina(texto) {
  textoBuscado = texto;
  mostrarProductos();
}

//  Eventos 

grilla.addEventListener("click", function (evento) {
  if (evento.target.classList.contains("boton-agregar")) {
    var id = evento.target.getAttribute("data-id");
    agregarAlCarrito(id);
  }
});

// Lo mismo para los botones de categorias
cajaFiltros.addEventListener("click", function (evento) {
  if (evento.target.classList.contains("pestania")) {
    categoriaActual = evento.target.getAttribute("data-categoria");

    var botones = cajaFiltros.querySelectorAll(".pestania");
    for (var i = 0; i < botones.length; i++) {
      botones[i].setAttribute("aria-selected", "false");
    }
    evento.target.setAttribute("aria-selected", "true");

    mostrarProductos();
  }
});

cargarProductos(function () {
  crearFiltros();
  mostrarProductos();
});
