<?php
// POST: id (de la publicación) y accion = comentar | eliminar_comentario | calificar
require '../includes/api.php';
exigirPost();
$usuario = exigirLogin($pdo);

$id = (int)($_POST['id'] ?? 0);
$accion = $_POST['accion'] ?? '';

$stmt = $pdo->prepare("SELECT 1 FROM publicaciones WHERE publicacionID = :id");
$stmt->execute([':id' => $id]);
if (!$stmt->fetch()) {
    fallar('La publicación no existe o fue eliminada.', 404);
}

if ($accion === 'comentar') {
    $texto = trim($_POST['contenido'] ?? '');
    if ($texto === '') {
        fallar('El comentario no puede estar vacío.', 422);
    }
    if (mb_strlen($texto) > 500) {
        fallar('El comentario puede tener hasta 500 caracteres.', 422);
    }
    $stmt = $pdo->prepare("INSERT INTO comentarios (publicacionID, usuarioID, contenido) VALUES (:p, :u, :c)");
    $stmt->execute([':p' => $id, ':u' => $usuario['usuarioID'], ':c' => $texto]);
    responder(['mensaje' => 'Comentario publicado.']);
}

if ($accion === 'eliminar_comentario') {
    $comentarioID = (int)($_POST['comentarioID'] ?? 0);
    $stmt = $pdo->prepare("SELECT usuarioID FROM comentarios WHERE comentarioID = :c AND publicacionID = :p");
    $stmt->execute([':c' => $comentarioID, ':p' => $id]);
    $comentario = $stmt->fetch();

    if ($comentario && ((int)$comentario['usuarioID'] === (int)$usuario['usuarioID'] || $usuario['rol'] === 'admin')) {
        $stmt = $pdo->prepare("DELETE FROM comentarios WHERE comentarioID = :c");
        $stmt->execute([':c' => $comentarioID]);
        responder(['mensaje' => 'Comentario eliminado.']);
    }
    fallar('No podés eliminar ese comentario.', 403);
}

if ($accion === 'calificar') {
    $tipo = $_POST['tipo'] ?? '';
    if ($tipo !== 'me_gusta' && $tipo !== 'no_me_gusta') {
        fallar('Calificación no válida.', 422);
    }

    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare("SELECT likeID, tipo FROM `like` WHERE usuarioID = :u AND publicacionID = :p");
        $stmt->execute([':u' => $usuario['usuarioID'], ':p' => $id]);
        $anterior = $stmt->fetch();

        // Si ya había un voto se borra; si era el mismo tipo, queda sin voto (se "desmarca")
        if ($anterior) {
            $stmt = $pdo->prepare("DELETE FROM `like` WHERE likeID = :l");
            $stmt->execute([':l' => $anterior['likeID']]);
        }
        if (!$anterior || $anterior['tipo'] !== $tipo) {
            $stmt = $pdo->prepare("INSERT INTO `like` (usuarioID, publicacionID, tipo) VALUES (:u, :p, :t)");
            $stmt->execute([':u' => $usuario['usuarioID'], ':p' => $id, ':t' => $tipo]);
        }
        $pdo->commit();
    } catch (PDOException $e) {
        $pdo->rollBack();
        fallar('No se pudo registrar tu calificación.', 500);
    }
    responder();
}

fallar('Acción no válida.', 400);
