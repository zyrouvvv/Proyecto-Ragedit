<?php


require_once __DIR__ . '/../includes/api.php';
require_once __DIR__ . '/../includes/usuarios_funciones.php';


function registrar($pdo, $entrada) {
    $nombre = trim($entrada['usuario'] ?? '');
    $genero = $entrada['genero'] ?? '';
    $correo = trim($entrada['correo'] ?? '');
    $clave  = $entrada['clave'] ?? '';

    $errores = validarNombreYCorreo($pdo, $nombre, $correo);

    if (!in_array($genero, GENEROS_VALIDOS, true)) {
        $errores['genero'] = 'Elegi una opcion.';
    }
    if (!claveSegura($clave)) {
        $errores['clave'] = 'Minimo 8 caracteres con mayusculas, minusculas, numeros y simbolos.';
    }
    if (empty($entrada['terminos']) || empty($entrada['edad'])) {
        $errores['checks'] = 'Tenes que aceptar los terminos y confirmar tu edad.';
    }

    if (count($errores) > 0) {
        responder(['ok' => false, 'errores' => $errores]);
    }

    // La contraseña NUNCA se guarda tal cual: se guarda su hash (igual que en el registro.php de Proyecto)
    $hash = password_hash($clave, PASSWORD_BCRYPT);

    try {
        $consulta = $pdo->prepare(
            "INSERT INTO usuarios (nombreusuario, email, `contraseña`, genero, `desc`, estado, rol)
             VALUES (?, ?, ?, ?, '', 'Activo', 'usuario')"
        );
        $consulta->execute([$nombre, $correo, $hash, $genero]);
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) { // clave duplicada (alguien se registro justo antes)
            responder(['ok' => false, 'errores' => ['usuario' => 'Ese nombre o correo ya esta registrado.']]);
        }
        throw $e;
    }

    $nuevoID = (int)$pdo->lastInsertId();
    iniciarSesionPHP($nuevoID);

    responder(['usuario' => ['id' => $nuevoID, 'nombre' => $nombre]]);
}

function entrar($pdo, $entrada) {
    $dato  = trim($entrada['dato'] ?? '');
    $clave = $entrada['clave'] ?? '';

    if ($dato === '' || $clave === '') {
        fallar('Completa el usuario (o correo) y la contraseña.');
    }

    // se puede entrar con el nombre de usuario o con el correo
    $consulta = $pdo->prepare("SELECT usuarioID, nombreusuario, `contraseña` AS clave FROM usuarios WHERE nombreusuario = ? OR email = ? LIMIT 1");
    $consulta->execute([$dato, $dato]);
    $usuario = $consulta->fetch();

    if (!$usuario || !password_verify($clave, $usuario['clave'])) {
        fallar('Usuario o contraseña incorrectos.', 401);
    }

    iniciarSesionPHP($usuario['usuarioID']);

    responder(['usuario' => ['id' => (int)$usuario['usuarioID'], 'nombre' => $usuario['nombreusuario']]]);
}

// Es una simulacion, igual que antes: crea un usuario "invitado_servicio" y entra con el.
// Ese usuario tiene una contraseña al azar, asi que solo se puede entrar con el boton rapido.
function entrarRapido($pdo, $entrada) {
    $servicio = $entrada['servicio'] ?? '';
    if (!in_array($servicio, ['google', 'discord', 'steam'], true)) {
        fallar('Servicio no valido.');
    }
    $nombre = 'invitado_' . $servicio;

    $consulta = $pdo->prepare("SELECT usuarioID FROM usuarios WHERE nombreusuario = ?");
    $consulta->execute([$nombre]);
    $fila = $consulta->fetch();

    if ($fila) {
        $id = (int)$fila['usuarioID'];
    } else {
        $hash = password_hash(bin2hex(random_bytes(16)), PASSWORD_BCRYPT);
        $crear = $pdo->prepare(
            "INSERT INTO usuarios (nombreusuario, email, `contraseña`, genero, `desc`, estado, rol)
             VALUES (?, ?, ?, 'Prefiero no decirlo.', '', 'Activo', 'usuario')"
        );
        $crear->execute([$nombre, $nombre . '@ragedit.com', $hash]);
        $id = (int)$pdo->lastInsertId();
    }

    iniciarSesionPHP($id);

    responder(['usuario' => ['id' => $id, 'nombre' => $nombre]]);
}

