-- ============================================================
--  Loté – Schema MySQL (basado en EstructuraActual.sql + extensiones móvil)
--  Ejecutar con: npm run setup:db  (recrea la base desde cero)
-- ============================================================

DROP DATABASE IF EXISTS lote_db;

CREATE DATABASE lote_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE lote_db;

-- ── Dominio académico (EstructuraActual.sql) ─────────────────

CREATE TABLE IF NOT EXISTS paises (
  numero        INT NOT NULL,
  nombre        VARCHAR(250) NOT NULL,
  nombreCorto   VARCHAR(250) NULL,
  capital       VARCHAR(250) NOT NULL,
  nacionalidad  VARCHAR(250) NOT NULL,
  idiomas       VARCHAR(150) NOT NULL,
  PRIMARY KEY (numero)
);

CREATE TABLE IF NOT EXISTS personas (
  identificador INT NOT NULL AUTO_INCREMENT,
  documento     VARCHAR(20) NOT NULL,
  nombre        VARCHAR(150) NOT NULL,
  apellido      VARCHAR(150) NULL,
  direccion     VARCHAR(250) NULL,
  estado        VARCHAR(15) DEFAULT 'activo',
  foto          LONGBLOB NULL,
  PRIMARY KEY (identificador),
  CONSTRAINT chk_personas_estado CHECK (estado IN ('activo', 'incativo'))
);

CREATE TABLE IF NOT EXISTS empleados (
  identificador INT NOT NULL,
  cargo         VARCHAR(100) NULL,
  sector        INT NULL,
  PRIMARY KEY (identificador),
  CONSTRAINT fk_empleados_personas FOREIGN KEY (identificador) REFERENCES personas (identificador)
);

CREATE TABLE IF NOT EXISTS sectores (
  identificador      INT NOT NULL AUTO_INCREMENT,
  nombreSector       VARCHAR(150) NOT NULL,
  codigoSector       VARCHAR(10) NULL,
  responsableSector  INT NULL,
  PRIMARY KEY (identificador),
  CONSTRAINT fk_sectores_empleados FOREIGN KEY (responsableSector) REFERENCES empleados (identificador)
);

CREATE TABLE IF NOT EXISTS seguros (
  nroPoliza        VARCHAR(30) NOT NULL,
  compania         VARCHAR(150) NOT NULL,
  polizaCombinada  VARCHAR(2) NULL,
  importe          DECIMAL(18,2) NOT NULL,
  PRIMARY KEY (nroPoliza),
  CONSTRAINT chk_seguros_polizaCombinada CHECK (polizaCombinada IN ('si', 'no')),
  CONSTRAINT chk_seguros_importe CHECK (importe > 0)
);

CREATE TABLE IF NOT EXISTS clientes (
  identificador INT NOT NULL,
  numeroPais    INT NULL,
  admitido      VARCHAR(2) DEFAULT 'no',
  categoria     VARCHAR(10) DEFAULT 'comun',
  verificador   INT NOT NULL,
  PRIMARY KEY (identificador),
  CONSTRAINT fk_clientes_personas FOREIGN KEY (identificador) REFERENCES personas (identificador),
  CONSTRAINT fk_clientes_empleados FOREIGN KEY (verificador) REFERENCES empleados (identificador),
  CONSTRAINT fk_clientes_paises FOREIGN KEY (numeroPais) REFERENCES paises (numero),
  CONSTRAINT chk_clientes_admitido CHECK (admitido IN ('si', 'no')),
  CONSTRAINT chk_clientes_categoria CHECK (categoria IN ('comun', 'especial', 'plata', 'oro', 'platino'))
);

CREATE TABLE IF NOT EXISTS duenios (
  identificador             INT NOT NULL,
  numeroPais                INT NULL,
  verificacionFinanciera    VARCHAR(2) DEFAULT 'no',
  verificacionJudicial      VARCHAR(2) DEFAULT 'no',
  calificacionRiesgo        INT NULL,
  verificador               INT NOT NULL,
  PRIMARY KEY (identificador),
  CONSTRAINT fk_duenios_personas FOREIGN KEY (identificador) REFERENCES personas (identificador),
  CONSTRAINT fk_duenios_empleados FOREIGN KEY (verificador) REFERENCES empleados (identificador),
  CONSTRAINT chk_duenios_vf CHECK (verificacionFinanciera IN ('si', 'no')),
  CONSTRAINT chk_duenios_vj CHECK (verificacionJudicial IN ('si', 'no')),
  CONSTRAINT chk_duenios_cr CHECK (calificacionRiesgo IS NULL OR calificacionRiesgo BETWEEN 1 AND 6)
);

