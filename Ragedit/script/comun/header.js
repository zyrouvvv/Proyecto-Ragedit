
function ponerContadorCarrito(total) {
  var contadores = document.querySelectorAll(".contador-carrito");
  for (var j = 0; j < contadores.length; j++) {
    if (total > 0) {
      contadores[j].textContent = total;
    } else {
      contadores[j].textContent = "";
    }
  }
}


function actualizarContadorCarrito() {
  llamarApi("carrito.php", { accion: "listar" }, function (respuesta) {
    if (respuesta.ok == false) {
      return;
    }
    var total = 0;
    for (var i = 0; i < respuesta.carrito.length; i++) {
      total = total + respuesta.carrito[i].cantidad;
    }
    ponerContadorCarrito(total);
  });
}


function armarMenuUsuario() {
  var usuario = usuarioActual();
  var lista = document.getElementById("menu-usuario");
  lista.innerHTML = "";

  if (usuario != null) {
    var avatar = document.getElementById("avatar");
    if (usuario.foto != "") {
      avatar.textContent = "";
      var foto = document.createElement("img");
      foto.src = urlFotoPerfil(usuario.foto);
      foto.alt = "";
      avatar.appendChild(foto);
    } else {
      avatar.textContent = usuario.nombre.charAt(0);
    }

    lista.innerHTML += '<li><a href="perfil.html">Mi perfil</a></li>';
    lista.innerHTML += '<li><a href="crear-publicacion.html">Nueva publicacion</a></li>';
    lista.innerHTML += '<li><a href="gestionar-publicaciones.html">Gestionar publicaciones</a></li>';
    lista.innerHTML += '<li><a href="carrito.html"><span>Carrito</span><span class="globito contador-carrito"></span></a></li>';
    if (usuario.rol == "admin") {
      lista.innerHTML += '<li><a href="panel.html">Panel de administracion</a></li>';
      lista.innerHTML += '<li><a href="gestionar-videojuegos.html">Gestionar videojuegos</a></li>';
      lista.innerHTML += '<li><a href="reportes.html">Reportes</a></li>';
    }
    lista.innerHTML += '<li><button type="button" id="boton-cerrar-sesion">Cerrar sesion</button></li>';
    document.getElementById("boton-cerrar-sesion").addEventListener("click", cerrarSesion);
  } else {
    lista.innerHTML += '<li><a href="login.html">Iniciar sesion</a></li>';
    lista.innerHTML += '<li><a href="registro.html">Registrarse</a></li>';
    lista.innerHTML += '<li><a href="carrito.html"><span>Carrito</span><span class="globito contador-carrito"></span></a></li>';
  }
}

var menus = document.querySelectorAll(".menu");

function cerrarMenus() {
  for (var i = 0; i < menus.length; i++) {
    menus[i].classList.remove("abierto");
  }
}

function abrirOCerrarMenu(evento) {
  evento.stopPropagation(); 
  var menu = this.parentElement; 
  var estabaAbierto = menu.classList.contains("abierto");
  cerrarMenus();
  if (estabaAbierto == false) {
    menu.classList.add("abierto");
  }
}

for (var m = 0; m < menus.length; m++) {
  menus[m].querySelector(".menu-boton").addEventListener("click", abrirOCerrarMenu);
}
document.addEventListener("click", cerrarMenus);

//  Buscador 

function buscar(texto) {
  var seguir = function () {
    if (typeof filtrarPagina == "function") {
      filtrarPagina(texto);
    } else {
      window.location.href = "foros.html?q=" + encodeURIComponent(texto);
    }
  };

  if (texto != "" && usuarioActual() != null) {
    llamarApi("publicaciones.php", { accion: "registrar_busqueda", texto: texto }, seguir);
  } else {
    seguir();
  }
}

var cajaBuscador = document.getElementById("buscador");
cajaBuscador.value = leerParametro("q");

document.getElementById("formulario-buscador").addEventListener("submit", function (evento) {
  evento.preventDefault();
  buscar(cajaBuscador.value.trim());
});

cajaBuscador.addEventListener("input", function () {
  if (typeof filtrarPagina == "function") {
    filtrarPagina(cajaBuscador.value.trim());
  }
});


var listaPopulares = document.createElement("ul");
listaPopulares.className = "busquedas-populares";
listaPopulares.hidden = true;
document.getElementById("formulario-buscador").appendChild(listaPopulares);

function mostrarPopulares() {
  if (cajaBuscador.value.trim() != "") {
    listaPopulares.hidden = true;
    return;
  }
  llamarApi("publicaciones.php", { accion: "populares" }, function (respuesta) {
    if (respuesta.ok == false || respuesta.busquedas.length == 0) {
      return;
    }
    listaPopulares.innerHTML = '<li class="busquedas-titulo">Busquedas populares</li>';
    for (var i = 0; i < respuesta.busquedas.length; i++) {
      var item = document.createElement("li");
      var boton = document.createElement("button");
      boton.type = "button";
      boton.textContent = respuesta.busquedas[i];
      item.appendChild(boton);
      listaPopulares.appendChild(item);
    }
    listaPopulares.hidden = false;
  });
}

cajaBuscador.addEventListener("focus", mostrarPopulares);
cajaBuscador.addEventListener("click", mostrarPopulares);
cajaBuscador.addEventListener("input", function () {
  if (cajaBuscador.value.trim() != "") {
    listaPopulares.hidden = true;
  }
});
cajaBuscador.addEventListener("keydown", function (evento) {
  if (evento.key == "Escape") {
    listaPopulares.hidden = true;
  }
});

listaPopulares.addEventListener("mousedown", function (evento) {
  var boton = evento.target.closest("button");
  if (boton == null) {
    return;
  }
  evento.preventDefault();
  cajaBuscador.value = boton.textContent;
  listaPopulares.hidden = true;
  buscar(boton.textContent);
});

document.addEventListener("click", function (evento) {
  if (evento.target != cajaBuscador) {
    listaPopulares.hidden = true;
  }
});

alCargarSesion(armarMenuUsuario);
actualizarContadorCarrito();
