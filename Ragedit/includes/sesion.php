<?php


require_once __DIR__ . '/ayudas.php';

if (session_status() === PHP_SESSION_NONE) {
    // Nombre propio para que no se mezcle con otros proyectos de PHP que tengas en localhost
    session_name('ragedit_sesion');
    session_set_cookie_params(['path' => '/', 'httponly' => true, 'samesite' => 'Lax']);
    session_start();
}

date_default_timezone_set('America/Argentina/Buenos_Aires');

// Devuelve el id del usuario con sesion iniciada (0 si no hay nadie)
function idUsuarioActual() {
    return isset($_SESSION['usuario_id']) ? (int)$_SESSION['usuario_id'] : 0;
}

// Devuelve los datos del usuario con sesion iniciada, o null si no hay.
// Se vuelve a leer de la base de datos para que, si borraron al usuario, se cierre la sesion sola.
function datosUsuarioActual($pdo) {
    $id = idUsuarioActual();
    if ($id == 0) {
        return null;
    }
    $consulta = $pdo->prepare("SELECT usuarioID, nombreusuario, foto, rol FROM usuarios WHERE usuarioID = ?");
    $consulta->execute([$id]);
    $fila = $consulta->fetch();
    if (!$fila) {
        unset($_SESSION['usuario_id']);
        return null;
    }
    return [
        'id'     => (int)$fila['usuarioID'],
        'nombre' => $fila['nombreusuario'],
        'foto'   => $fila['foto'] ?? '',
        'rol'    => $fila['rol'],
    ];
}

function iniciarSesionPHP($idUsuario) {
    session_regenerate_id(true); 
    $_SESSION['usuario_id'] = (int)$idUsuario;
}

function cerrarSesionPHP() {
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $c = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $c['path'], $c['domain'], $c['secure'], $c['httponly']);
    }
    session_destroy();
}


function tokenCsrf() {
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf'];
}


function csrfValido($enviado) {
    return !empty($_SESSION['csrf']) && is_string($enviado) && hash_equals($_SESSION['csrf'], $enviado);
}
