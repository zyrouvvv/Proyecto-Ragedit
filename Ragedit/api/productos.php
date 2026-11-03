<?php
// api/productos.php
// Videojuegos de la tienda.
//
// Publico (lo usan la tienda, el carrusel, el carrito y el buscador):
//   { accion: "listar", buscar: "elden", categoria: "RPG" }   -> los dos filtros son opcionales y los hace MySQL
//   { accion: "ver", id: 3 }                                    -> un solo juego
//
// Solo administradores (CRUD de videojuegos; llevan el codigo "csrf"):
//   { accion: "guardar", id: 3, nombre, categoria, precio, destacado, fondo, imagen (archivo), quitar_imagen }
//       sin "id" crea un juego nuevo; con "id" edita ese juego. Va como FormData porque puede llevar la imagen.
//   { accion: "eliminar", id: 3 }

require_once __DIR__ . '/../includes/api.php';
require_once __DIR__ . '/../includes/productos_funciones.php';

// ---------- VER ----------
function verProducto($pdo, $entrada) {
    $consulta = $pdo->prepare("SELECT " . columnasProducto() . " FROM productos WHERE productoID = ?");
    $consulta->execute([(int)($entrada['id'] ?? 0)]);
    $fila = $consulta->fetch();
    if (!$fila) {
        fallar('El videojuego no existe.', 404);
    }
    responder(['producto' => armarProducto($fila)]);
}

// ---------- GUARDAR (crear o editar) ----------
function guardarVideojuego($pdo, $entrada) {
    requerirAdmin($pdo, $entrada);

    $id = (int)($entrada['id'] ?? 0);
    $actual = null; // el juego que se esta editando (null si es uno nuevo)

    if ($id > 0) {
        $consulta = $pdo->prepare("SELECT productoID, imagen FROM productos WHERE productoID = ?");
        $consulta->execute([$id]);
        $actual = $consulta->fetch();
        if (!$actual) {
            fallar('El videojuego no existe.', 404);
        }
    }
    $editando = ($actual !== null);

    $valores = [];
    foreach (['nombre', 'categoria', 'precio', 'destacado', 'fondo', 'desarrollador', 'lanzamiento', 'plataformas', 'descripcion'] as $campo) {
        $valores[$campo] = trim($entrada[$campo] ?? '');
    }
    $quitarImagen = !empty($entrada['quitar_imagen']);

    $errores = validarVideojuego($pdo, $valores, $editando ? $id : 0);

    // Imagen (opcional): se valida que sea una imagen de verdad y que pese hasta 2 MB
    $imagenNueva = '';
    if (isset($_FILES['imagen']) && $_FILES['imagen']['error'] !== UPLOAD_ERR_NO_FILE) {
        try {
            $imagenNueva = guardarImagenSubida($_FILES['imagen'], 'juegos', 'juego');
        } catch (ErrorControlado $e) {
            $errores['imagen'] = $e->getMessage();
        }
    }

    if (count($errores) > 0) {
        // si hubo errores no dejamos la imagen nueva suelta en la carpeta
        borrarImagen('juegos', $imagenNueva);
        responder(['ok' => false, 'errores' => $errores]);
    }

    $precio = (float)str_replace(',', '.', $valores['precio']);
    $imagenAnterior = $editando ? ($actual['imagen'] ?? '') : '';
    $imagenFinal = $imagenAnterior;
    if ($imagenNueva !== '') {
        $imagenFinal = $imagenNueva;
    } elseif ($quitarImagen) {
        $imagenFinal = '';
    }

    try {
        if ($editando) {
            $consulta = $pdo->prepare("UPDATE productos SET nombre = ?, categoria = ?, precio = ?, destacado = ?, fondo = ?, imagen = ?,
                                       desarrollador = ?, lanzamiento = ?, plataformas = ?, descripcion = ? WHERE productoID = ?");
            $consulta->execute([$valores['nombre'], $valores['categoria'], $precio, $valores['destacado'], $valores['fondo'], $imagenFinal,
                                $valores['desarrollador'], $valores['lanzamiento'], $valores['plataformas'], $valores['descripcion'], $id]);
        } else {
            $consulta = $pdo->prepare("INSERT INTO productos (nombre, categoria, precio, destacado, fondo, imagen, desarrollador, lanzamiento, plataformas, descripcion)
                                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $consulta->execute([$valores['nombre'], $valores['categoria'], $precio, $valores['destacado'], $valores['fondo'], $imagenFinal,
                                $valores['desarrollador'], $valores['lanzamiento'], $valores['plataformas'], $valores['descripcion']]);
            $id = (int)$pdo->lastInsertId();
        }
    } catch (PDOException $e) {
        borrarImagen('juegos', $imagenNueva);
        throw $e;
    }

    // si cambio o se quito la imagen, borramos el archivo viejo
    if ($imagenFinal !== $imagenAnterior) {
        borrarImagen('juegos', $imagenAnterior);
    }
    responder(['id' => $id, 'creado' => !$editando]);
}

// ---------- ELIMINAR ----------
function eliminarVideojuego($pdo, $entrada) {
    requerirAdmin($pdo, $entrada);
    $id = (int)($entrada['id'] ?? 0);

    $consulta = $pdo->prepare("SELECT imagen FROM productos WHERE productoID = ?");
    $consulta->execute([$id]);
    $juego = $consulta->fetch();
    if (!$juego) {
        fallar('El videojuego no existe.', 404);
    }

    // si estaba en algun carrito, se saca solo (ON DELETE CASCADE en la base de datos)
    $consulta = $pdo->prepare("DELETE FROM productos WHERE productoID = ?");
    $consulta->execute([$id]);
    borrarImagen('juegos', $juego['imagen']); // y borramos su archivo de imagen
    responder();
}

switch ($accion) {
    case 'listar':
        $buscar    = mb_substr(trim($entrada['buscar'] ?? ''), 0, 100);
        $categoria = mb_substr(trim($entrada['categoria'] ?? ''), 0, 30);
        responder(['productos' => listarProductos($pdo, $buscar, $categoria)]);
        break;

    case 'ver':      verProducto($pdo, $entrada);         break;
    case 'guardar':  guardarVideojuego($pdo, $entrada);   break;
    case 'eliminar': eliminarVideojuego($pdo, $entrada);  break;

    default:
        fallar('Accion desconocida.');
}
