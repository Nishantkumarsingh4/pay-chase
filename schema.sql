CREATE DATABASE IF NOT EXISTS animated_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE animated_db;

-- 1. Users Table with UUID Primary Key
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  email_verified DATETIME NULL,
  failed_login_count INT NOT NULL DEFAULT 0,
  locked_until DATETIME NULL,
  token_version INT NOT NULL DEFAULT 0,
  last_login_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Password Reset Tokens with SHA-256 Hash & UUID
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reset_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_reset_user_expires (user_id, expires_at),
  INDEX idx_reset_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Rate Limiting Table (Atomic IP & Email limits)
CREATE TABLE IF NOT EXISTS rate_limits (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  `key` VARCHAR(191) NOT NULL UNIQUE,
  count INT NOT NULL DEFAULT 1,
  window_start DATETIME NOT NULL,
  expires_at DATETIME NOT NULL,
  INDEX idx_rate_limit_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Auth Audit Events
CREATE TABLE IF NOT EXISTS auth_events (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  user_id VARCHAR(36) NULL,
  type ENUM(
    'SIGNUP',
    'LOGIN_SUCCESS',
    'LOGIN_FAILED',
    'LOGOUT',
    'PASSWORD_RESET_REQUESTED',
    'PASSWORD_RESET_COMPLETED',
    'ACCOUNT_LOCKED',
    'RATE_LIMITED'
  ) NOT NULL,
  ip VARCHAR(45) NULL,
  user_agent VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_event_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_auth_events_user_created (user_id, created_at),
  INDEX idx_auth_events_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
