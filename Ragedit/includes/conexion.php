<?php


$servidor  = "localhost";
$baseDatos = "ragedit";
$usuarioBD = "root";
$claveBD   = "";

// En true se ve el error real cuando algo falla. Para la entrega final conviene ponerlo en false.
define("MODO_DEPURACION", true);

try {
    $pdo = new PDO("mysql:host=$servidor;dbname=$baseDatos;charset=utf8mb4", $usuarioBD, $claveBD);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    // Hora de Argentina, asi la base de datos y PHP cuentan la misma hora
    $pdo->exec("SET time_zone = '-03:00'");
} catch (PDOException $e) {
    $mensaje = "No se pudo conectar a la base de datos. Revisa que MySQL este prendido y que importaste db/ragedit.sql";
    if (MODO_DEPURACION) {
        $mensaje .= " (" . $e->getMessage() . ")";
    }
    if (defined("ES_API")) {

        http_response_code(500);
        header("Content-Type: application/json; charset=utf-8");
        echo json_encode(["ok" => false, "error" => $mensaje], JSON_UNESCAPED_UNICODE);
        exit;
    }
    http_response_code(500);
    die($mensaje);
}
