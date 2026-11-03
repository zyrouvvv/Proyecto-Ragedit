<?php
const MAXIMO_POR_PRODUCTO = 99;

function existeProducto($pdo, $productoID) {
    $consulta = $pdo->prepare("SELECT 1 FROM productos WHERE productoID = ?");
    $consulta->execute([$productoID]);
    return $consulta->fetch() !== false;
}


function leerCarrito($pdo, $usuario) {
    $lista = [];
    if ($usuario !== null) {
        $consulta = $pdo->prepare("SELECT productoID, cantidad FROM carrito WHERE usuarioID = ? ORDER BY carritoID");
        $consulta->execute([$usuario['id']]);
        foreach ($consulta->fetchAll() as $fila) {
            $lista[] = ['id' => (int)$fila['productoID'], 'cantidad' => (int)$fila['cantidad']];
        }
    } else {
        $guardado = $_SESSION['carrito'] ?? [];
        foreach ($guardado as $id => $cantidad) {
            $lista[] = ['id' => (int)$id, 'cantidad' => (int)$cantidad];
        }
    }
    return $lista;
}


function cambiarCantidad($pdo, $usuario, $productoID, $cambio) {
    if ($usuario !== null) {
        $consulta = $pdo->prepare(
            "INSERT INTO carrito (usuarioID, productoID, cantidad) VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE cantidad = LEAST(cantidad + ?, " . MAXIMO_POR_PRODUCTO . ")"
        );

        if ($cambio > 0) {
            $consulta->execute([$usuario['id'], $productoID, $cambio, $cambio]);
        } else {
            $resta = $pdo->prepare("UPDATE carrito SET cantidad = cantidad + ? WHERE usuarioID = ? AND productoID = ?");
            $resta->execute([$cambio, $usuario['id'], $productoID]);
        }
        $limpiar = $pdo->prepare("DELETE FROM carrito WHERE usuarioID = ? AND cantidad <= 0");
        $limpiar->execute([$usuario['id']]);
    } else {
        $actual = $_SESSION['carrito'][$productoID] ?? 0;
        $nueva  = min($actual + $cambio, MAXIMO_POR_PRODUCTO);
        if ($nueva > 0) {
            $_SESSION['carrito'][$productoID] = $nueva;
        } else {
            unset($_SESSION['carrito'][$productoID]);
        }
    }
}

function quitarDelCarrito($pdo, $usuario, $productoID) {
    if ($usuario !== null) {
        $consulta = $pdo->prepare("DELETE FROM carrito WHERE usuarioID = ? AND productoID = ?");
        $consulta->execute([$usuario['id'], $productoID]);
    } else {
        unset($_SESSION['carrito'][$productoID]);
    }
}

function vaciarCarrito($pdo, $usuario) {
    if ($usuario !== null) {
        $consulta = $pdo->prepare("DELETE FROM carrito WHERE usuarioID = ?");
        $consulta->execute([$usuario['id']]);
    } else {
        unset($_SESSION['carrito']);
    }
}

// Se llama justo despues de iniciar sesion o registrarse
function fusionarCarritoSesion($pdo, $usuarioID) {
    if (empty($_SESSION['carrito'])) {
        return;
    }
    foreach ($_SESSION['carrito'] as $productoID => $cantidad) {
        if (!existeProducto($pdo, $productoID)) {
            continue;
        }
        $consulta = $pdo->prepare(
            "INSERT INTO carrito (usuarioID, productoID, cantidad) VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE cantidad = LEAST(cantidad + ?, " . MAXIMO_POR_PRODUCTO . ")"
        );
        $consulta->execute([$usuarioID, $productoID, $cantidad, $cantidad]);
    }
    unset($_SESSION['carrito']);
}
