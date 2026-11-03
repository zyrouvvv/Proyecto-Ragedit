

function entrar() {
  mostrarMensaje("mensaje", "Sesion iniciada. Redirigiendo...", "bien");
  setTimeout(function () {
    window.location.href = "foros.html";
  }, 500);
}

document.getElementById("formulario-login").addEventListener("submit", function (evento) {
  evento.preventDefault();

  var dato = document.getElementById("identidad").value.trim();
  var clave = document.getElementById("clave").value;

  if (dato == "" || clave == "") {
    mostrarMensaje("mensaje", "Completa el usuario (o correo) y la contraseña.", "error");
    return;
  }

  // el servidor busca por nombre de usuario o por correo y compara la contraseña
  llamarApi("usuarios.php", { accion: "entrar", dato: dato, clave: clave }, function (respuesta) {
    if (respuesta.ok == false) {
      mostrarMensaje("mensaje", respuesta.error, "error");
      return;
    }
    entrar();
  });
});



var botonesRapidos = document.querySelectorAll(".rapido");
for (var i = 0; i < botonesRapidos.length; i++) {
  botonesRapidos[i].addEventListener("click", function () {
    var servicio = this.getAttribute("data-servicio");

    llamarApi("usuarios.php", { accion: "entrar_rapido", servicio: servicio }, function (respuesta) {
      if (respuesta.ok == false) {
        mostrarMensaje("mensaje", respuesta.error, "error");
        return;
      }
      entrar();
    });
  });
}

// Link de "recuperala"
document.getElementById("enlace-recuperar").addEventListener("click", function (evento) {
  evento.preventDefault();
  mostrarMensaje("mensaje", "Te enviamos las instrucciones a tu correo (simulado).", "bien");
});
