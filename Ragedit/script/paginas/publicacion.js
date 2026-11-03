

var publicacion = null;    
var miVoto = null;          
var yaReposteoLaPublicacion = false;

// Actualiza los numeros y marca con borde el boton que esta apretado
function mostrarVotos() {
  document.getElementById("cantidad-me-gusta").textContent = formatearNumero(publicacion.meGusta);
  document.getElementById("cantidad-no-me-gusta").textContent = formatearNumero(publicacion.noMeGusta);

  document.getElementById("voto-arriba").setAttribute("aria-pressed", String(miVoto == "arriba"));
  document.getElementById("voto-abajo").setAttribute("aria-pressed", String(miVoto == "abajo"));
  document.getElementById("voto-repost").setAttribute("aria-pressed", String(yaReposteoLaPublicacion));
}

// El servidor se encarga de sacar el voto anterior, poner el nuevo y actualizar los contadores
function votar(tipo) {
  if (exigirLogin() == false) {
    return;
  }

  llamarApi("publicaciones.php", { accion: "votar", id: publicacion.id, tipo: tipo }, function (respuesta) {
    if (respuesta.ok == false) {
      alert(respuesta.error);
      return;
    }
    publicacion.meGusta = respuesta.meGusta;
    publicacion.noMeGusta = respuesta.noMeGusta;
    miVoto = respuesta.miVoto;
    mostrarVotos();
  });
}

function repostear() {
  if (exigirLogin() == false) {
    return;
  }

  llamarApi("publicaciones.php", { accion: "repostear", id: publicacion.id }, function (respuesta) {
    if (respuesta.ok == false) {
      alert(respuesta.error);
      return;
    }
    yaReposteoLaPublicacion = respuesta.yaReposteo;
    mostrarVotos();
  });
}

//  Comentarios 
function mostrarComentarios() {
  var lista = document.getElementById("lista-comentarios");

  llamarApi("comentarios.php", { accion: "listar", publicacion: publicacion.id }, function (respuesta) {
    if (respuesta.ok == false) {
      return;
    }

    lista.innerHTML = "";
    for (var i = 0; i < respuesta.comentarios.length; i++) {
      lista.appendChild(crearComentario(respuesta.comentarios[i], true));
    }

    // si no hay comentarios ocultamos la caja
    document.getElementById("caja-comentarios").hidden = (respuesta.comentarios.length == 0);
  });
}

// Al cargar la pagina 
function iniciarPublicacion() {
  // el servidor tambien suma una visita (una sola vez por sesion)
  llamarApi("publicaciones.php", { accion: "ver", id: leerParametro("id") }, function (respuesta) {
    if (respuesta.ok == false) {
      document.getElementById("publicacion").innerHTML = '<p class="vacio">La publicacion no existe o fue eliminada.</p>';
      return;
    }

    publicacion = respuesta.publicacion;
    miVoto = respuesta.miVoto;
    yaReposteoLaPublicacion = respuesta.yaReposteo;

    document.title = publicacion.titulo + " | Ragedit";
    document.getElementById("publi-titulo").textContent = publicacion.titulo;
    document.getElementById("publi-tiempo").textContent = haceCuanto(publicacion.fecha);
    document.getElementById("publi-texto").textContent = publicacion.texto;

    var subtitulo = document.getElementById("publi-subtitulo");
    subtitulo.textContent = publicacion.subtitulo;
    subtitulo.hidden = (publicacion.subtitulo == "");

    var autor = document.getElementById("publi-autor");
    autor.textContent = "Por ";
    var enlace = document.createElement("a");
    enlace.href = "perfil.html?u=" + encodeURIComponent(publicacion.autor);
    enlace.textContent = publicacion.autor;
    autor.appendChild(enlace);
    autor.appendChild(document.createTextNode(" en " + publicacion.juego));

    if (publicacion.imagen) {
      var imagen = document.getElementById("publi-imagen");
      imagen.src = urlImagenPublicacion(publicacion.imagen);
      imagen.hidden = false;
    }

    mostrarVotos();
    mostrarComentarios();

    alCargarSesion(function () {
      var yo = usuarioActual();
      document.getElementById("boton-reportar-publicacion").hidden = (yo != null && yo.nombre == publicacion.autor);
    });
  });
}

document.getElementById("boton-reportar-publicacion").addEventListener("click", function () {
  if (publicacion != null) {
    abrirReporte("publicacion", publicacion.id, publicacion.titulo);
  }
});

document.getElementById("voto-arriba").addEventListener("click", function () {
  if (publicacion != null) {
    votar("arriba");
  }
});
document.getElementById("voto-abajo").addEventListener("click", function () {
  if (publicacion != null) {
    votar("abajo");
  }
});
document.getElementById("voto-repost").addEventListener("click", function () {
  if (publicacion != null) {
    repostear();
  }
});

document.getElementById("formulario-comentario").addEventListener("submit", function (evento) {
  evento.preventDefault();
  if (publicacion == null || exigirLogin() == false) {
    return;
  }

  var caja = document.getElementById("texto-comentario");
  var texto = caja.value.trim();
  if (texto == "") {
    return;
  }

  llamarApi("comentarios.php", { accion: "crear", publicacion: publicacion.id, texto: texto }, function (respuesta) {
    if (respuesta.ok == false) {
      alert(respuesta.error);
      return;
    }
    caja.value = "";
    mostrarComentarios();
  });
});

iniciarPublicacion();
