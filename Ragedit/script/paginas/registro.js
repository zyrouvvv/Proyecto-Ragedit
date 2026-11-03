

// Revisa que la clave tenga mayuscula, minuscula, numero y simbolo
function claveSegura(clave) {
  var tieneMayuscula = false;
  var tieneMinuscula = false;
  var tieneNumero = false;
  var tieneSimbolo = false;

  for (var i = 0; i < clave.length; i++) {
    var letra = clave.charAt(i);
    if (letra >= "A" && letra <= "Z") {
      tieneMayuscula = true;
    } else if (letra >= "a" && letra <= "z") {
      tieneMinuscula = true;
    } else if (letra >= "0" && letra <= "9") {
      tieneNumero = true;
    } else {
      tieneSimbolo = true;
    }
  }

  return clave.length >= 8 && tieneMayuscula && tieneMinuscula && tieneNumero && tieneSimbolo;
}

// Revisa que el correo tenga una @ y despues un punto
function correoValido(correo) {
  var arroba = correo.indexOf("@");
  if (arroba < 1) {
    return false;
  }
  var punto = correo.indexOf(".", arroba);
  return punto > arroba + 1 && punto < correo.length - 1 && correo.indexOf(" ") == -1;
}


var camposConError = ["usuario", "genero", "correo", "clave", "checks"];

document.getElementById("formulario-registro").addEventListener("submit", function (evento) {
  evento.preventDefault();

  var nombre = document.getElementById("usuario").value.trim();
  var genero = document.getElementById("genero").value;
  var correo = document.getElementById("correo").value.trim();
  var clave = document.getElementById("clave").value;
  var aceptaTerminos = document.getElementById("terminos").checked;
  var aceptaEdad = document.getElementById("edad").checked;

  var hayError = false;

  // nombre de usuario
  if (nombre.length < 1 || nombre.length > 25 || nombre.indexOf(" ") != -1) {
    ponerError("error-usuario", "Usa entre 1 y 25 caracteres, sin espacios.");
    hayError = true;
  } else {
    ponerError("error-usuario", "");
  }

  // genero
  if (genero == "") {
    ponerError("error-genero", "Elegi una opcion.");
    hayError = true;
  } else {
    ponerError("error-genero", "");
  }

  // correo
  if (correoValido(correo) == false) {
    ponerError("error-correo", "Ingresa un correo valido.");
    hayError = true;
  } else {
    ponerError("error-correo", "");
  }

  // clave
  if (claveSegura(clave) == false) {
    ponerError("error-clave", "Minimo 8 caracteres con mayusculas, minusculas, numeros y simbolos.");
    hayError = true;
  } else {
    ponerError("error-clave", "");
  }

  // checkboxes
  if (aceptaTerminos == false || aceptaEdad == false) {
    ponerError("error-checks", "Tenes que aceptar los terminos y confirmar tu edad.");
    hayError = true;
  } else {
    ponerError("error-checks", "");
  }

  if (hayError == true) {
    mostrarMensaje("mensaje", "Revisa los campos marcados.", "error");
    return;
  }

  // todo bien en el navegador: se lo mandamos al servidor para que cree el usuario en la base de datos
  var datos = {
    accion: "registrar",
    usuario: nombre,
    genero: genero,
    correo: correo,
    clave: clave,
    terminos: aceptaTerminos,
    edad: aceptaEdad
  };

  llamarApi("usuarios.php", datos, function (respuesta) {
    if (respuesta.ok == false) {
      // si el servidor mando errores por campo (ej: "Ese nombre de usuario ya existe") los mostramos
      if (respuesta.errores) {
        for (var i = 0; i < camposConError.length; i++) {
          var campo = camposConError[i];
          ponerError("error-" + campo, respuesta.errores[campo] || "");
        }
        mostrarMensaje("mensaje", "Revisa los campos marcados.", "error");
      } else {
        mostrarMensaje("mensaje", respuesta.error, "error");
      }
      return;
    }

    mostrarMensaje("mensaje", "Cuenta creada. Redirigiendo...", "bien");
    setTimeout(function () {
      window.location.href = "foros.html";
    }, 600);
  });
});
