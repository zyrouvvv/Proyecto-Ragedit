<?php
// Numeros para la franja de estadisticas de foros.html (es publico, no hace falta iniciar sesion)

require_once __DIR__ . '/../includes/api.php';

switch ($accion) {
    case 'resumen':
        // Una sola consulta con 4 conteos
        $fila = $pdo->query(
            "SELECT
                (SELECT COUNT(*) FROM usuarios) AS usuarios,
                (SELECT COUNT(*) FROM publicaciones) AS publicaciones,
                -- una comunidad esta activa si tiene al menos una publicacion
                (SELECT COUNT(DISTINCT categoriaID) FROM publicaciones) AS comunidades,
                -- solo comentarios de publicaciones (los del perfil de un usuario no cuentan)
                (SELECT COUNT(*) FROM comentarios WHERE publicacionID IS NOT NULL) AS comentarios"
        )->fetch();

        responder([
            'usuarios'      => (int)$fila['usuarios'],
            'publicaciones' => (int)$fila['publicaciones'],
            'comunidades'   => (int)$fila['comunidades'],
            'comentarios'   => (int)$fila['comentarios'],
        ]);
        break;

    default:
        fallar('Accion desconocida.');
}
