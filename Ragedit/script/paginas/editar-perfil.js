

var camposConError = ["foto", "usuario", "correo", "estado", "bio"];

function rellenarFormulario() {
  if (exigirLogin() == false) {
    return;
  }

  // sin "nombre" el servidor devuelve el perfil del usuario que inicio sesion
  llamarApi("usuarios.php", { accion: "perfil" }, function (respuesta) {
    if (respuesta.ok == false) {
      mostrarMensaje("mensaje", respuesta.error, "error");
      return;
    }
    var usuario = respuesta.usuario;
    document.getElementById("usuario").value = usuario.nombre;
    document.getElementById("correo").value = usuario.correo;
    document.getElementById("estado").value = usuario.estado;
    document.getElementById("bio").value = usuario.bio;
  });
}

document.getElementById("formulario-perfil").addEventListener("submit", function (evento) {
  evento.preventDefault();

  var nombre = document.getElementById("usuario").value.trim();
  if (nombre.length < 1 || nombre.length > 25 || nombre.indexOf(" ") != -1) {
    ponerError("error-usuario", "Usa entre 1 y 25 caracteres, sin espacios.");
    mostrarMensaje("mensaje", "Revisa los campos marcados.", "error");
    return;
  }

  var datos = new FormData();
  datos.append("accion", "guardar_perfil");
  datos.append("nombre", nombre);
  datos.append("correo", document.getElementById("correo").value.trim());
  datos.append("estado", document.getElementById("estado").value);
  datos.append("bio", document.getElementById("bio").value.trim());

  var archivo = document.getElementById("foto").files[0];
  if (archivo != undefined) {
    datos.append("foto", archivo);
  }

  llamarApi("usuarios.php", datos, function (respuesta) {
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

    mostrarMensaje("mensaje", "Perfil actualizado. Redirigiendo...", "bien");
    setTimeout(function () {
      window.location.href = "perfil.html";
    }, 600);
  });
});

alCargarSesion(rellenarFormulario);
