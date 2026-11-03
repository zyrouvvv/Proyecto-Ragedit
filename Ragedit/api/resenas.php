<?php
// api/resenas.php
// Reseñas y valoraciones de los videojuegos de la tienda (tablas "resenas" y "resenautil").
//
// Publico (lo usa producto.html):
//   { accion: "listar", producto: 3, filtro: "todas", desde: 0 }
//       filtro: "todas" | "positivas" (4 y 5 estrellas) | "negativas" (1 y 2 estrellas) | "recientes"
//       Devuelve el resumen (promedio, total y cuantas reseñas hay de cada cantidad de estrellas),
//       una pagina de reseñas y, si hay sesion, la reseña propia del usuario en ese juego.
//
// Con sesion iniciada:
//   { accion: "guardar", producto: 3, estrellas: 4, descripcion: "..." }
//       crea la reseña del usuario o, si ya habia una, la actualiza (una reseña por usuario y por juego)
//   { accion: "votar", id: 7, tipo: "util" | "noutil" }
//       vota si la reseña le sirvio o no. Votar lo mismo otra vez saca el voto.
//   { accion: "eliminar", id: 7 }
//       la puede borrar su autor o un administrador (el administrador manda tambien el codigo "csrf")

require_once __DIR__ . '/../includes/api.php';

const RESENAS_POR_PAGINA = 10;

// Corta con 404 si el juego no existe
function exigirProducto($pdo, $id) {
    $consulta = $pdo->prepare("SELECT 1 FROM productos WHERE productoID = ?");
    $consulta->execute([$id]);
    if (!$consulta->fetch()) {
        fallar('El videojuego no existe.', 404);
    }
}

// Arma el objeto que espera el JavaScript a partir de una fila de la base de datos
function armarResena($fila) {
    return [
        'id'       => (int)$fila['id'],
        'autor'    => $fila['autor'],
        'foto'     => $fila['foto'] ?? '',
        'estrellas'=> (int)$fila['estrellas'],
        'texto'    => $fila['texto'],
        'fecha'    => (int)$fila['fecha'],
        'utiles'   => (int)$fila['utiles'],
        'noUtiles' => (int)$fila['noutiles'],
        'miVoto'   => $fila['mivoto'] ?? null,   // "util", "noutil" o null
        'esMia'    => (int)$fila['autorid'] === (int)$fila['yoid'],
    ];
}

// El SELECT que usan "listar" y "mi reseña". El ? del principio es el id del usuario con sesion (0 si no hay)
function consultaResenas() {
    return "SELECT r.resenaID AS id, u.usuarioID AS autorid, ? AS yoid,
                   u.nombreusuario AS autor, u.foto, r.estrellas, r.descripcion AS texto,
                   UNIX_TIMESTAMP(r.fechacreacion) * 1000 AS fecha,
                   (SELECT COUNT(*) FROM resenautil x WHERE x.resenaID = r.resenaID AND x.tipo = 'util')   AS utiles,
                   (SELECT COUNT(*) FROM resenautil x WHERE x.resenaID = r.resenaID AND x.tipo = 'noutil') AS noutiles,
                   (SELECT x.tipo FROM resenautil x WHERE x.resenaID = r.resenaID AND x.usuarioID = ?)     AS mivoto
            FROM resenas r
            JOIN usuarios u ON u.usuarioID = r.usuarioID ";
}

