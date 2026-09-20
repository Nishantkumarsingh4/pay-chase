USE animated_db;

-- 1. Ensure phone and updated_at exist in clients table
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS phone VARCHAR(30) NULL AFTER email,
  ADD COLUMN IF NOT EXISTS updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at;

-- 2. Add Unique constraint on (user_id, email) so one user cannot add duplicate client email
-- Check if index already exists, if not add it
SET @exist := (SELECT COUNT(*) FROM information_schema.statistics 
               WHERE table_schema = 'animated_db' 
               AND table_name = 'clients' 
               AND index_name = 'uq_user_client_email');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE clients ADD UNIQUE KEY uq_user_client_email (user_id, email);', 'SELECT "uq_user_client_email already exists";');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. Add Index on (user_id, name) for fast search and sorting
SET @exist2 := (SELECT COUNT(*) FROM information_schema.statistics 
                WHERE table_schema = 'animated_db' 
                AND table_name = 'clients' 
                AND index_name = 'idx_user_client_name');
SET @sqlstmt2 := IF(@exist2 = 0, 'ALTER TABLE clients ADD INDEX idx_user_client_name (user_id, name);', 'SELECT "idx_user_client_name already exists";');
PREPARE stmt2 FROM @sqlstmt2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;
