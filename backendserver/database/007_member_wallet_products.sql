-- Member panel wallet pages: transfers, exchange, products, transaction PIN.
-- Additive only: new tables, one enum value appended, new settings keys.

CREATE TABLE IF NOT EXISTS lo_transfers (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  kind ENUM('DEBIT','CREDIT','EXCHANGE') NOT NULL,
  from_user INT UNSIGNED NOT NULL,
  to_user INT UNSIGNED NOT NULL,
  amount DECIMAL(14,2) NOT NULL,
  charge DECIMAL(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_from (from_user, created_at),
  KEY idx_to (to_user, created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS lo_products (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(40) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  image VARCHAR(255) NULL,
  np_value DECIMAL(14,2) NOT NULL DEFAULT 0,
  unit_price DECIMAL(14,2) NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- TRANSFER appended to the ledger enum so balance transfers keep source identity
-- without polluting bonus types. (MySQL appends are metadata-safe.)
ALTER TABLE lo_ledger
  MODIFY ledger_type ENUM('CASHBACK','REFERRAL','MATCHING','GENERATION','RANK','ADJUSTMENT','WITHDRAW','TRANSFER') NOT NULL;

-- Plan-based seed: the Life OS activation package. Price mirrors Plan::FEE (1000);
-- edit lo_products rows when the plan or catalogue changes.
INSERT IGNORE INTO lo_products (code, name, np_value, unit_price) VALUES
  ('LO-BASIC', 'Life OS Basic Package', 1000.00, 1000.00);

INSERT IGNORE INTO lo_settings (k, v) VALUES
  ('exchange_charge_pct', '0'),
  ('transfer_status', '1');
