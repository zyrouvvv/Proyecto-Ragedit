<?php


require_once __DIR__ . '/../includes/api.php';


function consultaBase() {
    return "SELECT p.publicacionID AS id, p.titulo, p.subtitulo, p.contenido AS texto, p.imagen,
                   p.vistas, p.megusta, p.nomegusta, p.minuscula,
                   c.nombre AS juego, u.nombreusuario AS autor,
                   UNIX_TIMESTAMP(p.fechacreacion) * 1000 AS fecha
            FROM publicaciones p
            JOIN usuarios u  ON u.usuarioID  = p.usuarioID
            JOIN categoria c ON c.categoriaID = p.categoriaID ";
}

// Convierte una fila de la base de datos en el objeto que espera el JavaScript
function armarPublicacion($fila) {
    return [
        'id'        => (int)$fila['id'],
        'titulo'    => $fila['titulo'],
        'subtitulo' => $fila['subtitulo'] ?? '',
        'texto'     => $fila['texto'],
        'imagen'    => $fila['imagen'] ?? '',
        'vistas'    => (int)$fila['vistas'],
        'meGusta'   => (int)$fila['megusta'],
        'noMeGusta' => (int)$fila['nomegusta'],
        'minuscula' => ((int)$fila['minuscula']) === 1,
        'juego'     => $fila['juego'],
        'autor'     => $fila['autor'],
        'fecha'     => (int)$fila['fecha'],
    ];
}

// Busca una publicacion por id (null si no existe)
function buscarPublicacion($pdo, $id) {
    $consulta = $pdo->prepare(consultaBase() . "WHERE p.publicacionID = ?");
    $consulta->execute([$id]);
    $fila = $consulta->fetch();
    return $fila ? armarPublicacion($fila) : null;
}

// Busca la publicacion o corta con 404
function publicacionOError($pdo, $id) {
    $publicacion = buscarPublicacion($pdo, $id);
    if ($publicacion === null) {
        fallar('La publicacion no existe o fue eliminada.', 404);
    }
    return $publicacion;
}

// Revisa los campos del formulario de crear/editar. Devuelve [titulo, subtitulo, texto, categoriaID]
function validarCampos($pdo, $entrada) {
    $titulo    = trim($entrada['titulo'] ?? '');
    $subtitulo = trim($entrada['subtitulo'] ?? '');
    $texto     = trim($entrada['texto'] ?? '');
    $juego     = $entrada['juego'] ?? '';

    if ($titulo === '') {
        throw new ErrorControlado('Escribi un titulo.');
    }
    if (mb_strlen($titulo) > 100) {
        throw new ErrorControlado('El titulo puede tener hasta 100 caracteres.');
    }
    if (mb_strlen($subtitulo) > 120) {
        throw new ErrorControlado('El subtitulo puede tener hasta 120 caracteres.');
    }
    if (mb_strlen($texto) > 5000) {
        throw new ErrorControlado('El contenido puede tener hasta 5000 caracteres.');
    }

    $consulta = $pdo->prepare("SELECT categoriaID FROM categoria WHERE nombre = ?");
    $consulta->execute([$juego]);
    $fila = $consulta->fetch();
    if (!$fila) {
        throw new ErrorControlado('Selecciona un juego.');
    }

    return [$titulo, $subtitulo, $texto, (int)$fila['categoriaID']];
}

function juegos($pdo) {
    $lista = $pdo->query("SELECT nombre FROM categoria ORDER BY categoriaID")->fetchAll(PDO::FETCH_COLUMN);
    responder(['juegos' => $lista]);
}

