<?php

class ErrorControlado extends Exception {}

// Escapa un texto para mostrarlo en HTML sin que se pueda colar codigo (XSS)
function h($texto) {
    return htmlspecialchars((string)$texto, ENT_QUOTES, 'UTF-8');
}

// Para buscar con LIKE: avisa que % y _ son letras comunes y no comodines
function escaparLike($texto) {
    return addcslashes($texto, "%_\\");
}

// Misma regla que registro.js: 8+ caracteres con mayuscula, minuscula, numero y simbolo
function claveSegura($clave) {
    return mb_strlen($clave) >= 8
        && preg_match('/[A-Z]/', $clave)
        && preg_match('/[a-z]/', $clave)
        && preg_match('/[0-9]/', $clave)
        && preg_match('/[^A-Za-z0-9]/', $clave);
}


function formatearFechaUnion($fechaBD) {
    $momento = strtotime($fechaBD);
    return date('j/n/Y', $momento) . ' a las ' . date('H:i', $momento);
}



define('CARPETA_IMAGENES', __DIR__ . '/../imagenes/');


function guardarImagenBinaria($contenido, $subcarpeta, $prefijo) {
    $tipos = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/gif' => 'gif', 'image/webp' => 'webp'];


    $info = @getimagesizefromstring($contenido);
    if ($info === false || !isset($tipos[$info['mime']])) {
        throw new ErrorControlado('El archivo no es una imagen valida (solo JPG, PNG, GIF o WEBP).');
    }

    $carpeta = CARPETA_IMAGENES . $subcarpeta . '/';
    if (!is_dir($carpeta)) {
        mkdir($carpeta, 0775, true);
    }

    $nombre = $prefijo . '_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $tipos[$info['mime']];
    if (file_put_contents($carpeta . $nombre, $contenido) === false) {
        throw new ErrorControlado('No se pudo guardar la imagen en el servidor (revisa los permisos de la carpeta imagenes).', 500);
    }
    return $nombre;
}

// La imagen llega desde JavaScript como texto "data:image/jpeg;base64,...." (ver imagen.js)
function guardarImagenDataUrl($dataUrl, $subcarpeta, $prefijo) {
    $posicion = strpos($dataUrl, ';base64,');
    if (strpos($dataUrl, 'data:image/') !== 0 || $posicion === false) {
        throw new ErrorControlado('La imagen no tiene un formato valido.');
    }
    $contenido = base64_decode(substr($dataUrl, $posicion + 8), true);
    if ($contenido === false || strlen($contenido) > 3 * 1024 * 1024) {
        throw new ErrorControlado('La imagen es invalida o pesa mas de 3 MB.');
    }
    return guardarImagenBinaria($contenido, $subcarpeta, $prefijo);
}


function guardarImagenSubida($archivo, $subcarpeta, $prefijo) {
    if ($archivo['error'] !== UPLOAD_ERR_OK) {
        throw new ErrorControlado('No se pudo subir la imagen.');
    }
    if ($archivo['size'] > 2 * 1024 * 1024) {
        throw new ErrorControlado('La imagen pesa mas de 2 MB.');
    }
    return guardarImagenBinaria(file_get_contents($archivo['tmp_name']), $subcarpeta, $prefijo);
}

// Borra un archivo de imagen evita que se escape de la carpeta.
function borrarImagen($subcarpeta, $nombre) {
    if ($nombre === null || $nombre === '') {
        return;
    }
    $ruta = CARPETA_IMAGENES . $subcarpeta . '/' . basename($nombre);
    if (is_file($ruta)) {
        unlink($ruta);
    }
}
