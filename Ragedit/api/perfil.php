<?php
// GET: datos del perfil del usuario logueado
// POST (multipart): nombreusuario, email, estado, desc y foto (opcional)
require '../includes/api.php';
$usuarioSesion = exigirLogin($pdo);
$usuarioID = (int)$usuarioSesion['usuarioID'];

$stmt = $pdo->prepare("SELECT usuarioID, nombreusuario, email, `desc`, foto, estado, registro FROM usuarios WHERE usuarioID = :id");
$stmt->execute([':id' => $usuarioID]);
$usuario = $stmt->fetch();

function datosPerfil($u) {
    return [
        'nombreusuario' => $u['nombreusuario'],
        'email'         => $u['email'],
        'desc'          => $u['desc'] ?? '',
        'estado'        => $u['estado'] ?? 'Activo',
        'foto'          => $u['foto'],
        'registro'      => formatearFecha($u['registro'])
    ];
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    responder(['perfil' => datosPerfil($usuario)]);
}

exigirPost();

$nombre = trim($_POST['nombreusuario'] ?? '');
$email = trim($_POST['email'] ?? '');
$desc = trim($_POST['desc'] ?? '');
$estado = $_POST['estado'] ?? '';

$errores = validarUsuario($pdo, [
    'nombre' => $nombre,
    'email'  => $email,
    'estado' => $estado
], $usuarioID, false);

if (mb_strlen($desc) > 500) {
    $errores['desc'] = 'La descripción puede tener hasta 500 caracteres.';
}

list($fotoNueva, $errorFoto) = guardarFotoPerfil($_FILES['foto'] ?? null, $usuarioID);
if ($errorFoto !== '') {
    $errores['foto'] = $errorFoto;
}

if (count($errores) > 0) {
    if ($fotoNueva !== '') {
        borrarFoto($fotoNueva);
    }
    fallar('Revisá los datos del formulario.', 422, $errores);
}

$nombreFoto = $fotoNueva !== '' ? $fotoNueva : $usuario['foto'];

try {
    $stmt = $pdo->prepare("UPDATE usuarios
                           SET nombreusuario = :nombre, email = :email, `desc` = :descripcion, foto = :foto, estado = :estado
                           WHERE usuarioID = :id");
    $stmt->execute([
        ':nombre'      => $nombre,
        ':email'       => $email,
        ':descripcion' => $desc,
        ':foto'        => $nombreFoto,
        ':estado'      => $estado,
        ':id'          => $usuarioID
    ]);

    if ($fotoNueva !== '') {
        borrarFoto($usuario['foto']); // la foto vieja ya no se usa
    }
    $_SESSION['usuario_nombre'] = $nombre;

    responder(['mensaje' => '¡Perfil actualizado con éxito!', 'foto' => $nombreFoto]);
} catch (PDOException $e) {
    if ($fotoNueva !== '') {
        borrarFoto($fotoNueva);
    }
    if ($e->getCode() == 23000) {
        fallar('Revisá los datos del formulario.', 422, ['email' => 'Ese correo electrónico ya pertenece a otra cuenta.']);
    }
    fallar('Error al actualizar el perfil. Probá de nuevo.', 500);
}
