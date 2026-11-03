<?php


require_once __DIR__ . '/../includes/api.php';

$equipo = require __DIR__ . '/../includes/equipo.php';

switch ($accion) {
    case 'listar':
        $lista = [];
        foreach ($equipo as $numero => $integrante) {
            // La foto es opcional: si el archivo no existe se manda vacia y la pagina muestra la inicial
            $foto = '';
            if ($integrante['foto'] !== '' && is_file(CARPETA_IMAGENES . 'equipo/' . basename($integrante['foto']))) {
                $foto = basename($integrante['foto']);
            }

            $lista[] = [
                'id'      => (int)$numero,
                'nombre'  => $integrante['nombre'],
                'rol'     => $integrante['rol'],
                'resumen' => $integrante['resumen'],
                'foto'    => $foto,
            ];
        }
        responder(['equipo' => $lista]);
        break;

    case 'ver':
        $numero = (int)($entrada['id'] ?? 0);
        if (!isset($equipo[$numero])) {
            fallar('Integrante no encontrado.', 404);
        }
        $integrante = $equipo[$numero];

        // La foto es opcional: si el archivo no existe se manda vacia y la pagina muestra la inicial
        $foto = '';
        if ($integrante['foto'] !== '' && is_file(CARPETA_IMAGENES . 'equipo/' . basename($integrante['foto']))) {
            $foto = basename($integrante['foto']);
        }

        // Solo se mandan los enlaces que tienen una direccion http o https (nunca "javascript:...")
        $enlaces = [];
        foreach ($integrante['enlaces'] as $nombreEnlace => $direccion) {
            if (preg_match('#^https?://#i', $direccion)) {
                $enlaces[] = ['nombre' => $nombreEnlace, 'url' => $direccion];
            }
        }

        responder(['integrante' => [
            'id'        => $numero,
            'nombre'    => $integrante['nombre'],
            'rol'       => $integrante['rol'],
            'sobreMi'   => $integrante['sobre_mi'],
            'intereses' => $integrante['intereses'],
            'foto'      => $foto,
            'enlaces'   => $enlaces,
        ]]);
        break;

    default:
        fallar('Accion desconocida.');
}