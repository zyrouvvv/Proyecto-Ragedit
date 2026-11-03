// producto.js
// Pagina de informacion de un videojuego: sus datos, las valoraciones y las reseñas de la gente.
// Los datos del juego vienen de api/productos.php y las reseñas de api/resenas.php

var idProducto = leerParametro("id");
var producto = null;            // el juego que se esta mostrando
var filtroActual = "todas";     // todas | positivas | negativas | recientes
var resenasDibujadas = 0;       // cuantas reseñas hay en pantalla (para pedir las que siguen)
var estrellasElegidas = 0;      // las estrellas que marco el usuario en el formulario
var miResena = null;            // la reseña que el usuario ya escribio de este juego (o null)
var numeroDePedido = 0;         // para ignorar respuestas viejas si se cambia de pestaña rapido

var listaResenas = document.getElementById("lista-resenas");
var botonMas = document.getElementById("boton-mas-resenas");
var formulario = document.getElementById("formulario-resena");
var cajaTexto = document.getElementById("texto-resena");
var selector = document.getElementById("selector-estrellas");

// Cartelito que aparece un ratito abajo
function mostrarAviso(texto) {
  var aviso = document.getElementById("aviso");
  aviso.textContent = texto;
  aviso.hidden = false;
  setTimeout(function () {
    aviso.hidden = true;
  }, 1800);
}

// "4.2 / 5 · 1.248 reseñas" (o "Todavia sin reseñas" si nadie escribio una)
function mostrarPuntaje(resumen) {
  var caja = document.getElementById("producto-puntaje");
  caja.innerHTML = "";
  if (resumen.total == 0) {
    caja.textContent = "Todavía sin reseñas";
    return;
  }
  caja.appendChild(crearEstrellas(resumen.promedio));
  var texto = document.createElement("span");
  texto.textContent = resumen.promedio + " / 5  ·  " + resumen.total.toLocaleString("es-AR") + (resumen.total == 1 ? " reseña" : " reseñas");
  caja.appendChild(texto);
}

// ----- Datos del juego -----
function dibujarProducto() {
  document.title = producto.nombre + " | Ragedit";
  document.getElementById("producto-titulo-barra").textContent = producto.nombre.toUpperCase();
  document.getElementById("producto-nombre").textContent = producto.nombre;
  document.getElementById("producto-precio").textContent = textoPrecio(producto.precio);

  // la portada: la imagen del juego o, si no tiene, su color de fondo con el nombre
  var portada = document.getElementById("producto-portada");
  document.getElementById("producto-portada-texto").textContent = producto.nombre.toUpperCase();
  portada.style.backgroundColor = producto.fondo;
  if (producto.imagen != "") {
    portada.style.backgroundImage = 'url("../img/' + producto.imagen + '")';
    portada.classList.add("tarjeta-portada-imagen");
  }

  var datos = {
    "producto-genero": producto.categoria,
    "producto-desarrollador": producto.desarrollador,
    "producto-lanzamiento": producto.lanzamiento,
    "producto-plataformas": producto.plataformas
  };
  for (var id in datos) {
    document.getElementById(id).textContent = datos[id] != "" ? datos[id] : "-";
  }

  var descripcion = document.getElementById("producto-descripcion");
  if (producto.descripcion != "") {
    descripcion.textContent = producto.descripcion;
  } else {
    descripcion.textContent = "Este juego todavía no tiene descripción.";
  }

  mostrarPuntaje({ promedio: producto.promedio, total: producto.totalResenas });
}

// ----- Valoraciones (el numero grande y las barras) -----
function dibujarValoraciones(resumen) {
  document.getElementById("valoracion-numero").textContent = resumen.total > 0 ? resumen.promedio.toFixed(1) : "0";

  var estrellas = document.getElementById("valoracion-estrellas");
  estrellas.innerHTML = "";
  estrellas.appendChild(crearEstrellas(resumen.promedio));

  var total = document.getElementById("valoracion-total");
  if (resumen.total == 0) {
    total.textContent = "Todavía sin reseñas";
  } else {
    total.textContent = resumen.total.toLocaleString("es-AR") + (resumen.total == 1 ? " reseña" : " reseñas");
  }

  var barras = document.getElementById("valoracion-barras");
  barras.innerHTML = "";
  for (var n = 5; n >= 1; n--) {
    var cantidad = resumen.porEstrellas[n];
    var porcentaje = resumen.total > 0 ? (cantidad * 100) / resumen.total : 0;

    var fila = document.createElement("div");
    fila.className = "barra-fila";
    fila.innerHTML =
      '<span class="barra-etiqueta">' + n + " ★</span>" +
      '<div class="barra"><div class="barra-relleno"></div></div>' +
      '<span class="barra-cantidad">' + cantidad.toLocaleString("es-AR") + "</span>";
    fila.querySelector(".barra-relleno").style.width = porcentaje + "%";
    fila.title = n + (n == 1 ? " estrella: " : " estrellas: ") + cantidad + (cantidad == 1 ? " reseña" : " reseñas");
    barras.appendChild(fila);
  }

  mostrarPuntaje(resumen);
}

