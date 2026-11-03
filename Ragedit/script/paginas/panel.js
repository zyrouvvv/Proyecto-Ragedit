var iconoBorrar = '<span class="icono icono-delete" aria-hidden="true"></span>';
var iconoEditar = '<span class="icono icono-editar" aria-hidden="true"></span>';

var cuerpoTabla = document.getElementById("tabla-usuarios");
var formularioUsuario = document.getElementById("formulario-usuario");
var usuariosCargados = [];

// Dibuja una fila por cada usuario
function dibujarUsuarios(lista) {
  cuerpoTabla.innerHTML = "";

  for (var i = 0; i < lista.length; i++) {
    var u = lista[i];
    var fila = document.createElement("tr");

    // el boton de eliminar no aparece en tu propia fila
    var botonEliminar = "";
    if (u.id != usuarioActual().id) {
      botonEliminar = '<button type="button" class="cuadrado cuadrado-borrar boton-eliminar" data-accion="eliminar" data-id="' + u.id + '" aria-label="Eliminar">' + iconoBorrar + '</button>';
    }

    fila.innerHTML =
      "<td>" + u.id + "</td>" +
      '<td><a href="perfil.html?u=' + encodeURIComponent(u.nombre) + '">' + escaparHtml(u.nombre) + "</a></td>" +
      "<td>" + escaparHtml(u.correo) + "</td>" +
      "<td>" + escaparHtml(u.estado) + "</td>" +
      "<td>" + escaparHtml(u.rol) + "</td>" +
      '<td><div class="tabla-acciones">' +
        '<button type="button" class="cuadrado cuadrado-editar" data-accion="editar" data-id="' + u.id + '" aria-label="Editar">' + iconoEditar + '</button>' +
        botonEliminar +
      "</div></td>";
    cuerpoTabla.appendChild(fila);
  }
}

// Le pide la lista de usuarios al servidor
function mostrarUsuarios() {
  llamarApi("usuarios.php", { accion: "admin_listar" }, function (respuesta) {
    if (respuesta.ok == false) {
      mostrarMensaje("mensaje", respuesta.error, "error");
      return;
    }
    usuariosCargados = respuesta.usuarios;
    dibujarUsuarios(usuariosCargados);
  });
}

// Pone los datos de un usuario en el formulario de edicion y lo muestra
function editarUsuario(id) {
  for (var i = 0; i < usuariosCargados.length; i++) {
    if (usuariosCargados[i].id == id) {
      var u = usuariosCargados[i];
      document.getElementById("id-usuario").value = u.id;
      document.getElementById("nombre").value = u.nombre;
      document.getElementById("correo").value = u.correo;
      document.getElementById("estado").value = u.estado;
      document.getElementById("rol").value = u.rol;
      formularioUsuario.hidden = false;
      formularioUsuario.scrollIntoView();
    }
  }
}

function eliminarUsuario(id) {
  if (confirm("¿Seguro que queres eliminar a este usuario? Tambien se borran sus publicaciones y comentarios.") == false) {
    return;
  }
  llamarApi("usuarios.php", { accion: "admin_eliminar", id: id, csrf: CODIGO_CSRF }, function (respuesta) {
    if (respuesta.ok == false) {
      mostrarMensaje("mensaje", respuesta.error, "error");
      return;
    }
    mostrarMensaje("mensaje", "Usuario eliminado.", "bien");
    mostrarUsuarios();
  });
}

//  Eventos 

cuerpoTabla.addEventListener("click", function (evento) {
  var boton = evento.target.closest("button");
  if (boton == null) {
    return;
  }
  var id = boton.getAttribute("data-id");
  if (boton.getAttribute("data-accion") == "editar") {
    editarUsuario(id);
  } else if (boton.getAttribute("data-accion") == "eliminar") {
    eliminarUsuario(id);
  }
});

formularioUsuario.addEventListener("submit", function (evento) {
  evento.preventDefault();

  var datos = {
    accion: "admin_guardar",
    csrf: CODIGO_CSRF,
    id: document.getElementById("id-usuario").value,
    nombre: document.getElementById("nombre").value.trim(),
    correo: document.getElementById("correo").value.trim(),
    estado: document.getElementById("estado").value,
    rol: document.getElementById("rol").value
  };

  llamarApi("usuarios.php", datos, function (respuesta) {
    if (respuesta.ok == false) {
      mostrarMensaje("mensaje", respuesta.error, "error");
      return;
    }
    mostrarMensaje("mensaje", "Cambios guardados.", "bien");
    formularioUsuario.hidden = true;
    mostrarUsuarios();
  });
});

document.getElementById("boton-cancelar").addEventListener("click", function () {
  formularioUsuario.hidden = true;
});

function iniciarPanel() {
  if (exigirAdmin() == false) {
    return;
  }
  // si venimos de crear un usuario, avisamos que salio bien
  if (leerParametro("ok") == "creado") {
    mostrarMensaje("mensaje", "Usuario creado.", "bien");
  }
  mostrarUsuarios();
}

alCargarSesion(iniciarPanel);
