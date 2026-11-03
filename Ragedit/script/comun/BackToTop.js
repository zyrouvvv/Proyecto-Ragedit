var boton = document.getElementById("back-to-top");

window.onscroll = function () {
  if (window.scrollY > 200) {
    boton.style.display = "block";
  } else {
    boton.style.display = "none";
  }
};

boton.onclick = function () {
  window.scrollTo(0, 0);
};