// ----- Reseñas -----
// Crea la tarjeta de una reseña
function crearResena(resena) {
  var tarjeta = document.createElement("article");
  tarjeta.className = "resena";
  if (resena.esMia) {
    tarjeta.classList.add("resena-propia");
  }

  var avatar = document.createElement("span");
  avatar.className = "resena-avatar";
  if (resena.foto != "") {
    var foto = document.createElement("img");
    foto.src = urlFotoPerfil(resena.foto);
    foto.alt = "";
    avatar.appendChild(foto);
  } else {
    avatar.textContent = resena.autor.charAt(0);
  }
  tarjeta.appendChild(avatar);

  var contenido = document.createElement("div");
  contenido.className = "resena-contenido";

  var cabecera = document.createElement("div");
  cabecera.className = "resena-cabecera";

  var autor = document.createElement("a");
  autor.className = "resena-autor";
  autor.href = "perfil.html?u=" + encodeURIComponent(resena.autor);
  autor.textContent = resena.autor;
  cabecera.appendChild(autor);

  cabecera.appendChild(crearEstrellas(resena.estrellas));

  var hora = document.createElement("span");
  hora.className = "com-hora";
  hora.textContent = haceCuanto(resena.fecha);
  cabecera.appendChild(hora);

  if (resena.esMia) {
    var etiqueta = document.createElement("span");
    etiqueta.className = "resena-etiqueta";
    etiqueta.textContent = "TU RESEÑA";
    cabecera.appendChild(etiqueta);
  }
  contenido.appendChild(cabecera);

  var texto = document.createElement("p");
  texto.className = "resena-texto-publicado";
  texto.textContent = resena.texto;
  contenido.appendChild(texto);

  var acciones = document.createElement("div");
  acciones.className = "resena-acciones";
  acciones.innerHTML =
    '<button type="button" class="resena-voto" data-id="' + resena.id + '" data-tipo="util" aria-pressed="' + (resena.miVoto == "util") + '">ÚTIL (<span>' + resena.utiles + '</span>)</button>' +
    '<button type="button" class="resena-voto" data-id="' + resena.id + '" data-tipo="noutil" aria-pressed="' + (resena.miVoto == "noutil") + '">NO ÚTIL (<span>' + resena.noUtiles + '</span>)</button>';

  // nadie vota su propia reseña
  if (resena.esMia) {
    var botones = acciones.querySelectorAll(".resena-voto");
    for (var i = 0; i < botones.length; i++) {
      botones[i].disabled = true;
    }
  }

  // la puede borrar su autor o un administrador
  var yo = usuarioActual();
  if (resena.esMia || (yo != null && yo.rol == "admin")) {
    var borrar = document.createElement("button");
    borrar.type = "button";
    borrar.className = "resena-eliminar";
    borrar.setAttribute("data-id", resena.id);
    borrar.textContent = "ELIMINAR";
    acciones.appendChild(borrar);
  }

  contenido.appendChild(acciones);
  tarjeta.appendChild(contenido);
  return tarjeta;
}