// Si no se manda "nombre" se devuelve el perfil del usuario con sesion iniciada
function verPerfil($pdo, $entrada) {
    $nombre = trim($entrada['nombre'] ?? '');
    $actual = datosUsuarioActual($pdo);

    if ($nombre === '') {
        if ($actual === null) {
            fallar('Tenes que iniciar sesion primero.', 401);
        }
        $nombre = $actual['nombre'];
    }

    $consulta = $pdo->prepare("SELECT usuarioID, nombreusuario, email, `desc`, foto, estado, registro FROM usuarios WHERE nombreusuario = ?");
    $consulta->execute([$nombre]);
    $fila = $consulta->fetch();

    if (!$fila) {
        fallar('No existe ese usuario.', 404);
    }

    $esMio = $actual !== null && $actual['id'] === (int)$fila['usuarioID'];

    responder(['usuario' => [
        'id'     => (int)$fila['usuarioID'],
        'nombre' => $fila['nombreusuario'],
        'correo' => $esMio ? $fila['email'] : '', // el correo solo lo ve su dueño
        'bio'    => $fila['desc'] ?? '',
        'estado' => $fila['estado'] ?? '',
        'foto'   => $fila['foto'] ?? '',
        'union'  => formatearFechaUnion($fila['registro']),
        'esMio'  => $esMio,
    ]]);
}

// Viene de un formulario con archivo (FormData), por eso los datos estan en $entrada = $_POST
// y la foto en $_FILES['foto']. Es el perfil.php de Proyecto pasado a esta API.
function guardarPerfil($pdo, $entrada) {
    $actual = requerirLogin($pdo);

    $nombre = trim($entrada['nombre'] ?? '');
    $correo = trim($entrada['correo'] ?? '');
    $estado = $entrada['estado'] ?? 'Activo';
    $bio    = trim($entrada['bio'] ?? '');

    $errores = validarNombreYCorreo($pdo, $nombre, $correo, $actual['id']);

    if (!in_array($estado, ESTADOS_VALIDOS, true)) {
        $errores['estado'] = 'Elegi un estado de la lista.';
    }
    if (mb_strlen($bio) > 500) {
        $errores['bio'] = 'La descripcion puede tener hasta 500 caracteres.';
    }

    $fotoNueva = null;
    if (isset($_FILES['foto']) && $_FILES['foto']['error'] !== UPLOAD_ERR_NO_FILE) {
        try {
            $fotoNueva = guardarImagenSubida($_FILES['foto'], 'perfiles', 'user_' . $actual['id']);
        } catch (ErrorControlado $e) {
            $errores['foto'] = $e->getMessage();
        }
    }

    if (count($errores) > 0) {
        if ($fotoNueva !== null) {
            borrarImagen('perfiles', $fotoNueva); // no dejamos archivos sueltos si hubo errores
        }
        responder(['ok' => false, 'errores' => $errores]);
    }

    try {
        $consulta = $pdo->prepare("UPDATE usuarios SET nombreusuario = ?, email = ?, estado = ?, `desc` = ? WHERE usuarioID = ?");
        $consulta->execute([$nombre, $correo, $estado, $bio, $actual['id']]);

        if ($fotoNueva !== null) {
            $consultaFoto = $pdo->prepare("UPDATE usuarios SET foto = ? WHERE usuarioID = ?");
            $consultaFoto->execute([$fotoNueva, $actual['id']]);
            borrarImagen('perfiles', $actual['foto']); // borramos la foto vieja
        }
    } catch (PDOException $e) {
        if ($fotoNueva !== null) {
            borrarImagen('perfiles', $fotoNueva);
        }
        if ($e->getCode() == 23000) {
            responder(['ok' => false, 'errores' => ['usuario' => 'Ese nombre o correo ya pertenece a otra cuenta.']]);
        }
        throw $e;
    }

    responder(['usuario' => ['nombre' => $nombre]]);
}

// Las paginas son HTML, asi que lo primero que hacen es preguntar quien inicio sesion.
// Devuelve el usuario (o null) y el codigo secreto CSRF que hay que mandar en los pedidos de administracion.
function verSesion($pdo) {
    responder(['usuario' => datosUsuarioActual($pdo), 'csrf' => tokenCsrf()]);
}



// ADMIN
function adminListar($pdo) {
    requerirAdmin($pdo);
    $filas = $pdo->query("SELECT usuarioID, nombreusuario, email, estado, rol FROM usuarios ORDER BY usuarioID")->fetchAll();
    $lista = [];
    foreach ($filas as $fila) {
        $lista[] = [
            'id'     => (int)$fila['usuarioID'],
            'nombre' => $fila['nombreusuario'],
            'correo' => $fila['email'],
            'estado' => $fila['estado'],
            'rol'    => $fila['rol'],
        ];
    }
    responder(['usuarios' => $lista]);
}