CREATE TABLE IF NOT EXISTS subastadores (
  identificador INT NOT NULL,
  matricula     VARCHAR(15) NULL,
  region        VARCHAR(50) NULL,
  PRIMARY KEY (identificador),
  CONSTRAINT fk_subastadores_personas FOREIGN KEY (identificador) REFERENCES personas (identificador)
);

CREATE TABLE IF NOT EXISTS subastas (
  identificador        INT NOT NULL AUTO_INCREMENT,
  nombre               VARCHAR(250) NULL,
  fecha                DATE NOT NULL,
  hora                 TIME NOT NULL,
  estado               VARCHAR(10) DEFAULT 'abierta',
  subastador           INT NULL,
  ubicacion            VARCHAR(350) NULL,
  capacidadAsistentes  INT NULL,
  tieneDeposito        VARCHAR(2) DEFAULT 'no',
  seguridadPropia      VARCHAR(2) DEFAULT 'no',
  categoria            VARCHAR(10) NOT NULL DEFAULT 'comun',
  moneda               ENUM('ARS', 'USD') NOT NULL DEFAULT 'ARS',
  streaming_url        VARCHAR(500) NULL,
  pieza_actual_id      INT NULL,
  fecha_cierre         DATETIME NULL,
  PRIMARY KEY (identificador),
  CONSTRAINT fk_subastas_subastadores FOREIGN KEY (subastador) REFERENCES subastadores (identificador),
  CONSTRAINT chk_subastas_estado CHECK (estado IN ('abierta', 'cerrada')),
  CONSTRAINT chk_subastas_td CHECK (tieneDeposito IN ('si', 'no')),
  CONSTRAINT chk_subastas_sp CHECK (seguridadPropia IN ('si', 'no')),
  CONSTRAINT chk_subastas_categoria CHECK (categoria IN ('comun', 'especial', 'plata', 'oro', 'platino'))
);

CREATE TABLE IF NOT EXISTS productos (
  identificador         INT NOT NULL AUTO_INCREMENT,
  titulo                VARCHAR(250) NULL,
  fecha                 DATE NULL,
  disponible            VARCHAR(2) DEFAULT 'si',
  descripcionCatalogo     VARCHAR(500) NULL DEFAULT 'No Posee',
  descripcionCompleta   VARCHAR(300) NOT NULL,
  historia              TEXT NULL,
  datos_relevantes      TEXT NULL,
  estado_solicitud      ENUM('en_revision', 'aceptado', 'rechazado') DEFAULT 'en_revision',
  motivo_rechazo        VARCHAR(500) NULL,
  declaracion_legal     TINYINT(1) NOT NULL DEFAULT 0,
  revisor               INT NOT NULL,
  duenio                INT NOT NULL,
  seguro                VARCHAR(30) NULL,
  subasta_asignada_id   INT NULL,
  deposito_ubicacion    VARCHAR(350) NULL,
  PRIMARY KEY (identificador),
  CONSTRAINT fk_productos_empleados FOREIGN KEY (revisor) REFERENCES empleados (identificador),
  CONSTRAINT fk_productos_duenios FOREIGN KEY (duenio) REFERENCES duenios (identificador),
  CONSTRAINT fk_productos_seguros FOREIGN KEY (seguro) REFERENCES seguros (nroPoliza),
  CONSTRAINT fk_productos_subastas FOREIGN KEY (subasta_asignada_id) REFERENCES subastas (identificador),
  CONSTRAINT chk_productos_disponible CHECK (disponible IN ('si', 'no'))
);

CREATE TABLE IF NOT EXISTS fotos (
  identificador INT NOT NULL AUTO_INCREMENT,
  producto      INT NOT NULL,
  foto          LONGBLOB NULL,
  ruta          VARCHAR(512) NULL,
  orden         TINYINT UNSIGNED NOT NULL DEFAULT 1,
  PRIMARY KEY (identificador),
  CONSTRAINT fk_fotos_productos FOREIGN KEY (producto) REFERENCES productos (identificador)
);

CREATE TABLE IF NOT EXISTS catalogos (
  identificador INT NOT NULL AUTO_INCREMENT,
  descripcion   VARCHAR(250) NOT NULL,
  subasta       INT NULL,
  responsable   INT NOT NULL,
  PRIMARY KEY (identificador),
  CONSTRAINT fk_catalogos_empleados FOREIGN KEY (responsable) REFERENCES empleados (identificador),
  CONSTRAINT fk_catalogos_subastas FOREIGN KEY (subasta) REFERENCES subastas (identificador)
);

