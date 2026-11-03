<?php


define('ES_API', true);

require_once __DIR__ . '/conexion.php';
require_once __DIR__ . '/sesion.php';
require_once __DIR__ . '/ayudas.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store'); // que el navegador nunca reutilice una respuesta vieja


function responder($datos = []) {
    $datos = array_merge(['ok' => true], $datos);
    echo json_encode($datos, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}

// Contesta con un error y corta. El codigo es el codigo HTTP (400 pedido malo, 401 sin sesion, 403 prohibido, 404 no existe)
function fallar($mensaje, $codigo = 400) {
    http_response_code($codigo);
    echo json_encode(['ok' => false, 'error' => $mensaje], JSON_UNESCAPED_UNICODE);
    exit;
}
function exigirPost() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        fallar('Metodo no permitido.', 405);
    }
}
// Si un archivo de la api tira una excepcion y nadie la atrapa, cae aca
set_exception_handler(function ($e) {
    if ($e instanceof ErrorControlado) {
        fallar($e->getMessage(), $e->getCode() >= 400 ? $e->getCode() : 400);
    }
    fallar(MODO_DEPURACION ? $e->getMessage() : 'Ocurrio un error en el servidor.', 500);
});

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    fallar('Metodo no permitido.', 405);
}


function leerEntrada() {
    $tipo = $_SERVER['CONTENT_TYPE'] ?? '';
    if (stripos($tipo, 'application/json') !== false) {
        $datos = json_decode(file_get_contents('php://input'), true);
        return is_array($datos) ? $datos : [];
    }
    return $_POST;
}

$entrada = leerEntrada();
$accion  = $entrada['accion'] ?? '';

// Devuelve el usuario con sesion iniciada, o corta con error 401
function requerirLogin($pdo) {
    $usuario = datosUsuarioActual($pdo);
    if ($usuario === null) {
        fallar('Tenes que iniciar sesion primero.', 401);
    }
    return $usuario;
}


function requerirAdmin($pdo, $entrada = null) {
    $usuario = requerirLogin($pdo);
    if ($usuario['rol'] !== 'admin') {
        fallar('Solo los administradores pueden hacer esto.', 403);
    }
    if ($entrada !== null && !csrfValido($entrada['csrf'] ?? '')) {
        fallar('Pedido no valido (token de seguridad incorrecto). Recarga la pagina e intenta de nuevo.', 403);
    }
    return $usuario;
}