function listar($pdo, $entrada) {
    $orden     = $entrada['orden'] ?? 'tendencia';
    $comunidad = trim($entrada['comunidad'] ?? '');
    $buscar    = trim($entrada['buscar'] ?? '');

    $condiciones = [];
    $valores     = [];

    // la comunidad filtra por juegos que EMPIEZAN con ese texto (ej: "GTA" trae GTA V y GTA VI)
    if ($comunidad !== '') {
        $condiciones[] = "c.nombre LIKE ?";
        $valores[]     = escaparLike($comunidad) . '%';
    }
    // el buscador mira en titulo, juego y autor
    if ($buscar !== '') {
        $condiciones[] = "CONCAT(p.titulo, ' ', c.nombre, ' ', u.nombreusuario) LIKE ?";
        $valores[]     = '%' . escaparLike($buscar) . '%';
    }

    $sql = consultaBase();
    if (count($condiciones) > 0) {
        $sql .= "WHERE " . implode(" AND ", $condiciones) . " ";
    }

    // las 3 pestañas: tendencia, recomendados (mas likes) y recientes
    if ($orden === 'recomendados') {
        $sql .= "ORDER BY p.megusta DESC, p.publicacionID ASC ";
    } else if ($orden === 'recientes') {
        $sql .= "ORDER BY p.fechacreacion DESC, p.publicacionID ASC ";
    } else {
        $sql .= "ORDER BY p.tendencia ASC, p.publicacionID ASC ";
    }
    $sql .= "LIMIT 8";

    $consulta = $pdo->prepare($sql);
    $consulta->execute($valores);

    $lista = [];
    foreach ($consulta->fetchAll() as $fila) {
        $lista[] = armarPublicacion($fila);
    }
    responder(['publicaciones' => $lista]);
}


function registrarBusqueda($pdo, $entrada) {
    $usuario = datosUsuarioActual($pdo);
    $texto   = mb_substr(trim($entrada['texto'] ?? ''), 0, 255);
    if ($usuario !== null && $texto !== '') {
        $consulta = $pdo->prepare("INSERT INTO historialbusqueda (usuarioID, busqueda) VALUES (?, ?)");
        $consulta->execute([$usuario['id'], $texto]);
    }
    responder();
}

function busquedasPopulares($pdo) {
    $consulta = $pdo->query(
        "SELECT MIN(busqueda) AS texto, COUNT(*) AS cantidad
         FROM historialbusqueda
         GROUP BY LOWER(TRIM(busqueda))
         ORDER BY cantidad DESC, MAX(fechahora) DESC
         LIMIT 5"
    );
    responder(['busquedas' => $consulta->fetchAll(PDO::FETCH_COLUMN)]);
}

function ver($pdo, $entrada) {
    $id      = (int)($entrada['id'] ?? 0);
    $usuario = datosUsuarioActual($pdo);
    $publicacion = publicacionOError($pdo, $id);

    // Sumamos una visita, pero una sola vez por sesion (igual que antes, que era una vez por pestaña)
    if (empty($_SESSION['vistas'][$id])) {
        $_SESSION['vistas'][$id] = true;
        $consulta = $pdo->prepare("UPDATE publicaciones SET vistas = vistas + 1 WHERE publicacionID = ?");
        $consulta->execute([$id]);
        $publicacion['vistas']++;

        if ($usuario !== null) {
            $historial = $pdo->prepare("INSERT INTO historialreproduccion (publicacionID, usuarioID) VALUES (?, ?)");
            $historial->execute([$id, $usuario['id']]);
        }
    }

    responder([
        'publicacion' => $publicacion,
        'miVoto'      => buscarMiVoto($pdo, $usuario, $id),
        'yaReposteo'  => yaReposteo($pdo, $usuario, $id),
    ]);
}

// Devuelve "arriba", "abajo" o null segun lo que voto el usuario
function buscarMiVoto($pdo, $usuario, $publicacionID) {
    if ($usuario === null) {
        return null;
    }
    $consulta = $pdo->prepare("SELECT tipo FROM `like` WHERE usuarioID = ? AND publicacionID = ?");
    $consulta->execute([$usuario['id'], $publicacionID]);
    $fila = $consulta->fetch();
    return $fila ? $fila['tipo'] : null;
}

function yaReposteo($pdo, $usuario, $publicacionID) {
    if ($usuario === null) {
        return false;
    }
    $consulta = $pdo->prepare("SELECT 1 FROM repost WHERE usuarioID = ? AND publicacionID = ?");
    $consulta->execute([$usuario['id'], $publicacionID]);
    return $consulta->fetch() !== false;
}

function crear($pdo, $entrada) {
    $usuario = requerirLogin($pdo);
    list($titulo, $subtitulo, $texto, $categoriaID) = validarCampos($pdo, $entrada);

    // la imagen es opcional. Llega como texto base64 (la achica imagen.js antes de mandarla)
    $imagen = '';
    if (!empty($entrada['imagen'])) {
        $imagen = guardarImagenDataUrl($entrada['imagen'], 'publicaciones', 'pub_' . $usuario['id']);
    }

    try {
        // tendencia 200 = las publicaciones nuevas arrancan abajo en "EN TENDENCIA" (como antes)
        $consulta = $pdo->prepare(
            "INSERT INTO publicaciones (usuarioID, categoriaID, titulo, subtitulo, contenido, imagen, tendencia, minuscula)
             VALUES (?, ?, ?, ?, ?, ?, 200, 0)"
        );
        $consulta->execute([$usuario['id'], $categoriaID, $titulo, $subtitulo, $texto, $imagen]);
    } catch (Exception $e) {
        borrarImagen('publicaciones', $imagen);
        throw $e;
    }

    responder(['id' => (int)$pdo->lastInsertId()]);
}

