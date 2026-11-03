CREATE TABLE `usuarios` (
  `usuarioID` int NOT NULL AUTO_INCREMENT,
  `nombreusuario` varchar(50) NOT NULL,
  `contraseña` varchar(255) NOT NULL,
  `email` varchar(100) NOT NULL,
  `genero` varchar(30) DEFAULT NULL,
  `desc` text DEFAULT NULL,
  `foto` varchar(255) DEFAULT NULL,
  `estado` varchar(20) DEFAULT 'Activo',
  `rol` varchar(10) NOT NULL DEFAULT 'usuario',
  `registro` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`usuarioID`),
  UNIQUE KEY `nombreusuario` (`nombreusuario`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


CREATE TABLE `categoria` (
  `categoriaID` int NOT NULL AUTO_INCREMENT,
  `nombre`      varchar(50) NOT NULL,
  `desc`        text DEFAULT NULL,
  PRIMARY KEY (`categoriaID`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `publicaciones` (
  `publicacionID` int NOT NULL AUTO_INCREMENT,
  `usuarioID`     int NOT NULL,
  `categoriaID`   int NOT NULL,
  `titulo`        varchar(150) NOT NULL,
  `subtitulo`     varchar(120) NOT NULL DEFAULT '',
  `contenido`     text NOT NULL,
  `imagen`        varchar(255) NOT NULL DEFAULT '',
  `vistas`        int NOT NULL DEFAULT 0,
  `megusta`       int NOT NULL DEFAULT 0,
  `nomegusta`     int NOT NULL DEFAULT 0,
  `tendencia`     int NOT NULL DEFAULT 200,   
  `minuscula`     tinyint(1) NOT NULL DEFAULT 0, 
  `fechacreacion` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`publicacionID`),
  KEY `usuarioID` (`usuarioID`),
  KEY `categoriaID` (`categoriaID`),
  CONSTRAINT `publicaciones_ibfk_1` FOREIGN KEY (`usuarioID`)   REFERENCES `usuarios` (`usuarioID`)   ON DELETE CASCADE,
  CONSTRAINT `publicaciones_ibfk_2` FOREIGN KEY (`categoriaID`) REFERENCES `categoria` (`categoriaID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


CREATE TABLE `comentarios` (
  `comentarioID`  int NOT NULL AUTO_INCREMENT,
  `publicacionID` int DEFAULT NULL,
  `perfilID`      int DEFAULT NULL,
  `usuarioID`     int NOT NULL,
  `contenido`     text NOT NULL,
  `fechacreacion` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`comentarioID`),
  KEY `publicacionID` (`publicacionID`),
  KEY `perfilID` (`perfilID`),
  KEY `usuarioID` (`usuarioID`),
  CONSTRAINT `comentarios_ibfk_1` FOREIGN KEY (`publicacionID`) REFERENCES `publicaciones` (`publicacionID`) ON DELETE CASCADE,
  CONSTRAINT `comentarios_ibfk_2` FOREIGN KEY (`usuarioID`)     REFERENCES `usuarios` (`usuarioID`)         ON DELETE CASCADE,
  CONSTRAINT `comentarios_ibfk_3` FOREIGN KEY (`perfilID`)      REFERENCES `usuarios` (`usuarioID`)         ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


CREATE TABLE `like` (
  `likeID`        int NOT NULL AUTO_INCREMENT,
  `usuarioID`     int NOT NULL,
  `publicacionID` int DEFAULT NULL,
  `comentarioID`  int DEFAULT NULL,
  `tipo`          varchar(10) NOT NULL DEFAULT 'arriba',
  `fecha`         datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`likeID`),
  UNIQUE KEY `voto_unico` (`usuarioID`, `publicacionID`),
  KEY `publicacionID` (`publicacionID`),
  KEY `comentarioID` (`comentarioID`),
  CONSTRAINT `like_ibfk_1` FOREIGN KEY (`usuarioID`)     REFERENCES `usuarios` (`usuarioID`)         ON DELETE CASCADE,
  CONSTRAINT `like_ibfk_2` FOREIGN KEY (`publicacionID`) REFERENCES `publicaciones` (`publicacionID`) ON DELETE CASCADE,
  CONSTRAINT `like_ibfk_3` FOREIGN KEY (`comentarioID`)  REFERENCES `comentarios` (`comentarioID`)   ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `repost` (
  `repostID`      int NOT NULL AUTO_INCREMENT,
  `usuarioID`     int NOT NULL,
  `publicacionID` int NOT NULL,
  `fecharepost`   datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`repostID`),
  UNIQUE KEY `repost_unico` (`usuarioID`, `publicacionID`),
  KEY `publicacionID` (`publicacionID`),
  CONSTRAINT `repost_ibfk_1` FOREIGN KEY (`usuarioID`)     REFERENCES `usuarios` (`usuarioID`)         ON DELETE CASCADE,
  CONSTRAINT `repost_ibfk_2` FOREIGN KEY (`publicacionID`) REFERENCES `publicaciones` (`publicacionID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


CREATE TABLE `historialbusqueda` (
  `busquedaID` int NOT NULL AUTO_INCREMENT,
  `usuarioID`  int NOT NULL,
  `busqueda`   varchar(255) NOT NULL,
  `fechahora`  datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`busquedaID`),
  KEY `usuarioID` (`usuarioID`),
  CONSTRAINT `historialbusqueda_ibfk_1` FOREIGN KEY (`usuarioID`) REFERENCES `usuarios` (`usuarioID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


CREATE TABLE `historialreproduccion` (
  `reproduccionID` int NOT NULL AUTO_INCREMENT,
  `publicacionID`  int NOT NULL,
  `usuarioID`      int NOT NULL,
  `fechahora`      datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`reproduccionID`),
  KEY `publicacionID` (`publicacionID`),
  KEY `usuarioID` (`usuarioID`),
  CONSTRAINT `historialreproduccion_ibfk_1` FOREIGN KEY (`publicacionID`) REFERENCES `publicaciones` (`publicacionID`) ON DELETE CASCADE,
  CONSTRAINT `historialreproduccion_ibfk_2` FOREIGN KEY (`usuarioID`)     REFERENCES `usuarios` (`usuarioID`)         ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


CREATE TABLE `reportes` (
  `reporteID`     int NOT NULL AUTO_INCREMENT,
  `usuarioID`     int NOT NULL,
  `reportadoID`   int DEFAULT NULL,
  `tipo`          varchar(255) NOT NULL DEFAULT 'publicacion',
  `publicacionID` int DEFAULT NULL,
  `comentarioID`  int DEFAULT NULL,
  `referencia`    varchar(150) NOT NULL DEFAULT '',
  `motivo`        varchar(100) NOT NULL,
  `desc`          text DEFAULT NULL,
  `estado`        varchar(20) DEFAULT 'Pendiente',
  `fecha`         datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`reporteID`),
  KEY `usuarioID` (`usuarioID`),
  KEY `publicacionID` (`publicacionID`),
  KEY `comentarioID` (`comentarioID`),
  CONSTRAINT `reportes_ibfk_1` FOREIGN KEY (`usuarioID`)     REFERENCES `usuarios` (`usuarioID`)         ON DELETE CASCADE,
  CONSTRAINT `reportes_ibfk_2` FOREIGN KEY (`publicacionID`) REFERENCES `publicaciones` (`publicacionID`) ON DELETE SET NULL,
  CONSTRAINT `reportes_ibfk_3` FOREIGN KEY (`comentarioID`)  REFERENCES `comentarios` (`comentarioID`)   ON DELETE CASCADE,
  CONSTRAINT `reportes_ibfk_4` FOREIGN KEY (`reportadoID`) REFERENCES `usuarios` (`usuarioID`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;



CREATE TABLE `productos` (
  `productoID` int NOT NULL AUTO_INCREMENT,
  `nombre`     varchar(80) NOT NULL,
  `categoria`  varchar(30) NOT NULL,
  `precio`     decimal(8,2) NOT NULL,
  `destacado`  varchar(60) NOT NULL DEFAULT '',
  `fondo`      varchar(10) NOT NULL DEFAULT '#333333',
  `imagen`     varchar(255) NOT NULL DEFAULT '',
  `desarrollador` varchar(80)  NOT NULL DEFAULT '',
  `lanzamiento`   varchar(20)  NOT NULL DEFAULT '',
  `plataformas`   varchar(80)  NOT NULL DEFAULT '',
  `descripcion`   text DEFAULT NULL,
  PRIMARY KEY (`productoID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `carrito` (
  `carritoID`  int NOT NULL AUTO_INCREMENT,
  `usuarioID`  int NOT NULL,
  `productoID` int NOT NULL,
  `cantidad`   int NOT NULL DEFAULT 1,
  PRIMARY KEY (`carritoID`),
  UNIQUE KEY `producto_por_usuario` (`usuarioID`, `productoID`),
  KEY `productoID` (`productoID`),
  CONSTRAINT `carrito_ibfk_1` FOREIGN KEY (`usuarioID`)  REFERENCES `usuarios` (`usuarioID`)   ON DELETE CASCADE,
  CONSTRAINT `carrito_ibfk_2` FOREIGN KEY (`productoID`) REFERENCES `productos` (`productoID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `resenas` (
  `resenaID`      int NOT NULL AUTO_INCREMENT,
  `usuarioID`     int NOT NULL,
  `productoID`    int NOT NULL,
  `estrellas`     tinyint NOT NULL,
  `descripcion`          text DEFAULT NULL,
  `fechacreacion` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`resenaID`),
  UNIQUE KEY `resena_unica` (`usuarioID`, `productoID`),
  KEY `productoID` (`productoID`),
  CONSTRAINT `resena_chk` CHECK (`estrellas` BETWEEN 1 AND 5),
  CONSTRAINT `resenas_ibfk_1` FOREIGN KEY (`usuarioID`)  REFERENCES `usuarios` (`usuarioID`)   ON DELETE CASCADE,
  CONSTRAINT `resenas_ibfk_2` FOREIGN KEY (`productoID`) REFERENCES `productos` (`productoID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


CREATE TABLE `resenautil` (
  `utilID`    int NOT NULL AUTO_INCREMENT,
  `resenaID`  int NOT NULL,
  `usuarioID` int NOT NULL,
  `tipo`      varchar(10) NOT NULL DEFAULT 'util',
  PRIMARY KEY (`utilID`),
  UNIQUE KEY `voto_resena_unico` (`resenaID`, `usuarioID`),
  KEY `usuarioID` (`usuarioID`),
  CONSTRAINT `resenautil_ibfk_1` FOREIGN KEY (`resenaID`)  REFERENCES `resenas` (`resenaID`)   ON DELETE CASCADE,
  CONSTRAINT `resenautil_ibfk_2` FOREIGN KEY (`usuarioID`) REFERENCES `usuarios` (`usuarioID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;



INSERT INTO `usuarios` (`usuarioID`, `nombreusuario`, `contraseña`, `email`, `genero`, `desc`, `estado`, `rol`, `registro`) VALUES
(1, 'messififa14',       '$2y$10$..ELoBKU4ybdxvGELWw6j.CcgYHBTt7A42OBGFEL2t20QFmX2Uktm', 'messififa14@ragedit.com',       'Hombre',               'Soy un usuario de prueba, esto es una descripcion del perfil. Cualquiera puede comentar en mi perfil, claramente siguendo las reglas del Anti-hate. KKKKKKKKKKKKKK', 'Activo', 'usuario', '2025-05-29 12:53:00'),
(2, 'xx_maxgamerpro_xx', '$2y$10$..ELoBKU4ybdxvGELWw6j.CcgYHBTt7A42OBGFEL2t20QFmX2Uktm', 'xx_maxgamerpro_xx@ragedit.com', 'Prefiero no decirlo.', '', 'Activo', 'usuario', '2025-06-02 18:10:00'),
(3, 'eusa31',            '$2y$10$..ELoBKU4ybdxvGELWw6j.CcgYHBTt7A42OBGFEL2t20QFmX2Uktm', 'eusa31@ragedit.com',            'Prefiero no decirlo.', '', 'Activo', 'usuario', '2025-06-10 09:30:00'),
(4, 'fer_13',            '$2y$10$..ELoBKU4ybdxvGELWw6j.CcgYHBTt7A42OBGFEL2t20QFmX2Uktm', 'fer_13@ragedit.com',            'Prefiero no decirlo.', '', 'Activo', 'usuario', '2025-06-15 21:05:00'),
(5, 'heasd-z',           '$2y$10$..ELoBKU4ybdxvGELWw6j.CcgYHBTt7A42OBGFEL2t20QFmX2Uktm', 'heasd-z@ragedit.com',           'Prefiero no decirlo.', '', 'Activo', 'usuario', '2025-07-01 11:45:00'),
(6, 'eaaa_xz1',          '$2y$10$..ELoBKU4ybdxvGELWw6j.CcgYHBTt7A42OBGFEL2t20QFmX2Uktm', 'eaaa_xz1@ragedit.com',          'Prefiero no decirlo.', '', 'Activo', 'usuario', '2025-07-04 16:20:00'),
(7, 'maz_13x',           '$2y$10$..ELoBKU4ybdxvGELWw6j.CcgYHBTt7A42OBGFEL2t20QFmX2Uktm', 'maz_13x@ragedit.com',           'Prefiero no decirlo.', '', 'Activo', 'usuario', '2025-07-20 08:15:00'),
(8, 'avx231-z',          '$2y$10$..ELoBKU4ybdxvGELWw6j.CcgYHBTt7A42OBGFEL2t20QFmX2Uktm', 'avx231-z@ragedit.com',          'Prefiero no decirlo.', '', 'Activo', 'usuario', '2025-08-03 13:00:00'),
(9, 'messififa15',       '$2y$10$..ELoBKU4ybdxvGELWw6j.CcgYHBTt7A42OBGFEL2t20QFmX2Uktm', 'messififa15@ragedit.com',       'Prefiero no decirlo.', '', 'Activo', 'usuario', '2025-08-09 22:40:00'),
(10,'admin',             '$2y$10$NNY4lgkRUowiVW9CT9GBn./5QhP7gvGydWjsTTxENiaU7ovolptdi',   'admin@ragedit.com',             'Prefiero no decirlo.', 'Administrador de Ragedit.', 'Activo', 'admin', '2025-05-01 10:00:00');

INSERT INTO `categoria` (`categoriaID`, `nombre`) VALUES
(1, 'GTA VI'),
(2, 'GTA V'),
(3, 'CS'),
(4, 'Counter-Strike 2'),
(5, 'LEGO: BATMAN'),
(6, 'COD: MODERN WARFARE'),
(7, 'FORNITE'),
(8, 'FIFA 14'),
(9, 'Juego desconocido.');

INSERT INTO `publicaciones`
  (`publicacionID`, `usuarioID`, `categoriaID`, `titulo`, `subtitulo`, `contenido`, `vistas`, `megusta`, `nomegusta`, `tendencia`, `minuscula`, `fechacreacion`) VALUES
(1,  2, 1, 'FILTRACION DE GTA VI', '', '', 741000, 65000, 574, 1, 0, NOW() - INTERVAL 5 DAY),
(2,  3, 3, 'NAVI HUMILLO A VITALITY EN LA IEM ATLANTA 2026', 'SE CUESTIONA EL NIVEL DE LOS FRANCESES',
   CONCAT('Hace 2 semanas aprox NAVI derroto 2 - 1 a Vitality que llevaba invicto 1 año!!!!! Y lo peor de eso es que NAVI termino ganando la IEM.', CHAR(10),
          'El nivel de vitality baja y se acerca el Major de Cologne!', CHAR(10),
          '¿Piensan que mantendran el podio?'),
   501000, 5000, 450, 2, 0, NOW() - INTERVAL 2 DAY),
(3,  4, 5, 'BATMAN ESTA EN LEGO', '', '', 301000, 2000, 234, 3, 0, NOW() - INTERVAL 9 DAY),
(4,  5, 6, 'ANUNCIARON MODERN WARFARE 4 EN 2026!!', '', '', 235000, 6000, 785, 4, 0, NOW() - INTERVAL 12 DAY),
(5,  6, 7, 'MURIO EL JUEGO !!!!', '', '', 401000, 1000, 93, 5, 0, NOW() - INTERVAL 3 DAY),
(6,  7, 1, 'bla bla bla', '', '', 401000, 2000, 574, 6, 1, NOW() - INTERVAL 20 DAY),
(7,  8, 9, 'me llamo tal, vivo en tal ciudad..', '', '', 401000, 2000, 574, 7, 1, NOW() - INTERVAL 25 DAY),
(8,  2, 1, 'bla bla bla', '', '', 401000, 2000, 574, 8, 1, NOW() - INTERVAL 30 DAY),
(9,  1, 1, 'SALIO EL GTA?', 'ES REAL?', 'Debido a los leaks del juego no se si salio o no....', 2000, 0, 2000, 99, 0, NOW() - INTERVAL 1 DAY),
(10, 4, 8, 'MESSI SE RETIRA?', '', '', 90000, 3000, 120, 9, 0, NOW() - INTERVAL 6 DAY);


INSERT INTO `comentarios` (`comentarioID`, `publicacionID`, `perfilID`, `usuarioID`, `contenido`, `fechacreacion`) VALUES
(1, 2, NULL, 7, 'Para mi pierden el major',            NOW() - INTERVAL 2 DAY),
(2, 2, NULL, 3, 'No creo que pierdan el major...',     NOW() - INTERVAL 2 DAY),
(3, 2, NULL, 7, 'Habra que ver',                       NOW() - INTERVAL 2 DAY),
(4, 2, NULL, 8, 'No entiendo',                         NOW() - INTERVAL 1 DAY);


INSERT INTO `comentarios` (`comentarioID`, `publicacionID`, `perfilID`, `usuarioID`, `contenido`, `fechacreacion`) VALUES
(5,  NULL, 1, 2, 'Este tipo es un genio.',                            NOW() - INTERVAL 60 DAY),
(6,  NULL, 1, 3, 'Y el queque que me prometiste?',                    NOW() - INTERVAL 30 DAY),
(7,  NULL, 1, 4, 'CHIQUI TAPIA BOTON',                                NOW() - INTERVAL 7 DAY),
(8,  NULL, 1, 5, 'Este usuario es raro',                              NOW() - INTERVAL 3 DAY),
(9,  NULL, 1, 6, 'Y este random',                                     NOW() - INTERVAL 2 DAY),
(10, NULL, 1, 9, 'Este tipo me esta suplantando. Por favor reportar!!', NOW() - INTERVAL 1 HOUR);

INSERT INTO `repost` (`usuarioID`, `publicacionID`, `fecharepost`) VALUES
(1, 2, NOW() - INTERVAL 1 HOUR);

INSERT INTO `productos` (`productoID`, `nombre`, `categoria`, `precio`, `destacado`, `fondo`, `imagen`) VALUES 
(1,  'GTA V',                'Accion',   29.99, 'Mundo abierto',   '#3a3a3a', 'gtav.png'),
(2,  'Counter-Strike 2',     'Shooter',  14.99, '',                '#2c2c2c', 'cs2.png'),
(3,  'FIFA 14',              'Deportes',  9.99, 'Messi en portada', '#444444', 'fifa14.png'),
(4,  'LEGO Batman',          'Aventura', 12.50, '',                '#333333', 'legobatman.png'),
(5,  'COD: Modern Warfare',  'Shooter',  39.99, '',                '#262626', 'codmodernwarfare.png'),
(6,  'Minecraft',            'Aventura', 26.95, '',                '#4a4a4a', 'minecraft.png'),
(7,  'The Witcher 3',        'RPG',      19.99, '',                '#303030', 'thewitcher3.png'),
(8,  'Elden Ring',           'RPG',      59.99, 'Juego del año',   '#3d3d3d', 'eldenring.png'),
(9,  'Hollow Knight',        'Indie',    14.99, '',                '#2a2a2a', 'hollowknight.png'),
(10, 'Celeste',              'Indie',    19.99, '',                '#474747', 'celeste.png'),
(11, 'Rocket League',        'Deportes', 19.99, '',                '#353535', 'rocketleague.png'),
(12, 'Portal 2',             'Aventura',  9.99, '',                '#2e2e2e', 'portal2.png');

INSERT INTO `resenas` (`usuarioID`, `productoID`, `estrellas`, `descripcion`, `fechacreacion`) VALUES
(1, 1, 5, 'Un clásico, todavía lo sigo jugando. El mundo abierto es enorme.', NOW() - INTERVAL 10 DAY),
(2, 1, 4, 'Muy bueno, pero el online a veces está medio lleno de tramposos.', NOW() - INTERVAL 8 DAY),
(3, 1, 5, 'Lo mejor que jugué en mucho tiempo.', NOW() - INTERVAL 5 DAY),
(1, 2, 4, 'Gratis o barato, no se puede pedir más. Muy competitivo.', NOW() - INTERVAL 9 DAY),
(4, 2, 3, 'Está bien, pero las partidas con desconocidos son agotadoras.', NOW() - INTERVAL 6 DAY),
(5, 2, 5, 'Mi juego favorito, horas y horas con amigos.', NOW() - INTERVAL 4 DAY),
(2, 3, 5, 'Messi en la portada y gran jugabilidad. Nostalgia pura.', NOW() - INTERVAL 7 DAY),
(9, 3, 4, 'Para la época era lo mejor en fútbol.', NOW() - INTERVAL 3 DAY),
(6, 4, 4, 'Muy divertido para jugar en familia.',NOW() - INTERVAL 12 DAY),
(7, 5, 3, 'La campaña es corta pero el multijugador entretiene.', NOW() - INTERVAL 11 DAY),
(8, 6, 5, 'Infinitas horas de diversión, lo recomiendo a cualquiera.', NOW() - INTERVAL 2 DAY),
(3, 7, 5, 'Historia y misiones secundarias increíbles.', NOW() - INTERVAL 1 DAY),
(4, 8, 5, 'Juego del año bien merecido.', NOW() - INTERVAL 15 DAY),
(5, 8, 4, 'Muy difícil, pero vale la pena.', NOW() - INTERVAL 14 DAY),
(6, 9, 5, 'Arte y música hermosos, súper recomendado.', NOW() - INTERVAL 13 DAY),
(7, 12, 5, 'Los puzzles son geniales, humor excelente.', NOW() - INTERVAL 5 DAY);


INSERT INTO `reportes` (`usuarioID`, `tipo`, `publicacionID`, `reportadoID`, `referencia`, `motivo`, `desc`, `estado`, `fecha`) VALUES
(7, 'publicacion', 9,    NULL, 'SALIO EL GTA?',  'Informacion falsa',         'Dice que el juego salio y no es cierto, solo son filtraciones.', 'Pendiente', NOW() - INTERVAL 5 HOUR),
(1, 'usuario',     NULL, 9,    'messififa15',    'Suplantacion de identidad', 'Se hace pasar por mi con un nombre casi igual.',                 'Pendiente', NOW() - INTERVAL 50 MINUTE),
(3, 'publicacion', 6,    NULL, 'bla bla bla',    'Spam',                      '',                                                               'Descartado', NOW() - INTERVAL 3 DAY);

