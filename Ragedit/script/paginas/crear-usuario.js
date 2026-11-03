

var camposConError = ["usuario", "correo", "genero", "clave", "clave2", "estado", "rol"];

document.getElementById("formulario-usuario").addEventListener("submit", function (evento) {
  evento.preventDefault();

  var datos = {
    accion: "admin_crear",
    csrf: CODIGO_CSRF,
    usuario: document.getElementById("usuario").value.trim(),
    correo: document.getElementById("correo").value.trim(),
    genero: document.getElementById("genero").value,
    clave: document.getElementById("clave").value,
    clave2: document.getElementById("clave2").value,
    estado: document.getElementById("estado").value,
    rol: document.getElementById("rol").value
  };

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


    window.location.href = "panel.html?ok=creado";
  });
});

alCargarSesion(exigirAdmin);
