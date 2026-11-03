

var nombrePerfil = "";
var idPerfil = 0;     // id del usuario cuyo perfil se esta viendo (para reportarlo)

function mostrarComentarios() {
  var lista = document.getElementById("comentarios-perfil");

  llamarApi("comentarios.php", { accion: "listar", perfil: nombrePerfil }, function (respuesta) {
    lista.innerHTML = "";

    if (respuesta.ok == false) {
      lista.innerHTML = '<li class="com-texto">No se pudieron cargar los comentarios.</li>';
      return;
    }

    for (var i = 0; i < respuesta.comentarios.length; i++) {
      lista.appendChild(crearComentario(respuesta.comentarios[i], false));
    }

    if (respuesta.comentarios.length == 0) {
      lista.innerHTML = '<li class="com-texto">Sin comentarios todavia.</li>';
    }
  });
}

// El servidor junta las publicaciones propias y los reposteos (las mas nuevas primero)
function mostrarPublicacionesDelPerfil() {
  var caja = document.getElementById("filas-perfil");

  llamarApi("publicaciones.php", { accion: "de_usuario", nombre: nombrePerfil }, function (respuesta) {
    caja.innerHTML = "";

    if (respuesta.ok == false) {
      caja.innerHTML = '<p class="vacio">No se pudieron cargar las publicaciones.</p>';
      return;
    }

    var elementos = respuesta.elementos;
    if (elementos.length == 0) {
      caja.innerHTML = '<p class="vacio">Todavia no hay publicaciones.</p>';
    }
    for (var k = 0; k < elementos.length; k++) {
      caja.appendChild(crearFila(elementos[k].publicacion, nombrePerfil, elementos[k].accion));
    }
  });
}

function iniciarPerfil() {
  // si la url tiene ?u=nombre mostramos ese usuario, si no, el que inicio sesion
  var pedido = leerParametro("u");

  if (pedido == "" && exigirLogin() == false) {
    return;
  }

  llamarApi("usuarios.php", { accion: "perfil", nombre: pedido }, function (respuesta) {
    if (respuesta.ok == false) {
      document.getElementById("cabecera-perfil").innerHTML = '<p class="vacio">No existe ese usuario.</p>';
      return;
    }

    var usuario = respuesta.usuario;
    nombrePerfil = usuario.nombre;
    idPerfil = usuario.id;
    document.title = usuario.nombre + " | Ragedit";

    // foto de perfil (si no tiene, se muestra la inicial del nombre)
    var avatar = document.getElementById("perfil-avatar");
    if (usuario.foto != "") {
      avatar.textContent = "";
      var foto = document.createElement("img");
      foto.src = urlFotoPerfil(usuario.foto);
      foto.alt = "";
      avatar.appendChild(foto);
    } else {
      avatar.textContent = usuario.nombre.charAt(0);
    }

    document.getElementById("perfil-nombre").textContent = usuario.nombre;
    if (usuario.bio == "") {
      document.getElementById("perfil-bio").textContent = "Este usuario todavia no escribio una descripcion.";
    } else {
      document.getElementById("perfil-bio").textContent = usuario.bio;
    }

    var union = "Se unio el " + usuario.union;
    if (usuario.estado != "") {
      union = union + " · Estado: " + usuario.estado;
    }
    document.getElementById("perfil-union").textContent = union;

    // el boton de editar solo aparece en tu propio perfil
    document.getElementById("perfil-editar").hidden = (usuario.esMio == false);
    // el de reportar, solo en el perfil de otra persona
    document.getElementById("perfil-reportar").hidden = usuario.esMio;

    mostrarPublicacionesDelPerfil();
    mostrarComentarios();
  });
}

document.getElementById("perfil-reportar").addEventListener("click", function () {
  if (idPerfil != 0) {
    abrirReporte("usuario", idPerfil, nombrePerfil);
  }
});

// ----- Formulario para comentar en el perfil -----
document.getElementById("formulario-comentario-perfil").addEventListener("submit", function (evento) {
  evento.preventDefault();
  if (exigirLogin() == false) {
    return;
  }

  var caja = document.getElementById("texto-comentario-perfil");
  var texto = caja.value.trim();
  if (texto == "") {
    return;
  }

  llamarApi("comentarios.php", { accion: "crear", perfil: nombrePerfil, texto: texto }, function (respuesta) {
    if (respuesta.ok == false) {
      alert(respuesta.error);
      return;
    }
    caja.value = "";
    mostrarComentarios();
  });
});

alCargarSesion(iniciarPerfil);
