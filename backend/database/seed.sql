-- Datos iniciales para desarrollo y pruebas de la app móvil
USE lote_db;

-- País
INSERT IGNORE INTO paises (numero, nombre, nombreCorto, capital, nacionalidad, idiomas)
VALUES (32, 'Argentina', 'AR', 'Buenos Aires', 'Argentina', 'Español');

-- Empleado verificador / revisor
INSERT IGNORE INTO personas (identificador, documento, nombre, apellido, direccion, estado)
VALUES (1, '20000001', 'Ana', 'Verificadora', 'Av. Corrientes 1000', 'activo');

INSERT IGNORE INTO empleados (identificador, cargo)
VALUES (1, 'Verificador KYC');

INSERT IGNORE INTO sectores (identificador, nombreSector, codigoSector, responsableSector)
VALUES (1, 'Verificación', 'VER', 1);

-- Subastador
INSERT IGNORE INTO personas (identificador, documento, nombre, apellido, direccion, estado)
VALUES (2, '20000002', 'Carlos', 'Rematador', 'Av. Santa Fe 2000', 'activo');

INSERT IGNORE INTO subastadores (identificador, matricula, region)
VALUES (2, 'MAT-001', 'CABA');

-- Dueño de piezas de demo
INSERT IGNORE INTO personas (identificador, documento, nombre, apellido, direccion, estado)
VALUES (3, '30000003', 'María', 'Coleccionista', 'Palermo, CABA', 'activo');

INSERT IGNORE INTO duenios (identificador, numeroPais, verificacionFinanciera, verificacionJudicial, calificacionRiesgo, verificador)
VALUES (3, 32, 'si', 'si', 2, 1);

-- Seguro demo
INSERT IGNORE INTO seguros (nroPoliza, compania, polizaCombinada, importe)
VALUES ('POL-DEMO-001', 'Seguros Loté', 'no', 50000.00);

-- Subastas abiertas (fechas futuras)
INSERT IGNORE INTO subastas (
  identificador, nombre, fecha, hora, estado, subastador, ubicacion,
  capacidadAsistentes, tieneDeposito, seguridadPropia, categoria, moneda,
  streaming_url, fecha_cierre
) VALUES
(1, 'Subasta Plata — Arte & Antigüedades', DATE_ADD(CURDATE(), INTERVAL 15 DAY), '18:00:00', 'abierta', 2,
 'Salón Loté, Av. Alvear 1200', 120, 'si', 'si', 'plata', 'ARS',
 'https://www.youtube.com/watch?v=live', DATE_ADD(NOW(), INTERVAL 45 MINUTE)),
(2, 'Subasta Oro — Coleccionables', DATE_ADD(CURDATE(), INTERVAL 20 DAY), '20:00:00', 'abierta', 2,
 'Salón Loté, Av. Alvear 1200', 80, 'si', 'si', 'oro', 'USD',
 'https://www.youtube.com/watch?v=live', DATE_ADD(NOW(), INTERVAL 90 MINUTE)),
(3, 'Subasta Común — Objetos varios', DATE_ADD(CURDATE(), INTERVAL 12 DAY), '17:00:00', 'abierta', 2,
 'Depósito Norte, Vicente López', 60, 'si', 'no', 'comun', 'ARS',
 NULL, DATE_ADD(NOW(), INTERVAL 30 MINUTE));

-- Productos y catálogos
INSERT IGNORE INTO productos (
  identificador, titulo, fecha, disponible, descripcionCatalogo, descripcionCompleta,
  revisor, duenio, seguro, estado_solicitud, declaracion_legal
) VALUES
(1, 'Jarra de plata colonial', CURDATE(), 'si', 'Jarra de plata repujada siglo XIX',
 'Jarra de plata con marcas de platero. Estado conservado.', 1, 3, 'POL-DEMO-001', 'aceptado', 1),
(2, 'Reloj de pared art déco', CURDATE(), 'si', 'Reloj pendular francés',
 'Reloj de pared art déco con caja de nogal y esfera original.', 1, 3, NULL, 'aceptado', 1),
(3, 'Set de té inglesa', CURDATE(), 'si', 'Juego de té de 18 piezas',
 'Porcelana inglesa con detalles dorados. Completo.', 1, 3, NULL, 'aceptado', 1);

INSERT IGNORE INTO catalogos (identificador, descripcion, subasta, responsable)
VALUES
(1, 'Catálogo Subasta Plata', 1, 1),
(2, 'Catálogo Subasta Oro', 2, 1);

INSERT IGNORE INTO itemsCatalogo (identificador, catalogo, producto, precioBase, comision, subastado)
VALUES
(1, 1, 1, 10000.00, 1000.00, 'no'),
(2, 1, 2, 25000.00, 2500.00, 'no'),
(3, 2, 3, 5000.00, 500.00, 'no');

UPDATE subastas SET pieza_actual_id = 1 WHERE identificador = 1;
UPDATE subastas SET pieza_actual_id = 3 WHERE identificador = 2;

