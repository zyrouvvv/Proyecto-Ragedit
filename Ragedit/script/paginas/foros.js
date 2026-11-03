
var orden = "tendencia";     
var comunidad = "";           
var textoBuscado = leerParametro("q");

var cajaFilas = document.getElementById("filas");
var botonFiltro = document.getElementById("nota-filtro");


var numeroDePedido = 0;


function mostrarPublicaciones() {
  numeroDePedido++;
  var estePedido = numeroDePedido;

  var datos = {
    accion: "listar",
    orden: orden,
    comunidad: comunidad,
    buscar: textoBuscado
  };

  llamarApi("publicaciones.php", datos, function (respuesta) {
    if (estePedido != numeroDePedido) {
      return; 
    }

    cajaFilas.innerHTML = "";

    if (respuesta.ok == false) {
      cajaFilas.innerHTML = '<p class="vacio">No se pudieron cargar las publicaciones.</p>';
      return;
    }

    var resultado = respuesta.publicaciones;
    if (resultado.length == 0) {
      cajaFilas.innerHTML = '<p class="vacio">No encontramos publicaciones.</p>';
    }
    for (var j = 0; j < resultado.length; j++) {
      cajaFilas.appendChild(crearFila(resultado[j], "", ""));
    }
  });


  if (comunidad != "") {
    botonFiltro.textContent = "Comunidad: " + comunidad + " (quitar filtro)";
    botonFiltro.hidden = false;
  } else {
    botonFiltro.hidden = true;
  }
}


function filtrarPagina(texto) {
  textoBuscado = texto;
  mostrarPublicaciones();
}

//  Pestañas 
var pestanias = document.querySelectorAll(".pestania");
for (var i = 0; i < pestanias.length; i++) {
  pestanias[i].addEventListener("click", function () {
    orden = this.getAttribute("data-orden");
    for (var j = 0; j < pestanias.length; j++) {
      pestanias[j].setAttribute("aria-selected", "false");
    }
    this.setAttribute("aria-selected", "true");
    mostrarPublicaciones();
  });
}

//  Comunidades 
var comunidades = document.querySelectorAll(".comunidad");
for (var k = 0; k < comunidades.length; k++) {
  comunidades[k].addEventListener("click", function (evento) {
    evento.preventDefault();
    comunidad = this.getAttribute("data-juego");
    mostrarPublicaciones();
    window.scrollTo(0, 0);
  });
}

botonFiltro.addEventListener("click", function () {
  comunidad = "";
  mostrarPublicaciones();
});

mostrarPublicaciones();