// ---------- LISTAR ----------
function listarResenas($pdo, $entrada, $usuario) {
    $productoID = (int)($entrada['producto'] ?? 0);
    exigirProducto($pdo, $productoID);
    $yo = $usuario === null ? 0 : $usuario['id'];

    // Resumen: cuantas reseñas hay de 5, 4, 3, 2 y 1 estrellas
    $consulta = $pdo->prepare("SELECT estrellas, COUNT(*) AS cantidad FROM resenas WHERE productoID = ? GROUP BY estrellas");
    $consulta->execute([$productoID]);
    $porEstrellas = [5 => 0, 4 => 0, 3 => 0, 2 => 0, 1 => 0];
    $total = 0;
    $suma  = 0;
    foreach ($consulta->fetchAll() as $fila) {
        $porEstrellas[(int)$fila['estrellas']] = (int)$fila['cantidad'];
        $total += (int)$fila['cantidad'];
        $suma  += (int)$fila['estrellas'] * (int)$fila['cantidad'];
    }
    $promedio = $total > 0 ? round($suma / $total, 1) : 0;

    // Reseñas (de a RESENAS_POR_PAGINA). Las positivas son de 4 y 5 estrellas; las negativas, de 1 y 2.
    $filtro = $entrada['filtro'] ?? 'todas';
    $sql = consultaResenas() . "WHERE r.productoID = ? ";
    if ($filtro === 'positivas') {
        $sql .= "AND r.estrellas >= 4 ";
    } else if ($filtro === 'negativas') {
        $sql .= "AND r.estrellas <= 2 ";
    }
    if ($filtro === 'recientes') {
        $sql .= "ORDER BY r.fechacreacion DESC, r.resenaID DESC ";
    } else {
        // las mas utiles primero (utiles menos no utiles) y, si empatan, las mas nuevas
        $sql .= "ORDER BY (utiles - noutiles) DESC, r.fechacreacion DESC, r.resenaID DESC ";
    }
    // pedimos una de mas para saber si quedan reseñas sin mostrar
    $desde = max(0, (int)($entrada['desde'] ?? 0));
    $sql .= "LIMIT " . (RESENAS_POR_PAGINA + 1) . " OFFSET " . $desde;

    $consulta = $pdo->prepare($sql);
    $consulta->execute([$yo, $yo, $productoID]);
    $filas = $consulta->fetchAll();

    $hayMas = count($filas) > RESENAS_POR_PAGINA;
    $lista = [];
    foreach (array_slice($filas, 0, RESENAS_POR_PAGINA) as $fila) {
        $lista[] = armarResena($fila);
    }

    // La reseña del propio usuario (para llenar el formulario con lo que ya escribio)
    $miResena = null;
    if ($yo > 0) {
        $consulta = $pdo->prepare(consultaResenas() . "WHERE r.productoID = ? AND r.usuarioID = ?");
        $consulta->execute([$yo, $yo, $productoID, $yo]);
        $fila = $consulta->fetch();
        if ($fila) {
            $miResena = armarResena($fila);
        }
    }

    responder([
        'resumen'  => ['promedio' => $promedio, 'total' => $total, 'porEstrellas' => $porEstrellas],
        'resenas'  => $lista,
        'hayMas'   => $hayMas,
        'miResena' => $miResena,
    ]);
}

// ---------- GUARDAR (crear o actualizar la reseña propia) ----------
function guardarResena($pdo, $entrada) {
    $usuario    = requerirLogin($pdo);
    $productoID = (int)($entrada['producto'] ?? 0);
    $estrellas  = (int)($entrada['estrellas'] ?? 0);
    $texto      = trim($entrada['descripcion'] ?? '');

    exigirProducto($pdo, $productoID);

    if ($estrellas < 1 || $estrellas > 5) {
        fallar('Elegi cuantas estrellas le pones al juego (de 1 a 5).');
    }
    if ($texto === '') {
        fallar('Conta tu experiencia con el juego.');
    }
    if (mb_strlen($texto) > 500) {
        fallar('La reseña puede tener hasta 500 caracteres.');
    }

    $consulta = $pdo->prepare("SELECT resenaID FROM resenas WHERE productoID = ? AND usuarioID = ?");
    $consulta->execute([$productoID, $usuario['id']]);
    $existente = $consulta->fetch();

    try {
        if ($existente) {
            $consulta = $pdo->prepare("UPDATE resenas SET estrellas = ?, descripcion = ? WHERE resenaID = ?");
            $consulta->execute([$estrellas, $texto, $existente['resenaID']]);
        } else {
            $consulta = $pdo->prepare("INSERT INTO resenas (productoID, usuarioID, estrellas, descripcion) VALUES (?, ?, ?, ?)");
            $consulta->execute([$productoID, $usuario['id'], $estrellas, $texto]);
        }
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) { // justo se guardo otra reseña tuya (doble clic)
            fallar('Ya dejaste una reseña para este juego. Recarga la pagina para editarla.');
        }
        throw $e;
    }
    responder(['actualizada' => (bool)$existente]);
}

