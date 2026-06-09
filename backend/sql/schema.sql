CREATE DATABASE IF NOT EXISTS `instrument_testing` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `instrument_testing`;

CREATE TABLE IF NOT EXISTS `categories` (
  `id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` ENUM('Fresh', 'Rework', 'For Trial') NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_categories_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `full_name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'tester', 'viewer') NOT NULL DEFAULT 'viewer',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `instruments` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `serial_number` VARCHAR(128) NOT NULL,
  `instrument_type` ENUM('Production', 'R&D') NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_instruments_serial` (`serial_number`),
  KEY `idx_instruments_type` (`instrument_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `test_records` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `instrument_id` BIGINT UNSIGNED NOT NULL,
  `category_id` SMALLINT UNSIGNED NOT NULL,
  `continuity_detection` TINYINT(1) NOT NULL,
  `resistance_value` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `force_value` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `current_value` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `result` ENUM('Pass', 'Fail') NOT NULL,
  `test_count` INT UNSIGNED NOT NULL DEFAULT 1,
  `repeated_failure_alert` TINYINT(1) NOT NULL DEFAULT 0,
  `remarks` VARCHAR(2000) DEFAULT NULL,
  `tested_by` BIGINT UNSIGNED NOT NULL,
  `tested_at` DATETIME NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_test_records_instrument` (`instrument_id`),
  KEY `idx_test_records_category` (`category_id`),
  KEY `idx_test_records_tested_by` (`tested_by`),
  KEY `idx_test_records_tested_at` (`tested_at`),
  KEY `idx_test_records_result` (`result`),
  UNIQUE KEY `uq_test_records_instrument_tested_at_count` (`instrument_id`, `tested_at`, `test_count`),
  CONSTRAINT `fk_test_records_instrument` FOREIGN KEY (`instrument_id`) REFERENCES `instruments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_test_records_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_test_records_user` FOREIGN KEY (`tested_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
