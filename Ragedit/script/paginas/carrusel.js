

cargarProductos(function (productos) {

var pista = document.getElementById("pista-carrusel");
var puntos = document.getElementById("puntos-carrusel");
var destacados = [];
var posicion = 0;
var reloj = null;

// Nos quedamos solo con los productos destacados
for (var i = 0; i < productos.length; i++) {
  if (productos[i].destacado != "") {
    destacados.push(productos[i]);
  }
}

// Crea una diapositiva y un puntito por cada destacado
for (var j = 0; j < destacados.length; j++) {
  var p = destacados[j];

  var diapositiva = document.createElement("div");
  diapositiva.className = "carrusel-diapositiva";
  diapositiva.style.backgroundColor = p.fondo;

if (p.imagen != "") {
    diapositiva.style.backgroundImage = 'linear-gradient(to top, rgba(0,0,0,.72), rgba(0,0,0,.08) 70%), url("../img/' + p.imagen + '")';
    diapositiva.classList.add("carrusel-diapositiva-imagen");
  }
  diapositiva.innerHTML =
    '<span class="carrusel-etiqueta">' + escaparHtml(p.destacado) + '</span>' +
    '<h2 class="carrusel-nombre"><a href="producto.html?id=' + p.id + '">' + escaparHtml(p.nombre.toUpperCase()) + '</a></h2>' +
    '<p class="carrusel-precio">' + textoPrecio(p.precio) + '</p>' +
    '<button type="button" class="boton boton-verde boton-diapositiva boton-agregar" data-id="' + p.id + '">AGREGAR AL CARRITO</button>';
  pista.appendChild(diapositiva);

  var punto = document.createElement("button");
  punto.type = "button";
  punto.setAttribute("data-indice", j);
  punto.setAttribute("aria-label", "Ir a " + p.nombre);
  punto.setAttribute("aria-current", String(j == 0));
  puntos.appendChild(punto);
}

// Muestra la diapositiva numero "n"
function mostrarDiapositiva(n) {
  if (n < 0) {
    n = destacados.length - 1;
  }
  if (n >= destacados.length) {
    n = 0;
  }
  posicion = n;
  pista.style.transform = "translateX(-" + (posicion * 100) + "%)";

  var botones = puntos.querySelectorAll("button");
  for (var k = 0; k < botones.length; k++) {
    botones[k].setAttribute("aria-current", String(k == posicion));
  }
}

// Cambia sola cada 5 segundos
function arrancarReloj() {
  clearInterval(reloj);
  reloj = setInterval(function () {
    mostrarDiapositiva(posicion + 1);
  }, 5000);
}

document.getElementById("carrusel-anterior").addEventListener("click", function () {
  mostrarDiapositiva(posicion - 1);
  arrancarReloj();
});

document.getElementById("carrusel-siguiente").addEventListener("click", function () {
  mostrarDiapositiva(posicion + 1);
  arrancarReloj();
});

puntos.addEventListener("click", function (evento) {
  var indice = evento.target.getAttribute("data-indice");
  if (indice != null) {
    mostrarDiapositiva(Number(indice));
    arrancarReloj();
  }
});


pista.addEventListener("click", function (evento) {
  if (evento.target.classList.contains("boton-agregar")) {
    agregarAlCarrito(evento.target.getAttribute("data-id"));
  }
});

arrancarReloj();
});
