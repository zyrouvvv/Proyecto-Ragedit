<?php
// api/reportes.php
// Reportes a publicaciones o a usuarios (tabla "reportes").
//
// Con sesion iniciada (lo usan publicacion.html y perfil.html):
//   { accion: "crear", tipo: "publicacion", id: 9, motivo: "Spam", detalle: "..." }
//   { accion: "crear", tipo: "usuario",     id: 4, motivo: "Acoso", detalle: "..." }
//       "id" es el id de la publicacion o del usuario reportado. "detalle" es opcional (obligatorio si el motivo es "Otro").
//
// Solo administradores (reportes.html; los que modifican llevan el codigo "csrf"):
//   { accion: "listar", estado: "Pendiente" }   -> estado vacio = todos. Tambien devuelve cuantos hay de cada estado
//   { accion: "cambiar_estado", id: 3, estado: "Resuelto" }     Pendiente | Resuelto | Descartado
//   { accion: "eliminar_publicacion", id: 3 }                   borra la publicacion reportada y marca como resueltos sus reportes

require_once __DIR__ . '/../includes/api.php';

// Tiene que ser la misma lista que MOTIVOS_REPORTE de script/comun/reportes.js
const MOTIVOS_REPORTE = [
    'Spam',
    'Contenido ofensivo',
    'Acoso',
    'Suplantacion de identidad',
    'Informacion falsa',
    'Otro',
];
const ESTADOS_REPORTE = ['Pendiente', 'Resuelto', 'Descartado'];

// ---------- CREAR ----------
function crearReporte($pdo, $entrada) {
    $yo      = requerirLogin($pdo);
    $tipo    = $entrada['tipo'] ?? '';
    $id      = (int)($entrada['id'] ?? 0);
    $motivo  = $entrada['motivo'] ?? '';
    $detalle = trim($entrada['detalle'] ?? '');

    if ($tipo !== 'publicacion' && $tipo !== 'usuario') {
        fallar('Tipo de reporte no valido.');
    }
    if (!in_array($motivo, MOTIVOS_REPORTE, true)) {
        fallar('Elegi un motivo de la lista.');
    }
    if ($motivo === 'Otro' && $detalle === '') {
        fallar('Si el motivo es "Otro", contanos que paso.');
    }
    if (mb_strlen($detalle) > 300) {
        fallar('El detalle puede tener hasta 300 caracteres.');
    }

    // Buscamos lo que se reporta y guardamos su nombre ("referencia") para que se siga viendo si despues lo borran
    $publicacionID = null;
    $reportadoID   = null;
    if ($tipo === 'publicacion') {
        $consulta = $pdo->prepare("SELECT publicacionID, usuarioID, titulo FROM publicaciones WHERE publicacionID = ?");
        $consulta->execute([$id]);
        $fila = $consulta->fetch();
        if (!$fila) {
            fallar('La publicacion no existe o fue eliminada.', 404);
        }
        if ((int)$fila['usuarioID'] === $yo['id']) {
            fallar('No podes reportar tu propia publicacion.', 403);
        }
        $publicacionID = (int)$fila['publicacionID'];
        $referencia    = $fila['titulo'];
    } else {
        $consulta = $pdo->prepare("SELECT usuarioID, nombreusuario FROM usuarios WHERE usuarioID = ?");
        $consulta->execute([$id]);
        $fila = $consulta->fetch();
        if (!$fila) {
            fallar('Ese usuario no existe.', 404);
        }
        if ((int)$fila['usuarioID'] === $yo['id']) {
            fallar('No podes reportarte a vos mismo.', 403);
        }
        $reportadoID = (int)$fila['usuarioID'];
        $referencia  = $fila['nombreusuario'];
    }

    // Si ya lo reporto y todavia nadie lo reviso, no se repite (evita llenar al administrador de reportes iguales)
    $consulta = $pdo->prepare(
        "SELECT 1 FROM reportes
         WHERE usuarioID = ? AND tipo = ? AND estado = 'Pendiente' AND publicacionID <=> ? AND reportadoID <=> ?"
    );
    $consulta->execute([$yo['id'], $tipo, $publicacionID, $reportadoID]);
    if ($consulta->fetch()) {
        fallar('Ya reportaste esto. Un administrador lo va a revisar.');
    }

    $consulta = $pdo->prepare(
        "INSERT INTO reportes (usuarioID, tipo, publicacionID, reportadoID, referencia, motivo, `desc`)
         VALUES (?, ?, ?, ?, ?, ?, ?)"
    );
    $consulta->execute([$yo['id'], $tipo, $publicacionID, $reportadoID, mb_substr($referencia, 0, 150), $motivo, $detalle]);
    responder();
}

