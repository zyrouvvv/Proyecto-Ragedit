

var USUARIO_ACTUAL = null; 
var CODIGO_CSRF = "";   
var sesionCargada = false;
var esperandoSesion = [];


function alCargarSesion(funcion) {
  if (sesionCargada == true) {
    funcion();
  } else {
    esperandoSesion.push(funcion);
  }
}

llamarApi("usuarios.php", { accion: "sesion" }, function (respuesta) {
  if (respuesta.ok != false) {
    USUARIO_ACTUAL = respuesta.usuario;
    CODIGO_CSRF = respuesta.csrf;
  }
  sesionCargada = true;
  for (var i = 0; i < esperandoSesion.length; i++) {
    esperandoSesion[i]();
  }
  esperandoSesion = [];
});


function usuarioActual() {
  return USUARIO_ACTUAL;
}

function cerrarSesion() {
  llamarApi("usuarios.php", { accion: "salir" }, function () {
    window.location.href = "login.html";
  });
}

function exigirLogin() {
  if (usuarioActual() == null) {
    alert("Tenes que iniciar sesion primero");
    window.location.href = "login.html";
    return false;
  }
  return true;
}

function exigirAdmin() {
  if (exigirLogin() == false) {
    return false;
  }
  if (usuarioActual().rol != "admin") {
    alert("Solo los administradores pueden entrar a esta pagina.");
    window.location.href = "index.html";
    return false;
  }
  return true;
}