CREATE TABLE IF NOT EXISTS itemsCatalogo (
  identificador INT NOT NULL AUTO_INCREMENT,
  catalogo      INT NOT NULL,
  producto      INT NOT NULL,
  precioBase    DECIMAL(18,2) NOT NULL,
  comision      DECIMAL(18,2) NOT NULL,
  subastado     VARCHAR(2) DEFAULT 'no',
  PRIMARY KEY (identificador),
  CONSTRAINT fk_itemsCatalogo_catalogos FOREIGN KEY (catalogo) REFERENCES catalogos (identificador),
  CONSTRAINT fk_itemsCatalogo_productos FOREIGN KEY (producto) REFERENCES productos (identificador),
  CONSTRAINT chk_itemsCatalogo_pb CHECK (precioBase > 0.01),
  CONSTRAINT chk_itemsCatalogo_c CHECK (comision > 0.01),
  CONSTRAINT chk_itemsCatalogo_s CHECK (subastado IN ('si', 'no'))
);

ALTER TABLE subastas
  ADD CONSTRAINT fk_subastas_pieza_actual
  FOREIGN KEY (pieza_actual_id) REFERENCES itemsCatalogo (identificador);

CREATE TABLE IF NOT EXISTS asistentes (
  identificador   INT NOT NULL AUTO_INCREMENT,
  numeroPostor    INT NOT NULL,
  cliente         INT NOT NULL,
  subasta         INT NOT NULL,
  conectado       TINYINT(1) NOT NULL DEFAULT 0,
  conectado_desde DATETIME NULL,
  PRIMARY KEY (identificador),
  CONSTRAINT fk_asistentes_clientes FOREIGN KEY (cliente) REFERENCES clientes (identificador),
  CONSTRAINT fk_asistentes_subasta FOREIGN KEY (subasta) REFERENCES subastas (identificador),
  UNIQUE KEY uk_asistente_cliente_subasta (cliente, subasta)
);

CREATE TABLE IF NOT EXISTS pujos (
  identificador INT NOT NULL AUTO_INCREMENT,
  asistente     INT NOT NULL,
  item          INT NOT NULL,
  importe       DECIMAL(18,2) NOT NULL,
  ganador       VARCHAR(2) DEFAULT 'no',
  creado_en     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (identificador),
  CONSTRAINT fk_pujos_asistentes FOREIGN KEY (asistente) REFERENCES asistentes (identificador),
  CONSTRAINT fk_pujos_itemsCatalogo FOREIGN KEY (item) REFERENCES itemsCatalogo (identificador),
  CONSTRAINT chk_pujos_importe CHECK (importe > 0.01),
  CONSTRAINT chk_pujos_ganador CHECK (ganador IN ('si', 'no'))
);

CREATE TABLE IF NOT EXISTS registroDeSubasta (
  identificador INT NOT NULL AUTO_INCREMENT,
  subasta       INT NOT NULL,
  duenio        INT NOT NULL,
  producto      INT NOT NULL,
  cliente       INT NOT NULL,
  importe       DECIMAL(18,2) NOT NULL,
  comision      DECIMAL(18,2) NOT NULL,
  medio_pago_id INT NULL,
  metodo_entrega ENUM('envio', 'retiro') NULL,
  estado_entrega ENUM('pendiente', 'en_camino', 'entregado', 'retirado') DEFAULT 'pendiente',
  direccion_entrega VARCHAR(350) NULL,
  pagado            TINYINT(1) NOT NULL DEFAULT 0,
  fecha_limite_pago DATETIME NULL,
  PRIMARY KEY (identificador),
  CONSTRAINT fk_registro_subastas FOREIGN KEY (subasta) REFERENCES subastas (identificador),
  CONSTRAINT fk_registro_duenios FOREIGN KEY (duenio) REFERENCES duenios (identificador),
  CONSTRAINT fk_registro_producto FOREIGN KEY (producto) REFERENCES productos (identificador),
  CONSTRAINT fk_registro_cliente FOREIGN KEY (cliente) REFERENCES clientes (identificador),
  CONSTRAINT chk_registro_importe CHECK (importe > 0.01),
  CONSTRAINT chk_registro_comision CHECK (comision > 0.01)
);