// ---------- VOTAR (util / no util) ----------
function votarResena($pdo, $entrada) {
    $usuario = requerirLogin($pdo);
    $id   = (int)($entrada['id'] ?? 0);
    $tipo = $entrada['tipo'] ?? '';

    if ($tipo !== 'util' && $tipo !== 'noutil') {
        fallar('Voto no valido.');
    }

    $consulta = $pdo->prepare("SELECT usuarioID FROM resenas WHERE resenaID = ?");
    $consulta->execute([$id]);
    $resena = $consulta->fetch();
    if (!$resena) {
        fallar('La reseña no existe o fue eliminada.', 404);
    }
    if ((int)$resena['usuarioID'] === $usuario['id']) {
        fallar('No podes votar tu propia reseña.', 403);
    }

    $consulta = $pdo->prepare("SELECT utilID, tipo FROM resenautil WHERE resenaID = ? AND usuarioID = ?");
    $consulta->execute([$id, $usuario['id']]);
    $anterior = $consulta->fetch();

    $miVoto = null;
    if ($anterior && $anterior['tipo'] === $tipo) {
        // apretar el mismo boton otra vez saca el voto
        $pdo->prepare("DELETE FROM resenautil WHERE utilID = ?")->execute([$anterior['utilID']]);
    } else if ($anterior) {
        $pdo->prepare("UPDATE resenautil SET tipo = ? WHERE utilID = ?")->execute([$tipo, $anterior['utilID']]);
        $miVoto = $tipo;
    } else {
        $pdo->prepare("INSERT INTO resenautil (resenaID, usuarioID, tipo) VALUES (?, ?, ?)")->execute([$id, $usuario['id'], $tipo]);
        $miVoto = $tipo;
    }

    $consulta = $pdo->prepare(
        "SELECT SUM(tipo = 'util') AS utiles, SUM(tipo = 'noutil') AS noutiles FROM resenautil WHERE resenaID = ?"
    );
    $consulta->execute([$id]);
    $cuentas = $consulta->fetch();

    responder([
        'utiles'   => (int)$cuentas['utiles'],
        'noUtiles' => (int)$cuentas['noutiles'],
        'miVoto'   => $miVoto,
    ]);
}

// ---------- ELIMINAR ----------
function eliminarResena($pdo, $entrada) {
    $usuario = requerirLogin($pdo);
    $id = (int)($entrada['id'] ?? 0);

    $consulta = $pdo->prepare("SELECT usuarioID FROM resenas WHERE resenaID = ?");
    $consulta->execute([$id]);
    $resena = $consulta->fetch();
    if (!$resena) {
        fallar('La reseña no existe o ya fue eliminada.', 404);
    }

    if ((int)$resena['usuarioID'] !== $usuario['id']) {
        // si no es suya tiene que ser administrador (y mandar el codigo csrf, como en el resto de la administracion)
        requerirAdmin($pdo, $entrada);
    }

    $pdo->prepare("DELETE FROM resenas WHERE resenaID = ?")->execute([$id]); // sus votos se borran solos (CASCADE)
    responder();
}

switch ($accion) {
    case 'listar':   listarResenas($pdo, $entrada, datosUsuarioActual($pdo)); break;
    case 'guardar':  guardarResena($pdo, $entrada);                            break;
    case 'votar':    votarResena($pdo, $entrada);                              break;
    case 'eliminar': eliminarResena($pdo, $entrada);                           break;
    default:
        fallar('Accion desconocida.');
}
