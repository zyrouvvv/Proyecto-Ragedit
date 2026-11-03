

var entradaImagen = document.getElementById("imagen");
var vistaImagen = document.getElementById("vista-juego");
var idJuego = leerParametro("id");  
var camposConError = ["nombre", "categoria", "precio", "destacado", "fondo", "desarrollador", "lanzamiento", "plataformas", "descripcion", "imagen"];

// Vista previa de la imagen apenas se elige, y aviso si pesa mas de 2 MB
entradaImagen.addEventListener("change", function () {
  var archivo = this.files[0];
  if (archivo == undefined) {
    return;
  }

  if (archivo.size > 2 * 1024 * 1024) {
    alert("La imagen pesa mas de 2 MB. Elegi una mas liviana.");
    this.value = "";
    return;
  }

  vistaImagen.src = URL.createObjectURL(archivo);
  vistaImagen.hidden = false;
});

// Sugiere las categorias que ya existen 
function llenarSugerencias() {
  cargarProductos(function (lista) {
    var caja = document.getElementById("categorias-existentes");
    var vistas = [];
    for (var i = 0; i < lista.length; i++) {
      if (vistas.indexOf(lista[i].categoria) == -1) {
        vistas.push(lista[i].categoria);
        var opcion = document.createElement("option");
        opcion.value = lista[i].categoria;
        caja.appendChild(opcion);
      }
    }
  });
}

// Si es una edicion, le pedimos el juego al servidor y rellenamos el formulario
function cargarJuego() {
  llamarApi("productos.php", { accion: "ver", id: idJuego }, function (respuesta) {
    if (respuesta.ok == false) {
      alert(respuesta.error);
      window.location.href = "gestionar-videojuegos.html";
      return;
    }
    var juego = respuesta.producto;
    document.getElementById("nombre").value = juego.nombre;
    document.getElementById("categoria").value = juego.categoria;
    document.getElementById("precio").value = juego.precio.toFixed(2);
    document.getElementById("destacado").value = juego.destacado;
    document.getElementById("desarrollador").value = juego.desarrollador;
    document.getElementById("lanzamiento").value = juego.lanzamiento;
    document.getElementById("plataformas").value = juego.plataformas;
    document.getElementById("descripcion").value = juego.descripcion;
    if (/^#[0-9a-fA-F]{6}$/.test(juego.fondo)) {
      document.getElementById("fondo").value = juego.fondo;
    }
    if (juego.imagen != "") {
      vistaImagen.src = urlImagenJuego(juego.imagen);
      vistaImagen.hidden = false;
      document.getElementById("caja-quitar-imagen").hidden = false;
    }
  });
}

document.getElementById("formulario-juego").addEventListener("submit", function (evento) {
  evento.preventDefault();

  var datos = new FormData();
  datos.append("accion", "guardar");
  datos.append("csrf", CODIGO_CSRF);
  if (idJuego != "") {
    datos.append("id", idJuego);
  }
  datos.append("nombre", document.getElementById("nombre").value.trim());
  datos.append("categoria", document.getElementById("categoria").value.trim());
  datos.append("precio", document.getElementById("precio").value.trim());
  datos.append("destacado", document.getElementById("destacado").value.trim());
  datos.append("fondo", document.getElementById("fondo").value);
  datos.append("desarrollador", document.getElementById("desarrollador").value.trim());
  datos.append("lanzamiento", document.getElementById("lanzamiento").value.trim());
  datos.append("plataformas", document.getElementById("plataformas").value.trim());
  datos.append("descripcion", document.getElementById("descripcion").value.trim());
  if (document.getElementById("quitar-imagen").checked) {
    datos.append("quitar_imagen", "1");
  }
  var archivo = entradaImagen.files[0];
  if (archivo != undefined) {
    datos.append("imagen", archivo);
  }

  llamarApi("productos.php", datos, function (respuesta) {
    if (respuesta.ok == false) {
      if (respuesta.errores) {
        for (var i = 0; i < camposConError.length; i++) {
          var campo = camposConError[i];
          ponerError("error-" + campo, respuesta.errores[campo] || "");
        }
        mostrarMensaje("mensaje", "Revisa los campos marcados.", "error");
      } else {
        mostrarMensaje("mensaje", respuesta.error, "error");
      }
      return;
    }

    // volvemos a la lista, que muestra el cartel de que salio bien
    window.location.href = "gestionar-videojuegos.html?ok=" + (idJuego == "" ? "creado" : "editado");
  });
});

function iniciarFormularioJuego() {
  if (exigirAdmin() == false) {
    return;
  }
  if (idJuego != "") {
    document.getElementById("titulo-pagina").textContent = "EDITAR VIDEOJUEGO";
    document.getElementById("boton-guardar").textContent = "GUARDAR";
    document.title = "Editar videojuego | Ragedit";
    cargarJuego();
  }
  llenarSugerencias();
}

alCargarSesion(iniciarFormularioJuego);
