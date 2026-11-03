
var contenido = document.getElementById("contenido-integrante");


function textoConSaltos(texto) {
  return escaparHtml(texto).replace(/\n/g, "<br>");
}

llamarApi("equipo.php", { accion: "ver", id: leerParametro("id") }, function (respuesta) {
  if (respuesta.ok == false) {
    document.title = "Integrante no encontrado | Ragedit";
    contenido.innerHTML = "<h1>Integrante no encontrado</h1><p>No existe esa presentacion.</p>";
    return;
  }

  var i = respuesta.integrante;
  document.title = i.nombre + " | Ragedit";

  
  var foto = "";
  if (i.foto != "") {
    foto = '<img class="integrante-foto" src="' + CARPETA_IMAGENES + "equipo/" + encodeURIComponent(i.foto) + '" alt="Foto de ' + escaparHtml(i.nombre) + '">';
  } else {
    foto = '<span class="integrante-foto integrante-inicial" aria-hidden="true">' + escaparHtml(i.nombre.charAt(0).toUpperCase()) + "</span>";
  }

  var html =
    '<div class="integrante-cabecera">' + foto +
      "<div><h1>" + escaparHtml(i.nombre) + '</h1><p class="equipo-rol">' + escaparHtml(i.rol) + "</p></div>" +
    "</div>" +
    "<h2>Sobre mi</h2><p>" + textoConSaltos(i.sobreMi) + "</p>";

  if (i.intereses.length > 0) {
    html += "<h2>Intereses</h2><ul>";
    for (var k = 0; k < i.intereses.length; k++) {
      html += "<li>" + escaparHtml(i.intereses[k]) + "</li>";
    }
    html += "</ul>";
  }

  if (i.enlaces.length > 0) {
    html += '<h2>Donde encontrarme</h2><div class="integrante-enlaces">';
    for (var e = 0; e < i.enlaces.length; e++) {
      html += '<a class="boton boton-pastilla boton-gris" href="' + escaparHtml(i.enlaces[e].url) + '" target="_blank" rel="noopener noreferrer">' + escaparHtml(i.enlaces[e].nombre) + "</a>";
    }
    html += "</div>";
  }

  html += '<a class="boton boton-chico" href="acerca-de-nosotros.html#equipo">VOLVER AL EQUIPO</a>';
  contenido.innerHTML = html;
});
