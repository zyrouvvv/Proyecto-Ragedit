<?php
// GET: lista de juegos (categorías) para el formulario
// POST: titulo, categoria, contenido
require '../includes/api.php';
$usuario = exigirLogin($pdo);

$categorias = $pdo->query("SELECT categoriaID AS id, nombre FROM categoria ORDER BY nombre")->fetchAll();

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    responder(['categorias' => $categorias]);
}

exigirPost();

$idsValidos = array_map('intval', array_column($categorias, 'id'));
$titulo = trim($_POST['titulo'] ?? '');
$contenido = trim($_POST['contenido'] ?? '');
$categoriaID = (int)($_POST['categoria'] ?? 0);

$errores = [];
if ($titulo === '' || mb_strlen($titulo) > 150) {
    $errores['titulo'] = 'Escribí un título de hasta 150 caracteres.';
}
if (!in_array($categoriaID, $idsValidos, true)) {
    $errores['categoria'] = 'Elegí un juego de la lista.';
}
if ($contenido === '' || mb_strlen($contenido) > 5000) {
    $errores['contenido'] = 'Escribí el contenido (hasta 5000 caracteres).';
}
if (count($errores) > 0) {
    fallar('Revisá los datos del formulario.', 422, $errores);
}

$stmt = $pdo->prepare("INSERT INTO publicaciones (usuarioID, categoriaID, titulo, contenido)
                       VALUES (:usuario, :categoria, :titulo, :contenido)");
$stmt->execute([
    ':usuario'   => $usuario['usuarioID'],
    ':categoria' => $categoriaID,
    ':titulo'    => $titulo,
    ':contenido' => $contenido
]);

responder(['id' => (int)$pdo->lastInsertId(), 'mensaje' => 'Publicación creada.']);
