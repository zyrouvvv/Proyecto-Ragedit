
var imagenNueva = ""; // solo se llena si el usuario elige otra imagen (si no, el servidor deja la que estaba)

function iniciarEditar() {
  if (exigirLogin() == false) {
    return;
  }

  // primero llenamos el desplegable de juegos (sale de la base de datos) y despues rellenamos el formulario
  llenarJuegos("juego", cargarPublicacion);
}

function cargarPublicacion() {
  var id = leerParametro("id");

  // le pedimos al servidor los datos actuales (si no es tu publicacion, contesta con error)
  llamarApi("publicaciones.php", { accion: "para_editar", id: id }, function (respuesta) {
    if (respuesta.ok == false) {
      mostrarMensaje("mensaje", respuesta.error, "error");
      document.getElementById("boton-guardar").disabled = true;
      return;
    }

    var publicacion = respuesta.publicacion;

    // rellenamos el formulario con los datos actuales
    document.getElementById("titulo").value = publicacion.titulo;
    document.getElementById("subtitulo").value = publicacion.subtitulo;
    document.getElementById("contenido").value = publicacion.texto;
    document.getElementById("juego").value = publicacion.juego;

    if (publicacion.imagen) {
      var vista = document.getElementById("imagen-vista");
      vista.src = urlImagenPublicacion(publicacion.imagen);
      vista.hidden = false;
    }

    // si elige otra imagen
    document.getElementById("imagen-archivo").addEventListener("change", function () {
      var archivo = this.files[0];
      if (archivo == undefined) {
        return;
      }
      leerImagen(archivo, function (datos) {
        if (datos == "") {
          mostrarMensaje("mensaje", "No se pudo leer esa imagen.", "error");
          return;
        }
        imagenNueva = datos;
        var vista = document.getElementById("imagen-vista");
        vista.src = datos;
        vista.hidden = false;
      });
    });

    document.getElementById("formulario-publicacion").addEventListener("submit", function (evento) {
      evento.preventDefault();

      var titulo = document.getElementById("titulo").value.trim();
      var juego = document.getElementById("juego").value;

      if (titulo == "") {
        mostrarMensaje("mensaje", "Escribi un titulo.", "error");
        return;
      }
      if (juego == "") {
        mostrarMensaje("mensaje", "Selecciona un juego.", "error");
        return;
      }

      var datos = {
        accion: "editar",
        id: publicacion.id,
        titulo: titulo,
        subtitulo: document.getElementById("subtitulo").value.trim(),
        texto: document.getElementById("contenido").value.trim(),
        juego: juego,
        imagen: imagenNueva
      };

      llamarApi("publicaciones.php", datos, function (respuesta) {
        if (respuesta.ok == false) {
          mostrarMensaje("mensaje", respuesta.error, "error");
          return;
        }

        mostrarMensaje("mensaje", "Publicacion actualizada.", "bien");
        setTimeout(function () {
          window.location.href = "publicacion.html?id=" + publicacion.id;
        }, 500);
      });
    });
  });
}

alCargarSesion(iniciarEditar);
