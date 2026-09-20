USE animated_db;

-- 1. Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  client_id VARCHAR(36) NOT NULL,
  number VARCHAR(50) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'INR',
  total DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  issue_date DATETIME NOT NULL,
  due_date DATETIME NOT NULL,
  status ENUM('PENDING', 'PAID', 'OVERDUE', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
  notes VARCHAR(1000) NULL,
  reminders_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  sent_at DATETIME NULL,
  paid_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_invoice_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_invoice_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT,
  UNIQUE KEY uq_user_invoice_number (user_id, number),
  INDEX idx_invoices_user_status (user_id, status),
  INDEX idx_invoices_user_due (user_id, due_date),
  INDEX idx_invoices_client (client_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Invoice Items Table (qty Decimal(10,2) allows fractional billable hours/units like 1.5 hrs)
CREATE TABLE IF NOT EXISTS invoice_items (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  invoice_id VARCHAR(36) NOT NULL,
  description VARCHAR(255) NOT NULL,
  qty DECIMAL(10, 2) NOT NULL DEFAULT 1.00,
  price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  position INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_item_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  INDEX idx_items_invoice_position (invoice_id, position)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Payments Table
CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  invoice_id VARCHAR(36) NOT NULL,
  gateway VARCHAR(50) NOT NULL DEFAULT 'MANUAL',
  txn_id VARCHAR(100) NOT NULL UNIQUE,
  amount DECIMAL(12, 2) NOT NULL,
  paid_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_payment_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  INDEX idx_payments_invoice (invoice_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Invoice Counter Table (Atomic counter per user)
CREATE TABLE IF NOT EXISTS invoice_counters (
  user_id VARCHAR(36) NOT NULL PRIMARY KEY,
  last_number INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_counter_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
