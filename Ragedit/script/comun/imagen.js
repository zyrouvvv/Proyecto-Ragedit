

function leerImagen(archivo, cuandoTermina) {
  var lector = new FileReader();

  lector.onload = function () {
    var imagen = new Image();

    imagen.onload = function () {
      var maximo = 800;
      var escala = 1;
      if (imagen.width > maximo || imagen.height > maximo) {
        escala = maximo / Math.max(imagen.width, imagen.height);
      }

      var lienzo = document.createElement("canvas");
      lienzo.width = Math.round(imagen.width * escala);
      lienzo.height = Math.round(imagen.height * escala);
      lienzo.getContext("2d").drawImage(imagen, 0, 0, lienzo.width, lienzo.height);

      cuandoTermina(lienzo.toDataURL("image/jpeg", 0.8));
    };

    imagen.onerror = function () {
      cuandoTermina("");
    };

    imagen.src = lector.result;
  };

  lector.onerror = function () {
    cuandoTermina("");
  };

  lector.readAsDataURL(archivo);
}
