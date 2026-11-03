
function crearFila(pub, autor, accion) {
  var fila = document.createElement("a");
  fila.className = "fila";
  fila.href = "publicacion.html?id=" + pub.id;

  if (autor != "") {
    fila.classList.add("fila-etiquetada");
    var etiqueta = document.createElement("span");
    etiqueta.className = "fila-etiqueta";
    var negrita = document.createElement("b");
    negrita.textContent = autor;
    etiqueta.appendChild(negrita);
    etiqueta.appendChild(document.createTextNode(" " + accion));
    fila.appendChild(etiqueta);
  }

  var miniatura = document.createElement("span");
  miniatura.className = "fila-miniatura";
  fila.appendChild(miniatura);

  var info = document.createElement("span");
  info.className = "fila-info";

  var titulo = document.createElement("span");
  titulo.className = "fila-titulo";
  if (pub.minuscula == true) {
    titulo.classList.add("minusculas");
  }
  titulo.textContent = pub.titulo;
  info.appendChild(titulo);

  var juego = document.createElement("span");
  juego.className = "fila-juego";
  juego.textContent = pub.juego;
  info.appendChild(juego);

  fila.appendChild(info);

  var vistas = document.createElement("span");
  vistas.className = "fila-dato";
  vistas.innerHTML = '<span class="icono icono-vistas" aria-hidden="true"></span>';
  vistas.appendChild(document.createTextNode(formatearNumero(pub.vistas)));
  vistas.title = "Visualizaciones";
  fila.appendChild(vistas);

  var meGusta = document.createElement("span");
  meGusta.className = "fila-dato fila-dato-arriba";
  meGusta.innerHTML = '<span class="icono icono-like" aria-hidden="true"></span>';
  meGusta.appendChild(document.createTextNode(formatearNumero(pub.meGusta)));
  meGusta.title = "Me gusta";
  fila.appendChild(meGusta);

  var noMeGusta = document.createElement("span");
  noMeGusta.className = "fila-dato fila-dato-abajo";
  noMeGusta.innerHTML = '<span class="icono icono-dislike" aria-hidden="true"></span>';
  noMeGusta.appendChild(document.createTextNode(formatearNumero(pub.noMeGusta)));
  noMeGusta.title = "No me gusta";
  fila.appendChild(noMeGusta);

  return fila;

}

// Crea un <li> para un comentario. Si conAvatar es true agrega el circulo con la inicial
function crearComentario(comentario, conAvatar) {
  var li = document.createElement("li");

  if (conAvatar == true) {
    var avatar = document.createElement("span");
    avatar.className = "avatar-chico";
    avatar.textContent = comentario.autor.charAt(0);
    li.appendChild(avatar);
  }

  var cabecera = document.createElement("div");
  cabecera.className = "com-cabecera";

  var autor = document.createElement("a");
  autor.className = "com-usuario";
  autor.href = "perfil.html?u=" + encodeURIComponent(comentario.autor);
  autor.textContent = comentario.autor;
  cabecera.appendChild(autor);

  var hora = document.createElement("span");
  hora.className = "com-hora";
  hora.textContent = haceCuanto(comentario.fecha);
  cabecera.appendChild(hora);

  li.appendChild(cabecera);

  var texto = document.createElement("p");
  texto.className = "com-texto";
  texto.textContent = comentario.texto;
  li.appendChild(texto);

  return li;
}
