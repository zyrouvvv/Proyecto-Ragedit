<?php

function armarProducto($fila) {
    return [
        'id'        => (int)$fila['productoID'],
        'nombre'    => $fila['nombre'],
        'categoria' => $fila['categoria'],
        'precio'    => (float)$fila['precio'],
        'destacado' => $fila['destacado'] ?? '',
        'fondo'     => $fila['fondo'],
        'imagen'    => $fila['imagen'] ?? '',
        'desarrollador' => $fila['desarrollador'] ?? '',
        'lanzamiento'   => $fila['lanzamiento'] ?? '',
        'plataformas'   => $fila['plataformas'] ?? '',
        'descripcion'   => $fila['descripcion'] ?? '',
        'promedio'      => round((float)($fila['promedio'] ?? 0), 1),
        'totalResenas'  => (int)($fila['totalresenas'] ?? 0),
    ];
}

function columnasProducto() {
    return "productoID, nombre, categoria, precio, destacado, fondo, imagen,
            desarrollador, lanzamiento, plataformas, descripcion,
            (SELECT AVG(r.estrellas) FROM resenas r WHERE r.productoID = productos.productoID) AS promedio,
            (SELECT COUNT(*)         FROM resenas r WHERE r.productoID = productos.productoID) AS totalresenas";
}


function listarProductos($pdo, $buscar = '', $categoria = '') {
    $condiciones = [];
    $valores = [];

    if ($buscar !== '') {
        $comodin = '%' . escaparLike($buscar) . '%';
        $condiciones[] = "(nombre LIKE ? OR categoria LIKE ?)";
        $valores[] = $comodin;
        $valores[] = $comodin;
    }
    if ($categoria !== '') {
        $condiciones[] = "categoria = ?";
        $valores[] = $categoria;
    }

    $sql = "SELECT " . columnasProducto() . " FROM productos";
    if (count($condiciones) > 0) {
        $sql .= " WHERE " . implode(" AND ", $condiciones);
    }
    $sql .= " ORDER BY productoID";

    $consulta = $pdo->prepare($sql);
    $consulta->execute($valores);

    $lista = [];
    foreach ($consulta->fetchAll() as $fila) {
        $lista[] = armarProducto($fila);
    }
    return $lista;
}


function listarCategoriasProductos($pdo) {
    return $pdo->query("SELECT DISTINCT categoria FROM productos ORDER BY categoria")->fetchAll(PDO::FETCH_COLUMN);
}


function validarVideojuego($pdo, $datos, $excepto = 0) {
    $errores = [];

    $nombre = $datos['nombre'];
    if ($nombre === '' || mb_strlen($nombre) > 80) {
        $errores['nombre'] = 'Escribi un nombre de hasta 80 caracteres.';
    } else {
        $consulta = $pdo->prepare("SELECT 1 FROM productos WHERE nombre = ? AND productoID <> ?");
        $consulta->execute([$nombre, $excepto]);
        if ($consulta->fetch()) {
            $errores['nombre'] = 'Ya hay un videojuego con ese nombre.';
        }
    }

    if ($datos['categoria'] === '' || mb_strlen($datos['categoria']) > 30) {
        $errores['categoria'] = 'Escribi una categoria de hasta 30 caracteres.';
    }

    if (!preg_match('/^\d{1,4}([.,]\d{1,2})?$/', $datos['precio'])) {
        $errores['precio'] = 'Escribi un precio valido, por ejemplo 29.99 (maximo 9999.99).';
    }

    if (mb_strlen($datos['destacado']) > 60) {
        $errores['destacado'] = 'El texto destacado puede tener hasta 60 caracteres.';
    }

    if (!preg_match('/^#[0-9a-fA-F]{6}$/', $datos['fondo'])) {
        $errores['fondo'] = 'Elegi un color valido.';
    }

    if (mb_strlen($datos['desarrollador'] ?? '') > 80) {
        $errores['desarrollador'] = 'El desarrollador puede tener hasta 80 caracteres.';
    }
    if (mb_strlen($datos['lanzamiento'] ?? '') > 20) {
        $errores['lanzamiento'] = 'El lanzamiento puede tener hasta 20 caracteres (por ejemplo 2026).';
    }
    if (mb_strlen($datos['plataformas'] ?? '') > 80) {
        $errores['plataformas'] = 'Las plataformas pueden tener hasta 80 caracteres.';
    }
    if (mb_strlen($datos['descripcion'] ?? '') > 1000) {
        $errores['descripcion'] = 'La descripcion puede tener hasta 1000 caracteres.';
    }

    return $errores;
}
