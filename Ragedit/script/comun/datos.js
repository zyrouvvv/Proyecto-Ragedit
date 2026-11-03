

var CARPETA_API = "../api/";   // las paginas estan en /views, la api en /api
var CARPETA_IMAGENES = "../imagenes/";


function llamarApi(archivo, datos, cuandoTermina) {
  var opciones = { method: "POST", credentials: "same-origin" };

  if (datos instanceof FormData) {
    opciones.body = datos;
  } else {
    opciones.headers = { "Content-Type": "application/json" };
    opciones.body = JSON.stringify(datos);
  }

  fetch(CARPETA_API + archivo, opciones)
    .then(function (respuesta) {
      return respuesta.json();
    })
    .then(function (resultado) {
      cuandoTermina(resultado);
    }, function () {
      // si el servidor no contesta o contesta algo raro
      cuandoTermina({ ok: false, error: "No se pudo conectar con el servidor." });
    });
}

var productos = null;
var pidiendoProductos = false;
var esperandoProductos = [];

function cargarProductos(cuandoTermina) {
  if (productos != null) {
    cuandoTermina(productos);
    return;
  }
  esperandoProductos.push(cuandoTermina);
  if (pidiendoProductos == true) {
    return; // ya hay un pedido en camino: esta funcion se avisa cuando llegue
  }
  pidiendoProductos = true;

  llamarApi("productos.php", { accion: "listar" }, function (respuesta) {
    productos = (respuesta.ok == false) ? [] : respuesta.productos;
    var avisar = esperandoProductos;
    esperandoProductos = [];
    for (var i = 0; i < avisar.length; i++) {
      avisar[i](productos);
    }
  });
}

// ----- Juegos para el desplegable de crear y editar publicacion -----
// Los pide a la api (salen de la tabla "categoria") y llena el <select> que tenga ese id.
function llenarJuegos(idSelect, cuandoTermina) {
  llamarApi("publicaciones.php", { accion: "juegos" }, function (respuesta) {
    if (respuesta.ok != false) {
      var caja = document.getElementById(idSelect);
      for (var i = 0; i < respuesta.juegos.length; i++) {
        var opcion = document.createElement("option");
        opcion.value = respuesta.juegos[i];
        opcion.textContent = respuesta.juegos[i];
        caja.appendChild(opcion);
      }
    }
    cuandoTermina();
  });
}

// Las imagenes estan guardadas como archivos; en la base de datos solo esta el nombre.
// Estas dos funciones arman la direccion completa para poner en un <img src="...">
function urlImagenPublicacion(nombre) {
  return CARPETA_IMAGENES + "publicaciones/" + nombre;
}

function urlFotoPerfil(nombre) {
  return CARPETA_IMAGENES + "perfiles/" + nombre;
}

// Imagen de un videojuego (en la base de datos solo esta el nombre del archivo)
function urlImagenJuego(nombre) {
  return CARPETA_IMAGENES + "juegos/" + encodeURIComponent(nombre);
}
