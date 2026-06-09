-- ============================================================
--  Loté – Schema MySQL
-- ============================================================

CREATE DATABASE IF NOT EXISTS lote_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE lote_db;

-- ------------------------------------------------------------
-- USERS – credenciales básicas (paso 1 del registro)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password      VARCHAR(255) NOT NULL,         -- bcrypt hash
  status        ENUM('pending','verified','suspended') NOT NULL DEFAULT 'pending',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- USER_PROFILES – datos personales (paso 2: verificación KYC)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_profiles (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id         INT UNSIGNED NOT NULL UNIQUE,
  first_name      VARCHAR(100) NOT NULL,
  last_name       VARCHAR(100) NOT NULL,
  legal_address   VARCHAR(255) NOT NULL,
  country         VARCHAR(100) NOT NULL DEFAULT 'Argentina',
  dni_front_path  VARCHAR(512),               -- ruta local o URL
  dni_back_path   VARCHAR(512),
  kyc_status      ENUM('pending','submitted','approved','rejected') NOT NULL DEFAULT 'pending',
  kyc_submitted_at TIMESTAMP NULL,
  kyc_reviewed_at  TIMESTAMP NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- REFRESH_TOKENS – para poder revocar sesiones
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED NOT NULL,
  token       VARCHAR(512) NOT NULL UNIQUE,
  expires_at  DATETIME NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- PAYMENT_METHODS – medios de pago (paso 3)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payment_methods (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id         INT UNSIGNED NOT NULL,
  type            ENUM('credit_card','bank_account') NOT NULL,
  label           VARCHAR(100),               -- "VISA ****4532"
  currency        ENUM('ARS','USD') NOT NULL DEFAULT 'ARS',
  -- Tarjeta
  card_brand      VARCHAR(20),                -- VISA, MC, AMEX
  card_last4      CHAR(4),
  card_exp_month  TINYINT UNSIGNED,
  card_exp_year   SMALLINT UNSIGNED,
  -- Cuenta bancaria
  bank_name       VARCHAR(100),
  account_number  VARCHAR(50),
  -- Estado
  is_active       TINYINT(1) NOT NULL DEFAULT 1,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Índices útiles
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at);
CREATE INDEX idx_payment_methods_user ON payment_methods(user_id);
