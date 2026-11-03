<?php


const GENEROS_VALIDOS = ['Hombre', 'Mujer', 'Prefiero no decirlo.'];
const ESTADOS_VALIDOS = ['Activo', 'Ocupado', 'Ausente', 'Inactivo'];


function existeUsuario($pdo, $columna, $valor, $excepto = 0) {
    $consulta = $pdo->prepare("SELECT 1 FROM usuarios WHERE $columna = ? AND usuarioID <> ?");
    $consulta->execute([$valor, $excepto]);
    return $consulta->fetch() !== false;
}


function validarNombreYCorreo($pdo, $nombre, $correo, $excepto = 0) {
    $errores = [];

    if (mb_strlen($nombre) < 1 || mb_strlen($nombre) > 25 || strpos($nombre, ' ') !== false) {
        $errores['usuario'] = 'Usa entre 1 y 25 caracteres, sin espacios.';
    } elseif (existeUsuario($pdo, 'nombreusuario', $nombre, $excepto)) {
        $errores['usuario'] = 'Ese nombre de usuario ya existe.';
    }

    if (!filter_var($correo, FILTER_VALIDATE_EMAIL) || mb_strlen($correo) > 100) {
        $errores['correo'] = 'Ingresa un correo valido.';
    } elseif (existeUsuario($pdo, 'email', $correo, $excepto)) {
        $errores['correo'] = 'Ese correo ya esta registrado.';
    }

    return $errores;
}