// Le pide las reseñas al servidor. Si "desdeCero" es true empieza de nuevo la lista; si no, agrega las que siguen.
// Si "actualizarFormulario" es true, tambien rellena el formulario con la reseña que ya escribio el usuario.
function cargarResenas(desdeCero, actualizarFormulario) {
  numeroDePedido++;
  var estePedido = numeroDePedido;
  var desde = desdeCero ? 0 : resenasDibujadas;

  llamarApi("resenas.php", { accion: "listar", producto: producto.id, filtro: filtroActual, desde: desde }, function (respuesta) {
    if (estePedido != numeroDePedido) {
      return; // llego una respuesta vieja, la ignoramos
    }
    if (respuesta.ok == false) {
      listaResenas.innerHTML = '<p class="vacio">No se pudieron cargar las reseñas.</p>';
      botonMas.hidden = true;
      return;
    }

    if (desdeCero) {
      listaResenas.innerHTML = "";
      resenasDibujadas = 0;
    }
    for (var i = 0; i < respuesta.resenas.length; i++) {
      listaResenas.appendChild(crearResena(respuesta.resenas[i]));
    }
    resenasDibujadas = resenasDibujadas + respuesta.resenas.length;
    botonMas.hidden = (respuesta.hayMas == false);

    if (resenasDibujadas == 0) {
      if (filtroActual == "todas") {
        listaResenas.innerHTML = '<p class="vacio">Todavía nadie escribió una reseña. ¡Sé el primero!</p>';
      } else {
        listaResenas.innerHTML = '<p class="vacio">No hay reseñas para mostrar en esta pestaña.</p>';
      }
    }

    dibujarValoraciones(respuesta.resumen);
    miResena = respuesta.miResena;
    if (actualizarFormulario) {
      prepararFormulario();
    }
  });
}

// ----- Formulario "Escribi tu reseña" -----
// Pinta las estrellas del selector hasta "cantidad"
function pintarSelector(cantidad) {
  var botones = selector.querySelectorAll(".estrella-boton");
  for (var i = 0; i < botones.length; i++) {
    var valor = Number(botones[i].getAttribute("data-valor"));
    botones[i].classList.toggle("activa", valor <= cantidad);
    botones[i].setAttribute("aria-pressed", String(valor == estrellasElegidas));
  }
}

function crearSelector() {
  for (var n = 1; n <= 5; n++) {
    var boton = document.createElement("button");
    boton.type = "button";
    boton.className = "estrella-boton";
    boton.textContent = "★";
    boton.setAttribute("data-valor", n);
    boton.setAttribute("aria-label", n + (n == 1 ? " estrella" : " estrellas"));
    boton.setAttribute("aria-pressed", "false");
    selector.appendChild(boton);
  }
}

// Muestra el formulario (o el aviso de iniciar sesion) y lo llena con la reseña propia si ya existe
function prepararFormulario() {
  var hayUsuario = (usuarioActual() != null);
  document.getElementById("aviso-sin-sesion").hidden = hayUsuario;
  formulario.hidden = (hayUsuario == false);
  if (hayUsuario == false) {
    return;
  }

  if (miResena != null) {
    estrellasElegidas = miResena.estrellas;
    cajaTexto.value = miResena.texto;
    document.getElementById("titulo-formulario-resena").textContent = "TU RESEÑA";
    document.getElementById("boton-publicar-resena").textContent = "ACTUALIZAR RESEÑA";
  } else {
    estrellasElegidas = 0;
    cajaTexto.value = "";
    document.getElementById("titulo-formulario-resena").textContent = "ESCRIBÍ TU RESEÑA";
    document.getElementById("boton-publicar-resena").textContent = "PUBLICAR RESEÑA";
  }
  document.getElementById("boton-borrar-mi-resena").hidden = (miResena == null);
  document.getElementById("contador-resena").textContent = cajaTexto.value.length;
  pintarSelector(estrellasElegidas);
}

selector.addEventListener("click", function (evento) {
  var boton = evento.target.closest(".estrella-boton");
  if (boton != null) {
    estrellasElegidas = Number(boton.getAttribute("data-valor"));
    pintarSelector(estrellasElegidas);
  }
});

// al pasar el mouse se previsualiza la puntuacion
selector.addEventListener("mouseover", function (evento) {
  var boton = evento.target.closest(".estrella-boton");
  if (boton != null) {
    pintarSelector(Number(boton.getAttribute("data-valor")));
  }
});
selector.addEventListener("mouseleave", function () {
  pintarSelector(estrellasElegidas);
});

cajaTexto.addEventListener("input", function () {
  document.getElementById("contador-resena").textContent = cajaTexto.value.length;
});