function adminCrear($pdo, $entrada) {
    requerirAdmin($pdo, $entrada);

    $nombre = trim($entrada['usuario'] ?? '');
    $correo = trim($entrada['correo'] ?? '');
    $genero = trim($entrada['genero'] ?? '');
    $estado = trim($entrada['estado'] ?? '');
    $rol    = trim($entrada['rol'] ?? '');
    $clave  = $entrada['clave'] ?? '';
    $clave2 = $entrada['clave2'] ?? '';

    $errores = validarNombreYCorreo($pdo, $nombre, $correo);

    if (!in_array($genero, GENEROS_VALIDOS, true)) {
        $errores['genero'] = 'Elegi una opcion.';
    }
    if (!claveSegura($clave)) {
        $errores['clave'] = 'Minimo 8 caracteres con mayusculas, minusculas, numeros y simbolos.';
    } elseif ($clave !== $clave2) {
        $errores['clave2'] = 'Las contraseñas no coinciden.';
    }
    if (!in_array($estado, ESTADOS_VALIDOS, true)) {
        $errores['estado'] = 'Elegi un estado de la lista.';
    }
    if (!in_array($rol, ['usuario', 'admin'], true)) {
        $errores['rol'] = 'Elegi un rol de la lista.';
    }

    if (count($errores) > 0) {
        responder(['ok' => false, 'errores' => $errores]);
    }

    try {
        // La contraseña NUNCA se guarda tal cual: se guarda su hash
        $consulta = $pdo->prepare(
            "INSERT INTO usuarios (nombreusuario, email, `contraseña`, genero, `desc`, estado, rol)
             VALUES (?, ?, ?, ?, '', ?, ?)"
        );
        $consulta->execute([$nombre, $correo, password_hash($clave, PASSWORD_BCRYPT), $genero, $estado, $rol]);
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) { // clave duplicada (alguien lo creo justo antes)
            responder(['ok' => false, 'errores' => ['usuario' => 'Ese nombre o correo ya esta registrado.']]);
        }
        throw $e;
    }
    responder(['id' => (int)$pdo->lastInsertId()]);
}

function adminGuardar($pdo, $entrada) {
    $yo = requerirAdmin($pdo, $entrada);

    $id     = (int)($entrada['id'] ?? 0);
    $nombre = trim($entrada['nombre'] ?? '');
    $correo = trim($entrada['correo'] ?? '');
    $estado = $entrada['estado'] ?? '';
    $rol    = $entrada['rol'] ?? '';

    if (mb_strlen($nombre) < 1 || mb_strlen($nombre) > 25 || strpos($nombre, ' ') !== false) {
        fallar('El nombre debe tener entre 1 y 25 caracteres, sin espacios.');
    }
    if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
        fallar('El correo no es valido.');
    }
    if (!in_array($estado, ESTADOS_VALIDOS, true) || !in_array($rol, ['usuario', 'admin'], true)) {
        fallar('Estado o rol no validos.');
    }
    if ($id === $yo['id'] && $rol !== 'admin') {
        fallar('No podes sacarte a vos mismo el rol de administrador.');
    }

    try {
        $consulta = $pdo->prepare("UPDATE usuarios SET nombreusuario = ?, email = ?, estado = ?, rol = ? WHERE usuarioID = ?");
        $consulta->execute([$nombre, $correo, $estado, $rol, $id]);
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) {
            fallar('Ese nombre o correo ya pertenece a otra cuenta.');
        }
        throw $e;
    }
    responder();
}


function adminEliminar($pdo, $entrada) {
    $yo = requerirAdmin($pdo, $entrada);
    $id = (int)($entrada['id'] ?? 0);

    if ($id === $yo['id']) {
        fallar('No podes eliminar tu propia cuenta desde el panel.');
    }

    $consulta = $pdo->prepare("SELECT foto FROM usuarios WHERE usuarioID = ?");
    $consulta->execute([$id]);
    $usuarioBorrado = $consulta->fetch();
    if (!$usuarioBorrado) {
        fallar('Ese usuario no existe.', 404);
    }

    $consulta = $pdo->prepare("SELECT imagen FROM publicaciones WHERE usuarioID = ?");
    $consulta->execute([$id]);
    $imagenes = $consulta->fetchAll(PDO::FETCH_COLUMN);

    $consulta = $pdo->prepare("DELETE FROM usuarios WHERE usuarioID = ?");
    $consulta->execute([$id]);

    borrarImagen('perfiles', $usuarioBorrado['foto']);
    foreach ($imagenes as $imagen) {
        borrarImagen('publicaciones', $imagen);
    }
    responder();
}

switch ($accion) {
    case 'sesion':          verSesion($pdo);                break;
    case 'registrar':       registrar($pdo, $entrada);      break;
    case 'entrar':          entrar($pdo, $entrada);         break;
    case 'entrar_rapido':   entrarRapido($pdo, $entrada);   break;
    case 'perfil':          verPerfil($pdo, $entrada);      break;
    case 'guardar_perfil':  guardarPerfil($pdo, $entrada);  break;
    case 'admin_listar':    adminListar($pdo);              break;
    case 'admin_crear':     adminCrear($pdo, $entrada);     break;
    case 'admin_guardar':   adminGuardar($pdo, $entrada);   break;
    case 'admin_eliminar':  adminEliminar($pdo, $entrada);  break;
    case 'salir':
        cerrarSesionPHP();
        responder();
        break;
    default:
        fallar('Accion desconocida.');
}