-- Catálogo subasta común (#3)
INSERT IGNORE INTO productos (
  identificador, titulo, fecha, disponible, descripcionCatalogo, descripcionCompleta,
  revisor, duenio, seguro, estado_solicitud, declaracion_legal
) VALUES
(4, 'Lámpara de mesa vintage', CURDATE(), 'si', 'Lámpara de bronce con pantalla de tela',
 'Lámpara de mesa años 40 en buen estado de conservación.', 1, 3, NULL, 'aceptado', 1);

INSERT IGNORE INTO catalogos (identificador, descripcion, subasta, responsable)
VALUES (3, 'Catálogo Subasta Común', 3, 1);

INSERT IGNORE INTO itemsCatalogo (identificador, catalogo, producto, precioBase, comision, subastado)
VALUES (4, 3, 4, 3500.00, 350.00, 'no');

UPDATE subastas SET pieza_actual_id = 4 WHERE identificador = 3;

-- ── Usuarios demo (contraseña: Demo1234!) ─────────────────────
-- Empleado verificador vinculado a personas/empleados (id 1)
INSERT IGNORE INTO personas (identificador, documento, nombre, apellido, direccion, estado)
VALUES (20, '20123456', 'Lucía', 'Pendiente', 'Caballito, CABA', 'activo');

INSERT IGNORE INTO clientes (identificador, numeroPais, admitido, categoria, verificador)
VALUES (20, 32, 'no', 'comun', 1);

INSERT IGNORE INTO documentos_cliente (cliente_id, tipo, ruta) VALUES
(20, 'dni_frente', 'uploads/dni/demo-frente.jpg'),
(20, 'dni_dorso', 'uploads/dni/demo-dorso.jpg');

INSERT IGNORE INTO usuarios_app (id, email, password, cliente_id, status)
VALUES (2, 'pendiente@lote.app', '$2a$12$1mrqzfqVZziK/hsVSO8VJO.vDAJa0qlDRjiwcdJMCOOS/lFJnw3qq', 20, 'verified');

INSERT IGNORE INTO personas (identificador, documento, nombre, apellido, direccion, estado)
VALUES (21, '20987654', 'Pedro', 'Postor', 'Villa Crespo, CABA', 'activo');

INSERT IGNORE INTO clientes (identificador, numeroPais, admitido, categoria, verificador)
VALUES (21, 32, 'si', 'plata', 1);

INSERT IGNORE INTO usuarios_app (id, email, password, cliente_id, status)
VALUES (3, 'postor@lote.app', '$2a$12$1mrqzfqVZziK/hsVSO8VJO.vDAJa0qlDRjiwcdJMCOOS/lFJnw3qq', 21, 'verified');

INSERT IGNORE INTO medios_pago (id, usuario_id, tipo, label, currency, card_brand, card_last4, verificado, is_active)
VALUES (1, 3, 'credit_card', 'Visa ****4242', 'ARS', 'Visa', '4242', 1, 1);

UPDATE usuarios_app SET medio_pago_default_id = 1 WHERE id = 3;

-- Cheque certificado pendiente de verificación presencial (TPO)
INSERT IGNORE INTO medios_pago (id, usuario_id, tipo, label, currency, monto_reservado, verificado, is_active)
VALUES (2, 3, 'certified_check', 'Cheque certificado ARS 50000', 'ARS', 50000.00, 0, 1);

-- Artículo en revisión para panel admin
INSERT IGNORE INTO productos (
  identificador, titulo, fecha, disponible, descripcionCatalogo, descripcionCompleta,
  historia, revisor, duenio, estado_solicitud, declaracion_legal
) VALUES
(5, 'Candelabro de cristal', CURDATE(), 'no', 'Candelabro de cristal tallado',
 'Candelabro de cristal con cinco brazos, origen europeo.',
 'Pieza de herencia familiar.', 1, 3, 'en_revision', 1);

-- Empresa compradora (TPO: compra al precio base si no hay pujas)
INSERT IGNORE INTO personas (identificador, documento, nombre, apellido, direccion, estado)
VALUES (99, '30999999999', 'Loté', 'SA', 'Av. Alvear 1200', 'activo');

INSERT IGNORE INTO clientes (identificador, numeroPais, admitido, categoria, verificador)
VALUES (99, 32, 'si', 'platino', 1);

-- Puja inicial demo en subasta 1
INSERT IGNORE INTO personas (identificador, documento, nombre, apellido, direccion, estado)
VALUES (10, '40000010', 'Juan', 'Postor', 'Belgrano, CABA', 'activo');

INSERT IGNORE INTO clientes (identificador, numeroPais, admitido, categoria, verificador)
VALUES (10, 32, 'si', 'plata', 1);

INSERT IGNORE INTO asistentes (identificador, numeroPostor, cliente, subasta, conectado)
VALUES (1, 101, 10, 1, 0);

INSERT IGNORE INTO pujos (identificador, asistente, item, importe, ganador)
VALUES (1, 1, 1, 12000.00, 'no');

-- Fotos fijas de demo (archivos en backend/uploads/demo/, copiados desde mobile/assets)
INSERT IGNORE INTO fotos (identificador, producto, ruta, orden) VALUES
(1, 1, 'uploads/demo/auction-1.webp', 1),
(2, 1, 'uploads/demo/auction-2.webp', 2),
(3, 2, 'uploads/demo/auction-2.webp', 1),
(4, 2, 'uploads/demo/auction-3.webp', 2),
(5, 3, 'uploads/demo/auction-3.webp', 1),
(6, 3, 'uploads/demo/auction-5.webp', 2),
(7, 4, 'uploads/demo/auction-4.webp', 1),
(8, 4, 'uploads/demo/auction-5.webp', 2);
