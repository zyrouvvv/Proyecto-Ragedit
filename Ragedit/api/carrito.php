<?php
// api/carrito.php
// Todo lo del carrito de compras: listar, agregar, sumar/restar, eliminar, vaciar y comprar.
// Funciona con o sin sesion (ver carrito_funciones.php).

require_once __DIR__ . '/../includes/api.php';
require_once __DIR__ . '/../includes/carrito_funciones.php';

$usuario    = datosUsuarioActual($pdo); // null si es un visitante
$productoID = (int)($entrada['id'] ?? 0);

switch ($accion) {
    case 'listar':
        responder(['carrito' => leerCarrito($pdo, $usuario)]);
        break;

    case 'agregar':
        if (!existeProducto($pdo, $productoID)) {
            fallar('Ese juego no existe.', 404);
        }
        cambiarCantidad($pdo, $usuario, $productoID, 1);
        responder();
        break;

    case 'cambiar': // suma o resta una unidad (cambio = 1 o -1)
        $cambio = ((int)($entrada['cambio'] ?? 1)) < 0 ? -1 : 1;
        cambiarCantidad($pdo, $usuario, $productoID, $cambio);
        responder();
        break;

    case 'eliminar':
        quitarDelCarrito($pdo, $usuario, $productoID);
        responder();
        break;

    case 'vaciar':
        vaciarCarrito($pdo, $usuario);
        responder();
        break;

    case 'comprar':
        // Para comprar si o si hay que tener sesion. La compra sigue siendo simulada
        // (no hay pago real), pero el total lo calcula el servidor con los precios de la base de datos.
        $usuario = requerirLogin($pdo);
        $lista = leerCarrito($pdo, $usuario);
        if (count($lista) == 0) {
            fallar('Tu carrito esta vacio.');
        }

        $total = 0;
        $consulta = $pdo->prepare("SELECT precio FROM productos WHERE productoID = ?");
        foreach ($lista as $item) {
            $consulta->execute([$item['id']]);
            $fila = $consulta->fetch();
            if ($fila) {
                $total += (float)$fila['precio'] * $item['cantidad'];
            }
        }

        vaciarCarrito($pdo, $usuario);
        responder(['total' => round($total, 2), 'nombre' => $usuario['nombre']]);
        break;

    default:
        fallar('Accion desconocida.');
}
