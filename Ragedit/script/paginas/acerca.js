

var listaEquipo = document.getElementById("lista-equipo");

llamarApi("equipo.php", { accion: "listar" }, function (respuesta) {
  if (respuesta.ok == false) {
    listaEquipo.innerHTML = '<li class="vacio">No se pudo cargar el equipo.</li>';
    return;
  }

  listaEquipo.innerHTML = "";
  for (var i = 0; i < respuesta.equipo.length; i++) {
    var integrante = respuesta.equipo[i];

    var li = document.createElement("li");
    li.className = "equipo-integrante";
    li.innerHTML =
      '<span class="equipo-avatar" aria-hidden="true">' + escaparHtml(integrante.nombre.charAt(0).toUpperCase()) + "</span>" +
      "<div>" +
        '<a class="equipo-nombre" href="integrante.html?id=' + integrante.id + '">' + escaparHtml(integrante.nombre) + "</a>" +
        '<span class="equipo-rol">' + escaparHtml(integrante.rol) + "</span>" +
        '<span class="equipo-resumen">' + escaparHtml(integrante.resumen) + "</span>" +
      "</div>";
    listaEquipo.appendChild(li);
  }
});