formulario.addEventListener("submit", function (evento) {
  evento.preventDefault();
  if (producto == null || exigirLogin() == false) {
    return;
  }

  var texto = cajaTexto.value.trim();
  if (estrellasElegidas == 0) {
    mostrarMensaje("mensaje-resena", "Elegí cuántas estrellas le ponés al juego.", "error");
    return;
  }
  if (texto == "") {
    mostrarMensaje("mensaje-resena", "Contá tu experiencia con el juego.", "error");
    return;
  }

  var datos = { accion: "guardar", producto: producto.id, estrellas: estrellasElegidas, descripcion: texto };
  llamarApi("resenas.php", datos, function (respuesta) {
    if (respuesta.ok == false) {
      mostrarMensaje("mensaje-resena", respuesta.error, "error");
      return;
    }
    mostrarMensaje("mensaje-resena", respuesta.actualizada ? "Tu reseña se actualizó." : "¡Gracias! Tu reseña se publicó.", "bien");
    cargarResenas(true, true);
  });
});

document.getElementById("boton-borrar-mi-resena").addEventListener("click", function () {
  if (miResena != null) {
    eliminarResena(miResena.id);
  }
});

// ----- Botones de cada reseña (util / no util / eliminar) -----
function votarResena(boton) {
  if (exigirLogin() == false) {
    return;
  }
  var datos = { accion: "votar", id: boton.getAttribute("data-id"), tipo: boton.getAttribute("data-tipo") };

  llamarApi("resenas.php", datos, function (respuesta) {
    if (respuesta.ok == false) {
      alert(respuesta.error);
      return;
    }
    var botones = boton.parentElement.querySelectorAll(".resena-voto");
    for (var i = 0; i < botones.length; i++) {
      var esUtil = (botones[i].getAttribute("data-tipo") == "util");
      botones[i].querySelector("span").textContent = esUtil ? respuesta.utiles : respuesta.noUtiles;
      botones[i].setAttribute("aria-pressed", String(botones[i].getAttribute("data-tipo") == respuesta.miVoto));
    }
  });
}

function eliminarResena(id) {
  if (confirm("¿Seguro que queres eliminar esta reseña?") == false) {
    return;
  }
  llamarApi("resenas.php", { accion: "eliminar", id: id, csrf: CODIGO_CSRF }, function (respuesta) {
    if (respuesta.ok == false) {
      alert(respuesta.error);
      return;
    }
    mostrarMensaje("mensaje-resena", "La reseña se eliminó.", "bien");
    cargarResenas(true, true);
  });
}

// Delegacion de eventos: un solo listener para los botones de todas las reseñas
listaResenas.addEventListener("click", function (evento) {
  var voto = evento.target.closest(".resena-voto");
  if (voto != null) {
    votarResena(voto);
    return;
  }
  var borrar = evento.target.closest(".resena-eliminar");
  if (borrar != null) {
    eliminarResena(borrar.getAttribute("data-id"));
  }
});

// ----- Pestañas (todas / positivas / negativas / recientes) -----
document.getElementById("filtros-resenas").addEventListener("click", function (evento) {
  var pestania = evento.target.closest(".pestania");
  if (pestania == null || producto == null) {
    return;
  }
  filtroActual = pestania.getAttribute("data-filtro");

  var pestanias = this.querySelectorAll(".pestania");
  for (var i = 0; i < pestanias.length; i++) {
    pestanias[i].setAttribute("aria-selected", String(pestanias[i] == pestania));
  }
  cargarResenas(true, false);
});

botonMas.addEventListener("click", function () {
  cargarResenas(false, false);
});

// ----- Agregar al carrito -----
document.getElementById("producto-agregar").addEventListener("click", function () {
  llamarApi("carrito.php", { accion: "agregar", id: producto.id }, function (respuesta) {
    if (respuesta.ok == false) {
      mostrarAviso(respuesta.error);
      return;
    }
    actualizarContadorCarrito();
    mostrarAviso("Se agregó al carrito");
  });
});

// ----- Al cargar la pagina -----
function iniciarProducto() {
  llamarApi("productos.php", { accion: "ver", id: idProducto }, function (respuesta) {
    var estado = document.getElementById("producto-estado");
    if (respuesta.ok == false) {
      estado.textContent = "El videojuego no existe o fue eliminado.";
      return;
    }
    producto = respuesta.producto;
    estado.hidden = true;
    document.getElementById("producto-cuerpo").hidden = false;

    crearSelector();
    dibujarProducto();
    cargarResenas(true, true);
  });
}

// hace falta saber si hay sesion para mostrar el formulario y los botones de eliminar
alCargarSesion(iniciarProducto);