function paraEditar($pdo, $entrada) {
    $usuario = requerirLogin($pdo);
    $publicacion = publicacionOError($pdo, (int)($entrada['id'] ?? 0));

    if ($publicacion['autor'] !== $usuario['nombre']) {
        fallar('No podes editar esta publicacion.', 403);
    }
    responder(['publicacion' => $publicacion]);
}

function editar($pdo, $entrada) {
    $usuario = requerirLogin($pdo);
    $id = (int)($entrada['id'] ?? 0);
    $publicacion = publicacionOError($pdo, $id);

    // solo el autor puede editar su publicacion
    if ($publicacion['autor'] !== $usuario['nombre']) {
        fallar('No podes editar esta publicacion.', 403);
    }

    list($titulo, $subtitulo, $texto, $categoriaID) = validarCampos($pdo, $entrada);

    // si mando una imagen nueva reemplaza a la anterior; si no, se queda la que estaba
    $imagen = $publicacion['imagen'];
    $imagenNueva = '';
    if (!empty($entrada['imagen'])) {
        $imagenNueva = guardarImagenDataUrl($entrada['imagen'], 'publicaciones', 'pub_' . $usuario['id']);
        $imagen = $imagenNueva;
    }

    try {
        $consulta = $pdo->prepare(
            "UPDATE publicaciones
             SET categoriaID = ?, titulo = ?, subtitulo = ?, contenido = ?, imagen = ?, minuscula = 0
             WHERE publicacionID = ?"
        );
        $consulta->execute([$categoriaID, $titulo, $subtitulo, $texto, $imagen, $id]);
    } catch (Exception $e) {
        borrarImagen('publicaciones', $imagenNueva);
        throw $e;
    }

    if ($imagenNueva !== '') {
        borrarImagen('publicaciones', $publicacion['imagen']);
    }
    responder(['id' => $id]);
}

function mias($pdo) {
    $usuario = requerirLogin($pdo);
    $consulta = $pdo->prepare(consultaBase() . "WHERE p.usuarioID = ? ORDER BY p.publicacionID ASC");
    $consulta->execute([$usuario['id']]);

    $lista = [];
    foreach ($consulta->fetchAll() as $fila) {
        $lista[] = armarPublicacion($fila);
    }
    responder(['publicaciones' => $lista]);
}

// Los comentarios, votos y reposteos se borran solos (ON DELETE CASCADE en la base de datos)
function eliminar($pdo, $entrada) {
    $usuario = requerirLogin($pdo);
    $publicacion = publicacionOError($pdo, (int)($entrada['id'] ?? 0));

    // la puede borrar su autor o un administrador
    if ($publicacion['autor'] !== $usuario['nombre'] && $usuario['rol'] !== 'admin') {
        fallar('No podes eliminar esta publicacion.', 403);
    }

    $consulta = $pdo->prepare("DELETE FROM publicaciones WHERE publicacionID = ?");
    $consulta->execute([$publicacion['id']]);
    borrarImagen('publicaciones', $publicacion['imagen']);
    responder();
}