// ---------- LISTAR (administrador) ----------
function listarReportes($pdo, $entrada) {
    requerirAdmin($pdo);
    $estado = $entrada['estado'] ?? '';

    $sql = "SELECT r.reporteID AS id, r.tipo, r.publicacionID, r.reportadoID, r.referencia, r.motivo,
                   r.`desc` AS detalle, r.estado, UNIX_TIMESTAMP(r.fecha) * 1000 AS fecha,
                   quien.nombreusuario AS quien,
                   p.titulo AS titulo, autor.nombreusuario AS autor,
                   reportado.nombreusuario AS reportado
            FROM reportes r
            LEFT JOIN usuarios quien     ON quien.usuarioID     = r.usuarioID
            LEFT JOIN publicaciones p    ON p.publicacionID     = r.publicacionID
            LEFT JOIN usuarios autor     ON autor.usuarioID     = p.usuarioID
            LEFT JOIN usuarios reportado ON reportado.usuarioID = r.reportadoID ";
    $valores = [];
    if (in_array($estado, ESTADOS_REPORTE, true)) {
        $sql .= "WHERE r.estado = ? ";
        $valores[] = $estado;
    }
    // primero los pendientes y, dentro de cada estado, los mas nuevos
    $sql .= "ORDER BY (r.estado = 'Pendiente') DESC, r.fecha DESC, r.reporteID DESC";

    $consulta = $pdo->prepare($sql);
    $consulta->execute($valores);

    $lista = [];
    foreach ($consulta->fetchAll() as $fila) {
        $lista[] = [
            'id'      => (int)$fila['id'],
            'tipo'    => $fila['tipo'],
            // si lo reportado ya no existe, el nombre queda en "referencia" y no hay a donde mandar al administrador
            'nombre'  => $fila['tipo'] === 'publicacion' ? ($fila['titulo'] ?? $fila['referencia']) : ($fila['reportado'] ?? $fila['referencia']),
            'existe'  => $fila['tipo'] === 'publicacion' ? $fila['publicacionID'] !== null : $fila['reportadoID'] !== null,
            'destino' => (int)($fila['tipo'] === 'publicacion' ? $fila['publicacionID'] : $fila['reportadoID']),
            'autor'   => $fila['autor'] ?? '',
            'motivo'  => $fila['motivo'],
            'detalle' => $fila['detalle'] ?? '',
            'estado'  => $fila['estado'],
            'quien'   => $fila['quien'] ?? '',
            'fecha'   => (int)$fila['fecha'],
        ];
    }

    // cuantos reportes hay de cada estado (para los numeritos de las pestañas)
    $cuentas = ['Pendiente' => 0, 'Resuelto' => 0, 'Descartado' => 0];
    foreach ($pdo->query("SELECT estado, COUNT(*) AS cantidad FROM reportes GROUP BY estado")->fetchAll() as $fila) {
        if (isset($cuentas[$fila['estado']])) {
            $cuentas[$fila['estado']] = (int)$fila['cantidad'];
        }
    }

    responder(['reportes' => $lista, 'cuentas' => $cuentas]);
}

// ---------- CAMBIAR ESTADO (administrador) ----------
function cambiarEstadoReporte($pdo, $entrada) {
    requerirAdmin($pdo, $entrada);
    $id     = (int)($entrada['id'] ?? 0);
    $estado = $entrada['estado'] ?? '';

    if (!in_array($estado, ESTADOS_REPORTE, true)) {
        fallar('Estado no valido.');
    }
    $consulta = $pdo->prepare("UPDATE reportes SET estado = ? WHERE reporteID = ?");
    $consulta->execute([$estado, $id]);
    if ($consulta->rowCount() == 0) {
        // MySQL cuenta 0 filas si el estado ya era ese, asi que comprobamos que el reporte exista
        $existe = $pdo->prepare("SELECT 1 FROM reportes WHERE reporteID = ?");
        $existe->execute([$id]);
        if (!$existe->fetch()) {
            fallar('Ese reporte no existe.', 404);
        }
    }
    responder();
}

// ---------- ELIMINAR LA PUBLICACION REPORTADA (administrador) ----------
function eliminarPublicacionReportada($pdo, $entrada) {
    requerirAdmin($pdo, $entrada);
    $id = (int)($entrada['id'] ?? 0);

    $consulta = $pdo->prepare("SELECT tipo, publicacionID FROM reportes WHERE reporteID = ?");
    $consulta->execute([$id]);
    $reporte = $consulta->fetch();
    if (!$reporte) {
        fallar('Ese reporte no existe.', 404);
    }
    if ($reporte['tipo'] !== 'publicacion') {
        fallar('Ese reporte no es de una publicacion.');
    }
    if ($reporte['publicacionID'] === null) {
        fallar('La publicacion ya no existe.', 404);
    }
    $publicacionID = (int)$reporte['publicacionID'];

    $consulta = $pdo->prepare("SELECT imagen FROM publicaciones WHERE publicacionID = ?");
    $consulta->execute([$publicacionID]);
    $publicacion = $consulta->fetch();

    // Primero se marcan como resueltos todos los reportes de esa publicacion y despues se borra
    // (al borrarla, el id de sus reportes pasa a NULL y ya no se los podria encontrar)
    $pdo->beginTransaction();
    try {
        $pdo->prepare("UPDATE reportes SET estado = 'Resuelto' WHERE publicacionID = ?")->execute([$publicacionID]);
        $pdo->prepare("DELETE FROM publicaciones WHERE publicacionID = ?")->execute([$publicacionID]);
        $pdo->commit();
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
    if ($publicacion) {
        borrarImagen('publicaciones', $publicacion['imagen']);
    }
    responder();
}

switch ($accion) {
    case 'crear':                crearReporte($pdo, $entrada);                break;
    case 'listar':               listarReportes($pdo, $entrada);              break;
    case 'cambiar_estado':       cambiarEstadoReporte($pdo, $entrada);        break;
    case 'eliminar_publicacion': eliminarPublicacionReportada($pdo, $entrada); break;
    default:
        fallar('Accion desconocida.');
}
