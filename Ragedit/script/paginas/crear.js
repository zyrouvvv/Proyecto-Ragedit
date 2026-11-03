

var imagenElegida = ""; 

function iniciarCrear() {
  if (exigirLogin() == false) {
    return;
  }

  // los juegos del desplegable salen de la base de datos 
  llenarJuegos("juego", function () {});

  // cuando elige una imagen la leemos y mostramos la vista previa
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
      imagenElegida = datos;
      var vista = document.getElementById("imagen-vista");
      vista.src = datos;
      vista.hidden = false;
    });
  });

  document.getElementById("formulario-publicacion").addEventListener("submit", function (evento) {
    evento.preventDefault();

    var titulo = document.getElementById("titulo").value.trim();
    var subtitulo = document.getElementById("subtitulo").value.trim();
    var texto = document.getElementById("contenido").value.trim();
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
      accion: "crear",
      titulo: titulo,
      subtitulo: subtitulo,
      texto: texto,
      juego: juego,
      imagen: imagenElegida
    };

    llamarApi("publicaciones.php", datos, function (respuesta) {
      if (respuesta.ok == false) {
        mostrarMensaje("mensaje", respuesta.error, "error");
        return;
      }

      mostrarMensaje("mensaje", "Publicacion creada.", "bien");
      setTimeout(function () {
        window.location.href = "publicacion.html?id=" + respuesta.id;
      }, 500);
    });
  });
}

alCargarSesion(iniciarCrear);
