-- Run in phpMyAdmin or: mysql -u root queensdb < db/schema.sql
-- Create database first if needed: CREATE DATABASE queensdb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
--
-- Tables match Sequelize models in src/models/index.ts
--
-- Alternative: with NODE_ENV=development the API runs Sequelize sync on startup by default.
-- Or run manually: cd backend && npm run db:sync

USE queensdb;

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'admin',
  two_factor_enabled TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS classrooms (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  grade_level VARCHAR(50) NULL,
  academic_year VARCHAR(20) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS students (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  admission_number VARCHAR(50) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE NULL,
  parent_email VARCHAR(255) NULL,
  class_room_id INT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_students_admission (admission_number),
  KEY students_class_room_id_idx (class_room_id),
  CONSTRAINT fk_students_classroom FOREIGN KEY (class_room_id) REFERENCES classrooms (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Default admin: admin@gmail.com / admin@123 (bcrypt cost 12; run npm run seed:admin to reset)
INSERT INTO users (email, password_hash, role) VALUES
(
  'admin@gmail.com',
  '$2b$12$YnyOYoR6II6QgyMXi3ewg.WnHd.mwAdBPNddOZOQnWdi39zcTsTZK',
  'admin'
)
ON DUPLICATE KEY UPDATE email = email;

CREATE TABLE IF NOT EXISTS password_reset_otps (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  email_lower VARCHAR(255) NOT NULL,
  code_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY password_reset_otps_email_idx (email_lower)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Email OTP for login 2FA, password change, 2FA toggle (Sequelize: SecurityOtpChallenge)
CREATE TABLE IF NOT EXISTS security_otp_challenges (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  purpose VARCHAR(32) NOT NULL,
  code_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY security_otp_challenges_user_purpose_idx (user_id, purpose),
  KEY security_otp_challenges_expires_idx (expires_at),
  CONSTRAINT fk_security_otp_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Header bell: per-user notifications (Sequelize: UserNotification)
CREATE TABLE IF NOT EXISTS user_notifications (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  read_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY user_notifications_user_idx (user_id),
  KEY user_notifications_user_unread_idx (user_id, read_at),
  CONSTRAINT fk_user_notifications_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Header mail: per-user messages (Sequelize: UserMessage)
CREATE TABLE IF NOT EXISTS user_messages (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  recipient_user_id INT UNSIGNED NOT NULL,
  sender_user_id INT UNSIGNED NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  read_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY user_messages_recipient_idx (recipient_user_id),
  KEY user_messages_recipient_unread_idx (recipient_user_id, read_at),
  CONSTRAINT fk_user_messages_recipient FOREIGN KEY (recipient_user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_user_messages_sender FOREIGN KEY (sender_user_id) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Existing databases: add 2FA column if missing
-- ALTER TABLE users ADD COLUMN two_factor_enabled TINYINT(1) NOT NULL DEFAULT 0;
