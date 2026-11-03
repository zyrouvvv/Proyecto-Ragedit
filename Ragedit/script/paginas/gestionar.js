
var iconoBorrar = '<span class="icono icono-delete" aria-hidden="true"></span>';
var iconoEditar = '<span class="icono icono-editar" aria-hidden="true"></span>';

var cajaTarjetas = document.getElementById("grilla-gestion");


function dibujarMisPublicaciones(publicaciones) {
  cajaTarjetas.innerHTML = "";
  var cantidad = 0;

  for (var i = 0; i < publicaciones.length; i++) {
    var pub = publicaciones[i];
    cantidad++;

    // tarjeta
    var tarjeta = document.createElement("article");
    tarjeta.className = "tarjeta-gestion";

    var caja = document.createElement("div");
    caja.className = "tarjeta-gestion-imagen";
    if (pub.imagen) {
      var foto = document.createElement("img");
      foto.src = urlImagenPublicacion(pub.imagen);
      foto.alt = "";
      caja.appendChild(foto);
    }
    tarjeta.appendChild(caja);

    var titulo = document.createElement("h2");
    titulo.className = "tarjeta-gestion-titulo";
    titulo.textContent = pub.titulo;
    tarjeta.appendChild(titulo);

    var texto = document.createElement("p");
    texto.className = "tarjeta-gestion-texto";
    texto.textContent = pub.texto || pub.subtitulo;
    tarjeta.appendChild(texto);


    var botones = document.createElement("div");
    botones.className = "tarjeta-gestion-botones";
    botones.innerHTML =
      '<button type="button" class="cuadrado cuadrado-borrar boton-borrar" data-id="' + pub.id + '" aria-label="Eliminar">' + iconoBorrar + '</button>' +
      '<a class="cuadrado cuadrado-editar" href="editar-publicacion.html?id=' + pub.id + '" aria-label="Editar">' + iconoEditar + '</a>';
    tarjeta.appendChild(botones);

    cajaTarjetas.appendChild(tarjeta);
  }

  if (cantidad == 0) {
    cajaTarjetas.innerHTML = '<p class="vacio">Todavia no publicaste nada.</p>';
  }
}


function mostrarMisPublicaciones() {
  llamarApi("publicaciones.php", { accion: "mias" }, function (respuesta) {
    if (respuesta.ok == false) {
      cajaTarjetas.innerHTML = '<p class="vacio">No se pudieron cargar tus publicaciones.</p>';
      return;
    }
    dibujarMisPublicaciones(respuesta.publicaciones);
  });
}


function borrarPublicacion(id) {
  llamarApi("publicaciones.php", { accion: "eliminar", id: id }, function (respuesta) {
    if (respuesta.ok == false) {
      alert(respuesta.error);
    }
    mostrarMisPublicaciones();
  });
}

function iniciarGestionar() {
  if (exigirLogin() == false) {
    return;
  }


  cajaTarjetas.addEventListener("click", function (evento) {
    var boton = evento.target.closest(".boton-borrar");
    if (boton == null) {
      return;
    }
    if (confirm("¿Seguro que queres eliminar esta publicacion?")) {
      borrarPublicacion(boton.getAttribute("data-id"));
    }
  });

  mostrarMisPublicaciones();
}

alCargarSesion(iniciarGestionar);