function votar($pdo, $entrada) {
    $usuario = requerirLogin($pdo);
    $id   = (int)($entrada['id'] ?? 0);
    $tipo = $entrada['tipo'] ?? '';

    if ($tipo !== 'arriba' && $tipo !== 'abajo') {
        fallar('Voto no valido.');
    }
    publicacionOError($pdo, $id);

    $pdo->beginTransaction(); // todo o nada: si algo falla, no queda el contador a medias
    try {
        $consulta = $pdo->prepare("SELECT likeID, tipo FROM `like` WHERE usuarioID = ? AND publicacionID = ?");
        $consulta->execute([$usuario['id'], $id]);
        $anterior = $consulta->fetch();

        $columnas = ['arriba' => 'megusta', 'abajo' => 'nomegusta'];

        if ($anterior) {
            $pdo->prepare("DELETE FROM `like` WHERE likeID = ?")->execute([$anterior['likeID']]);
            $columna = $columnas[$anterior['tipo']];
            $pdo->prepare("UPDATE publicaciones SET $columna = GREATEST($columna - 1, 0) WHERE publicacionID = ?")->execute([$id]);
        }

        $miVoto = null;
        if (!$anterior || $anterior['tipo'] !== $tipo) {
            $pdo->prepare("INSERT INTO `like` (usuarioID, publicacionID, tipo) VALUES (?, ?, ?)")->execute([$usuario['id'], $id, $tipo]);
            $columna = $columnas[$tipo];
            $pdo->prepare("UPDATE publicaciones SET $columna = $columna + 1 WHERE publicacionID = ?")->execute([$id]);
            $miVoto = $tipo;
        }

        $pdo->commit();
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }

    $publicacion = publicacionOError($pdo, $id);
    responder([
        'meGusta'   => $publicacion['meGusta'],
        'noMeGusta' => $publicacion['noMeGusta'],
        'miVoto'    => $miVoto,
    ]);
}

function repostear($pdo, $entrada) {
    $usuario = requerirLogin($pdo);
    $id = (int)($entrada['id'] ?? 0);
    publicacionOError($pdo, $id);

    if (yaReposteo($pdo, $usuario, $id)) {
        $consulta = $pdo->prepare("DELETE FROM repost WHERE usuarioID = ? AND publicacionID = ?");
        $consulta->execute([$usuario['id'], $id]);
        responder(['yaReposteo' => false]);
    }

    $consulta = $pdo->prepare("INSERT INTO repost (usuarioID, publicacionID) VALUES (?, ?)");
    $consulta->execute([$usuario['id'], $id]);
    responder(['yaReposteo' => true]);
}

// Junta las publicaciones que hizo el usuario y las que reposteo, las mas nuevas primero
function deUsuario($pdo, $entrada) {
    $nombre = trim($entrada['nombre'] ?? '');
    $consulta = $pdo->prepare("SELECT usuarioID FROM usuarios WHERE nombreusuario = ?");
    $consulta->execute([$nombre]);
    $propietario = $consulta->fetch();
    if (!$propietario) {
        fallar('No existe ese usuario.', 404);
    }
    $usuarioID = (int)$propietario['usuarioID'];

    $elementos = [];

    $propias = $pdo->prepare(consultaBase() . "WHERE p.usuarioID = ?");
    $propias->execute([$usuarioID]);
    foreach ($propias->fetchAll() as $fila) {
        $pub = armarPublicacion($fila);
        $elementos[] = ['publicacion' => $pub, 'fecha' => $pub['fecha'], 'accion' => 'publico.'];
    }

    $reposteadas = $pdo->prepare(
        "SELECT r.publicacionID, UNIX_TIMESTAMP(r.fecharepost) * 1000 AS fechaRepost FROM repost r WHERE r.usuarioID = ?"
    );
    $reposteadas->execute([$usuarioID]);
    foreach ($reposteadas->fetchAll() as $fila) {
        $original = buscarPublicacion($pdo, (int)$fila['publicacionID']);
        if ($original !== null) {
            $elementos[] = ['publicacion' => $original, 'fecha' => (int)$fila['fechaRepost'], 'accion' => 'reposteo.'];
        }
    }

    // las mas nuevas primero
    usort($elementos, function ($a, $b) {
        return $b['fecha'] <=> $a['fecha'];
    });

    responder(['elementos' => $elementos]);
}

switch ($accion) {
    case 'juegos':             juegos($pdo);                     break;
    case 'listar':             listar($pdo, $entrada);           break;
    case 'registrar_busqueda': registrarBusqueda($pdo, $entrada); break;
    case 'populares':          busquedasPopulares($pdo);         break;
    case 'ver':                ver($pdo, $entrada);              break;
    case 'crear':              crear($pdo, $entrada);            break;
    case 'para_editar':        paraEditar($pdo, $entrada);       break;
    case 'editar':             editar($pdo, $entrada);           break;
    case 'mias':               mias($pdo);                       break;
    case 'eliminar':           eliminar($pdo, $entrada);         break;
    case 'votar':              votar($pdo, $entrada);            break;
    case 'repostear':          repostear($pdo, $entrada);        break;
    case 'de_usuario':         deUsuario($pdo, $entrada);        break;
    default:
        fallar('Accion desconocida.');
}