-- ── Extensiones app móvil (auth, pagos, multas) ───────────────

CREATE TABLE IF NOT EXISTS usuarios_app (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  email           VARCHAR(255) NOT NULL,
  password        VARCHAR(255) NOT NULL,
  cliente_id      INT NULL,
  status          ENUM('pending', 'verified', 'suspended', 'blocked') NOT NULL DEFAULT 'pending',
  medio_pago_default_id INT UNSIGNED NULL,
  notificaciones  TINYINT(1) NOT NULL DEFAULT 1,
  foto_perfil     VARCHAR(512) NULL,
  cuenta_cobro    VARCHAR(100) NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_usuarios_email (email),
  CONSTRAINT fk_usuarios_cliente FOREIGN KEY (cliente_id) REFERENCES clientes (identificador)
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     INT UNSIGNED NOT NULL,
  token       VARCHAR(512) NOT NULL,
  expires_at  DATETIME NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_refresh_token (token),
  CONSTRAINT fk_refresh_usuario FOREIGN KEY (user_id) REFERENCES usuarios_app (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS documentos_cliente (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  cliente_id  INT NOT NULL,
  tipo        ENUM('dni_frente', 'dni_dorso') NOT NULL,
  ruta        VARCHAR(512) NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_doc_cliente_tipo (cliente_id, tipo),
  CONSTRAINT fk_documentos_cliente FOREIGN KEY (cliente_id) REFERENCES clientes (identificador)
);

CREATE TABLE IF NOT EXISTS medios_pago (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id      INT UNSIGNED NOT NULL,
  tipo            ENUM('credit_card', 'bank_account', 'certified_check') NOT NULL,
  label           VARCHAR(100) NULL,
  currency        ENUM('ARS', 'USD') NOT NULL DEFAULT 'ARS',
  card_brand      VARCHAR(20) NULL,
  card_last4      CHAR(4) NULL,
  bank_name       VARCHAR(100) NULL,
  account_number  VARCHAR(50) NULL,
  monto_reservado DECIMAL(18,2) NULL,
  verificado      TINYINT(1) NOT NULL DEFAULT 0,
  is_active       TINYINT(1) NOT NULL DEFAULT 1,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_medios_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios_app (id) ON DELETE CASCADE
);

ALTER TABLE registroDeSubasta
  ADD CONSTRAINT fk_registro_medio_pago
  FOREIGN KEY (medio_pago_id) REFERENCES medios_pago (id);

ALTER TABLE usuarios_app
  ADD COLUMN foto_perfil VARCHAR(512) NULL;

ALTER TABLE usuarios_app
  ADD CONSTRAINT fk_usuario_medio_default
  FOREIGN KEY (medio_pago_default_id) REFERENCES medios_pago (id);

CREATE TABLE IF NOT EXISTS multas (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  cliente_id      INT NOT NULL,
  monto           DECIMAL(18,2) NOT NULL,
  descripcion     VARCHAR(500) NOT NULL,
  fecha_limite    DATE NOT NULL,
  pagada          TINYINT(1) NOT NULL DEFAULT 0,
  registro_id     INT NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_multas_cliente FOREIGN KEY (cliente_id) REFERENCES clientes (identificador),
  CONSTRAINT fk_multas_registro FOREIGN KEY (registro_id) REFERENCES registroDeSubasta (identificador),
  CONSTRAINT chk_multas_monto CHECK (monto > 0)
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     INT UNSIGNED NOT NULL,
  token       VARCHAR(128) NOT NULL,
  expires_at  DATETIME NOT NULL,
  used        TINYINT(1) NOT NULL DEFAULT 0,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_reset_token (token),
  CONSTRAINT fk_reset_usuario FOREIGN KEY (user_id) REFERENCES usuarios_app (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sesiones_subasta (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id      INT UNSIGNED NOT NULL,
  subasta_id      INT NOT NULL,
  activa          TINYINT(1) NOT NULL DEFAULT 1,
  iniciada_en     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_sesion_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios_app (id) ON DELETE CASCADE,
  CONSTRAINT fk_sesion_subasta FOREIGN KEY (subasta_id) REFERENCES subastas (identificador)
);

CREATE INDEX idx_pujos_item ON pujos (item, importe DESC);
CREATE INDEX idx_asistentes_cliente ON asistentes (cliente);
CREATE INDEX idx_productos_duenio ON productos (duenio);
CREATE INDEX idx_subastas_estado ON subastas (estado, fecha);
