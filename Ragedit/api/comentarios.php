<?php


require_once __DIR__ . '/../includes/api.php';

$publicacionID = (int)($entrada['publicacion'] ?? 0);
$nombrePerfil  = trim($entrada['perfil'] ?? '');

// Devuelve el id del usuario dueño del perfil (o corta con 404 si no existe)
function buscarIdPerfil($pdo, $nombre) {
    $consulta = $pdo->prepare("SELECT usuarioID FROM usuarios WHERE nombreusuario = ?");
    $consulta->execute([$nombre]);
    $fila = $consulta->fetch();
    if (!$fila) {
        fallar('No existe ese usuario.', 404);
    }
    return (int)$fila['usuarioID'];
}

switch ($accion) {
    case 'listar':
        $sql = "SELECT c.comentarioID AS id, u.nombreusuario AS autor, c.contenido AS texto,
                       UNIX_TIMESTAMP(c.fechacreacion) * 1000 AS fecha
                FROM comentarios c
                JOIN usuarios u ON u.usuarioID = c.usuarioID ";
        if ($publicacionID > 0) {
            $consulta = $pdo->prepare($sql . "WHERE c.publicacionID = ? ORDER BY c.comentarioID ASC");
            $consulta->execute([$publicacionID]);
        } else if ($nombrePerfil !== '') {
            $consulta = $pdo->prepare($sql . "WHERE c.perfilID = ? ORDER BY c.comentarioID ASC");
            $consulta->execute([buscarIdPerfil($pdo, $nombrePerfil)]);
        } else {
            fallar('Falta indicar de donde son los comentarios.');
        }

        $lista = [];
        foreach ($consulta->fetchAll() as $fila) {
            $lista[] = [
                'id'    => (int)$fila['id'],
                'autor' => $fila['autor'],
                'texto' => $fila['texto'],
                'fecha' => (int)$fila['fecha'],
            ];
        }
        responder(['comentarios' => $lista]);
        break;

    case 'crear':
        $usuario = requerirLogin($pdo);
        $texto = trim($entrada['texto'] ?? '');

        if ($texto === '') {
            fallar('Escribi un comentario.');
        }
        if (mb_strlen($texto) > 300) {
            fallar('El comentario puede tener hasta 300 caracteres.');
        }

        if ($publicacionID > 0) {
            $existe = $pdo->prepare("SELECT 1 FROM publicaciones WHERE publicacionID = ?");
            $existe->execute([$publicacionID]);
            if (!$existe->fetch()) {
                fallar('La publicacion no existe o fue eliminada.', 404);
            }
            $consulta = $pdo->prepare("INSERT INTO comentarios (publicacionID, perfilID, usuarioID, contenido) VALUES (?, NULL, ?, ?)");
            $consulta->execute([$publicacionID, $usuario['id'], $texto]);
        } else if ($nombrePerfil !== '') {
            $consulta = $pdo->prepare("INSERT INTO comentarios (publicacionID, perfilID, usuarioID, contenido) VALUES (NULL, ?, ?, ?)");
            $consulta->execute([buscarIdPerfil($pdo, $nombrePerfil), $usuario['id'], $texto]);
        } else {
            fallar('Falta indicar donde se comenta.');
        }
        responder();
        break;

    default:
        fallar('Accion desconocida.');
}
