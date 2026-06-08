-- HU-66 - Script consolidado CTIC
-- Proyecto: Simulador de Credito UPB
-- Destino: MariaDB 10.11.10 sobre Red Hat Enterprise Linux 10
-- Generado desde esquema actual de Aiven: 2026-04-28 04:12:58
--
-- IMPORTANTE:
-- 1. CTIC debe reemplazar ${DB_APP_PASSWORD} por la clave real del usuario tecnico.
-- 2. Ejecutar con usuario administrador/root de MariaDB, porque crea base, usuario y permisos.
-- 3. Este archivo contiene datos de prueba y usuarios semilla; tratarlo como sensible.

SET NAMES utf8mb4;
-- Colombia no maneja horario de verano; equivale a America/Bogota.
-- Se usa offset fijo para no depender de que las tablas time_zone esten cargadas en MariaDB.


-- ------------------------------------------------------------
-- Creacion de base de datos y usuario tecnico
-- ------------------------------------------------------------

CREATE DATABASE IF NOT EXISTS `simulador_credito_upb` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'simulador_app'@'%' IDENTIFIED BY '${DB_APP_PASSWORD}';
GRANT SELECT, INSERT, UPDATE, DELETE ON `simulador_credito_upb`.* TO 'simulador_app'@'%';
GRANT EXECUTE ON `simulador_credito_upb`.* TO 'simulador_app'@'%';
FLUSH PRIVILEGES;

USE `simulador_credito_upb`;

SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------
-- Creacion de tablas
-- ------------------------------------------------------------

-- Table `users`
CREATE TABLE `users` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `first_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `document_type` enum('CC','CE','DE','PA','PE','PT','RC','TI','VI') COLLATE utf8mb4_unicode_ci NOT NULL,
  `document_number` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` enum('STUDENT','ADMIN') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'STUDENT',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `terms_accepted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `last_login_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`),
  UNIQUE KEY `uq_users_document` (`document_type`,`document_number`)
);

-- Table `parameter_versions`
CREATE TABLE `parameter_versions` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'UUID v4',
  `valid_from` date NOT NULL,
  `valid_to` date DEFAULT NULL,
  `notes` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `installments_window_from` date NOT NULL,
  `installments_window_to` date NOT NULL,
  `payment_period_days` smallint unsigned NOT NULL DEFAULT '30',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_pv_vigencia` (`valid_from`,`valid_to`),
  KEY `idx_pv_created_by` (`created_by`),
  KEY `idx_pv_validity` (`valid_from`,`valid_to`),
  CONSTRAINT `fk_pv_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
);

-- Table `initial_payment_rules`
CREATE TABLE `initial_payment_rules` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'UUID v4',
  `level` enum('PREGRADO','POSGRADO','UPB_Tech') COLLATE utf8mb4_unicode_ci NOT NULL,
  `modality` enum('SIN_INTERES','CON_INTERES') COLLATE utf8mb4_unicode_ci NOT NULL,
  `extra_installments` tinyint unsigned NOT NULL DEFAULT '0',
  `initial_pct_required` decimal(5,4) NOT NULL,
  `parameter_version_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ipr_version_level_modality_extra` (`parameter_version_id`,`level`,`modality`,`extra_installments`),
  KEY `idx_ipr_version` (`parameter_version_id`),
  CONSTRAINT `fk_ipr_version` FOREIGN KEY (`parameter_version_id`) REFERENCES `parameter_versions` (`id`)
);

-- Table `level_configs`
CREATE TABLE `level_configs` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `parameter_version_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `level_scope` enum('PREGRADO','POSGRADO','UPB_Tech') COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `valid_from` date NOT NULL,
  `valid_to` date DEFAULT NULL,
  `max_payments_sin_interes` tinyint unsigned NOT NULL DEFAULT '3',
  `max_payments_con_interes` tinyint unsigned NOT NULL DEFAULT '6',
  `created_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_lc_version` (`parameter_version_id`),
  KEY `idx_lc_scope_active` (`level_scope`,`is_active`,`valid_to`),
  KEY `idx_lc_version_scope` (`parameter_version_id`,`level_scope`),
  KEY `fk_lc_created_by` (`created_by`),
  CONSTRAINT `fk_lc_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_lc_version` FOREIGN KEY (`parameter_version_id`) REFERENCES `parameter_versions` (`id`),
  CONSTRAINT `chk_lc_active` CHECK ((((`is_active` = 1) and (`valid_to` is null)) or ((`is_active` = 0) and (`valid_to` is not null)))),
  CONSTRAINT `chk_lc_dates` CHECK (((`valid_to` is null) or (`valid_to` >= `valid_from`))),
  CONSTRAINT `chk_lc_max_con` CHECK ((`max_payments_con_interes` between 1 and 6)),
  CONSTRAINT `chk_lc_max_order` CHECK ((`max_payments_sin_interes` <= `max_payments_con_interes`)),
  CONSTRAINT `chk_lc_max_sin` CHECK ((`max_payments_sin_interes` between 1 and 6))
);

-- Table `level_rate_rules`
CREATE TABLE `level_rate_rules` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `level_config_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `payment_count` tinyint unsigned NOT NULL,
  `rate_monthly` decimal(8,6) NOT NULL DEFAULT '0.000000',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_lrr_config_count` (`level_config_id`,`payment_count`),
  KEY `idx_lrr_config` (`level_config_id`),
  CONSTRAINT `fk_lrr_config` FOREIGN KEY (`level_config_id`) REFERENCES `level_configs` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `chk_lrr_count` CHECK ((`payment_count` between 1 and 6)),
  CONSTRAINT `chk_lrr_rate` CHECK (((`rate_monthly` >= 0.000000) and (`rate_monthly` <= 1.000000)))
);

-- Table `simulations`
CREATE TABLE `simulations` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'UUID v4',
  `created_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `deleted_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `delete_reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `student_type` enum('NUEVO','CONTINUO') COLLATE utf8mb4_unicode_ci NOT NULL,
  `level` enum('PREGRADO','POSGRADO','UPB_Tech') COLLATE utf8mb4_unicode_ci NOT NULL,
  `modality` enum('SIN_INTERES','CON_INTERES') COLLATE utf8mb4_unicode_ci NOT NULL,
  `tuition_gross` bigint unsigned NOT NULL,
  `scholar_pct` decimal(5,4) NOT NULL DEFAULT '0.0000',
  `tuition_net` bigint unsigned NOT NULL,
  `initial_payment_pct` decimal(5,4) NOT NULL,
  `initial_payment_value` bigint unsigned NOT NULL,
  `total_payments` tinyint unsigned NOT NULL,
  `first_payment_date` date NOT NULL,
  `financed_value` bigint unsigned NOT NULL,
  `periodic_payment_value` bigint unsigned NOT NULL,
  `total_interest` bigint unsigned NOT NULL DEFAULT '0',
  `total_paid` bigint unsigned NOT NULL,
  `applied_rate_monthly` decimal(8,6) NOT NULL DEFAULT '0.000000',
  `academic_period` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `student_observation` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `parameter_version_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_sim_version` (`parameter_version_id`),
  KEY `idx_sim_deleted_by` (`deleted_by`),
  KEY `idx_sim_period` (`academic_period`,`deleted_at`),
  KEY `idx_sim_level_modality` (`level`,`modality`,`deleted_at`),
  KEY `idx_sim_user_deleted_created` (`user_id`,`deleted_at`,`created_at`),
  KEY `idx_sim_deleted_created` (`deleted_at`,`created_at`),
  CONSTRAINT `fk_sim_deleted_by` FOREIGN KEY (`deleted_by`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_sim_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_sim_version` FOREIGN KEY (`parameter_version_id`) REFERENCES `parameter_versions` (`id`)
);

-- Table `amortization_rows`
CREATE TABLE `amortization_rows` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'UUID v4',
  `payment_no` tinyint unsigned NOT NULL,
  `scheduled_date` date NOT NULL,
  `payment_value` bigint unsigned NOT NULL,
  `interest_value` bigint unsigned NOT NULL DEFAULT '0',
  `principal_value` bigint unsigned NOT NULL,
  `balance_after` bigint unsigned NOT NULL,
  `simulation_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ar_simulation_payment` (`simulation_id`,`payment_no`),
  CONSTRAINT `fk_ar_simulation` FOREIGN KEY (`simulation_id`) REFERENCES `simulations` (`id`)
);

-- Table `audit_logs`
CREATE TABLE `audit_logs` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'UUID v4',
  `action` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `actor_type` enum('ADMIN','STUDENT','SYSTEM') COLLATE utf8mb4_unicode_ci NOT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `details` json NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_al_entity` (`entity`,`entity_id`),
  KEY `idx_al_user` (`user_id`),
  KEY `idx_al_created` (`created_at`),
  KEY `idx_audit_entity_created` (`entity`,`created_at` DESC),
  KEY `idx_audit_user_created` (`user_id`,`created_at` DESC),
  KEY `idx_audit_action_created` (`action`,`created_at` DESC),
  CONSTRAINT `fk_al_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
);

-- Table `export_logs`
CREATE TABLE `export_logs` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'UUID v4',
  `format` enum('PDF','CSV') COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_flags` json NOT NULL,
  `exported_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_name` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `simulation_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_el_user` (`user_id`),
  KEY `idx_el_simulation` (`simulation_id`),
  KEY `idx_el_user_exported` (`user_id`,`exported_at`),
  KEY `idx_el_format_date` (`format`,`exported_at`),
  CONSTRAINT `fk_el_simulation` FOREIGN KEY (`simulation_id`) REFERENCES `simulations` (`id`),
  CONSTRAINT `fk_el_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
);

-- Table `password_reset_tokens`
CREATE TABLE `password_reset_tokens` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `token_hash` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL,
  `used_at` datetime DEFAULT NULL,
  `requested_ip` varchar(45) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_prt_token_hash` (`token_hash`),
  KEY `idx_prt_expires` (`expires_at`,`used_at`),
  KEY `idx_prt_user_id` (`user_id`),
  CONSTRAINT `password_reset_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
);

-- ------------------------------------------------------------
-- Datos iniciales anonimizados y datos de prueba HU-66
-- ------------------------------------------------------------

-- users: 8 rows
-- Nota de seguridad: este script no debe incluir PII, correos reales, telefonos
-- reales ni hashes usados por personas del equipo. Los valores siguientes son
-- datos ficticios para pruebas y arranque tecnico.
INSERT INTO `users` (`id`, `email`, `first_name`, `last_name`, `document_type`, `document_number`, `password`, `phone`, `role`, `is_active`, `terms_accepted_at`, `created_at`, `updated_at`, `last_login_at`)
VALUES
('2a87cabe-dcfd-4327-825e-8647a5cd7fb5', 'student.demo01@example.test', 'Student', 'Demo Uno', 'TI', '9000000001', '$2b$10$wKx.7K8wU2Zcw3sKL10LH.KIPRjWgh9op7h1.8IYNwXO0Ia2HmGOu', '3000000001', 'STUDENT', 1, '2026-03-03 13:52:56', '2026-03-03 13:52:56', '2026-04-27 10:14:26', '2026-04-27 10:14:26'),
('4ccf1906-b931-4be9-b88a-88c584e0f278', 'student.demo02@example.test', 'Student', 'Demo Dos', 'CC', '9000000002', '$2b$10$wKx.7K8wU2Zcw3sKL10LH.KIPRjWgh9op7h1.8IYNwXO0Ia2HmGOu', '3000000002', 'STUDENT', 1, '2026-03-01 20:59:16', '2026-03-01 20:59:16', '2026-04-27 11:03:04', '2026-04-27 11:03:04'),
('95108f1c-b989-4d69-b1b4-1e3e1aeb9aca', 'student.demo03@example.test', 'Student', 'Demo Tres', 'CC', '9000000003', '$2b$10$wKx.7K8wU2Zcw3sKL10LH.KIPRjWgh9op7h1.8IYNwXO0Ia2HmGOu', '3000000003', 'STUDENT', 1, '2026-02-28 05:46:59', '2026-02-28 05:46:59', '2026-04-27 08:02:24', '2026-04-27 08:02:24'),
('9af8885c-8e94-4635-9007-f12f121d6356', 'student.demo04@example.test', 'Student', 'Demo Cuatro', 'CC', '9000000004', '$2b$10$wKx.7K8wU2Zcw3sKL10LH.KIPRjWgh9op7h1.8IYNwXO0Ia2HmGOu', '3000000004', 'STUDENT', 1, '2026-02-28 20:13:22', '2026-02-28 20:13:22', '2026-04-27 09:28:56', '2026-04-27 09:28:56'),
('4a0fa171-6a9a-4531-aceb-9e184f9f76e9', 'admin.demo@example.test', 'Admin', 'Sistema', 'CC', '9000000005', NULL, NULL, 'ADMIN', 1, NULL, '2026-03-02 03:43:02', '2026-04-27 03:04:04', '2026-04-27 03:04:04'),
('1689a470-3f98-11f1-8a72-1e6c74d81551', 'admin.demo01@example.test', 'Admin', 'Demo Uno', 'CC', '9000000006', NULL, NULL, 'ADMIN', 1, NULL, '2026-04-24 04:43:07', '2026-04-24 04:43:07', NULL),
('0f6dc033-3f26-11f1-8a72-1e6c74d81551', 'admin.demo02@example.test', 'Admin', 'Demo Dos', 'CC', '9000000007', NULL, NULL, 'ADMIN', 1, NULL, '2026-04-23 15:06:52', '2026-04-27 12:42:44', '2026-04-27 12:42:44'),
('168b5041-3f98-11f1-8a72-1e6c74d81551', 'admin.demo03@example.test', 'Admin', 'Demo Tres', 'CC', '9000000008', NULL, NULL, 'ADMIN', 1, NULL, '2026-04-24 04:43:07', '2026-04-24 04:43:07', NULL)
ON DUPLICATE KEY UPDATE
  `email` = VALUES(`email`),
  `first_name` = VALUES(`first_name`),
  `last_name` = VALUES(`last_name`),
  `document_type` = VALUES(`document_type`),
  `document_number` = VALUES(`document_number`),
  `password` = VALUES(`password`),
  `phone` = VALUES(`phone`),
  `role` = VALUES(`role`),
  `is_active` = VALUES(`is_active`),
  `terms_accepted_at` = VALUES(`terms_accepted_at`),
  `created_at` = VALUES(`created_at`),
  `updated_at` = VALUES(`updated_at`),
  `last_login_at` = VALUES(`last_login_at`);

-- parameter_versions: 2 rows
INSERT INTO `parameter_versions` (`id`, `valid_from`, `valid_to`, `notes`, `installments_window_from`, `installments_window_to`, `payment_period_days`, `created_at`, `created_by`)
VALUES
('3c2b0497-3888-44ef-a874-5be8f5ace16c', '2026-03-23', '2026-04-23', NULL, '2026-01-01', '2026-06-30', 30, '2026-03-02 03:43:03', '4a0fa171-6a9a-4531-aceb-9e184f9f76e9'),
('52fe8170-293f-4c43-9660-f045de2daf7f', '2026-04-24', NULL, NULL, '2026-06-01', '2026-06-01', 30, '2026-03-23 10:51:19', '4a0fa171-6a9a-4531-aceb-9e184f9f76e9')
ON DUPLICATE KEY UPDATE
  `valid_from` = VALUES(`valid_from`),
  `valid_to` = VALUES(`valid_to`),
  `notes` = VALUES(`notes`),
  `installments_window_from` = VALUES(`installments_window_from`),
  `installments_window_to` = VALUES(`installments_window_to`),
  `payment_period_days` = VALUES(`payment_period_days`),
  `created_at` = VALUES(`created_at`),
  `created_by` = VALUES(`created_by`);

-- initial_payment_rules: 39 rows
INSERT INTO `initial_payment_rules` (`id`, `level`, `modality`, `extra_installments`, `initial_pct_required`, `parameter_version_id`)
VALUES
('9448f084-ccc2-423a-a37b-b6d99c9d17c7', 'PREGRADO', 'SIN_INTERES', 0, '1.0000', '3c2b0497-3888-44ef-a874-5be8f5ace16c'),
('1a61cdf9-a07f-4f19-bb3b-90b73d5e1c91', 'PREGRADO', 'SIN_INTERES', 1, '0.5000', '3c2b0497-3888-44ef-a874-5be8f5ace16c'),
('df935f1c-6b93-496a-96a7-80476e642dfd', 'PREGRADO', 'SIN_INTERES', 2, '0.3400', '3c2b0497-3888-44ef-a874-5be8f5ace16c'),
('dff89880-23f5-4ece-a059-56ab19be48c6', 'PREGRADO', 'SIN_INTERES', 3, '0.2000', '3c2b0497-3888-44ef-a874-5be8f5ace16c'),
('5413c424-be4f-492f-8979-2226b2a491f2', 'PREGRADO', 'CON_INTERES', 0, '0.0000', '3c2b0497-3888-44ef-a874-5be8f5ace16c'),
('4b66c155-8062-4a39-9198-fbbb9305ae63', 'PREGRADO', 'CON_INTERES', 1, '0.0000', '3c2b0497-3888-44ef-a874-5be8f5ace16c'),
('eb67cac3-4ef1-4c3c-abc0-790023559020', 'PREGRADO', 'CON_INTERES', 2, '0.0000', '3c2b0497-3888-44ef-a874-5be8f5ace16c'),
('56891432-7b6f-43b6-9ada-179cf7f99646', 'PREGRADO', 'CON_INTERES', 3, '0.2500', '3c2b0497-3888-44ef-a874-5be8f5ace16c'),
('499b817e-ee40-4048-9b09-ed62c78b494f', 'PREGRADO', 'CON_INTERES', 4, '0.2000', '3c2b0497-3888-44ef-a874-5be8f5ace16c'),
('a67f728b-11ef-4f5e-9e1c-7855759fd3a4', 'PREGRADO', 'CON_INTERES', 5, '0.2000', '3c2b0497-3888-44ef-a874-5be8f5ace16c'),
('0a824436-33ba-473b-89e7-fbe49fe33481', 'PREGRADO', 'CON_INTERES', 6, '0.2000', '3c2b0497-3888-44ef-a874-5be8f5ace16c'),
('e83868e2-cc91-408b-87a6-f1a7187fb744', 'POSGRADO', 'SIN_INTERES', 0, '1.0000', '3c2b0497-3888-44ef-a874-5be8f5ace16c'),
('a1d1d9d4-e989-4866-92cf-31d42bfd66d1', 'POSGRADO', 'SIN_INTERES', 1, '0.5000', '3c2b0497-3888-44ef-a874-5be8f5ace16c'),
('f21331b9-8494-455d-b19b-d4dc62523d6b', 'POSGRADO', 'SIN_INTERES', 2, '0.3400', '3c2b0497-3888-44ef-a874-5be8f5ace16c'),
('3524a54f-7c19-4bd6-a4e5-c54559b77713', 'POSGRADO', 'SIN_INTERES', 3, '0.2000', '3c2b0497-3888-44ef-a874-5be8f5ace16c'),
('7cbfa474-dcaf-4d4b-b118-84297a0a7b21', 'POSGRADO', 'CON_INTERES', 0, '0.0000', '3c2b0497-3888-44ef-a874-5be8f5ace16c'),
('f1094483-bc6f-40f9-be39-8c42e53b3364', 'POSGRADO', 'CON_INTERES', 1, '0.0000', '3c2b0497-3888-44ef-a874-5be8f5ace16c'),
('146a4f17-ec82-45e5-ad50-e8383f2b44c3', 'POSGRADO', 'CON_INTERES', 2, '0.0000', '3c2b0497-3888-44ef-a874-5be8f5ace16c'),
('23ace7eb-0bfa-46bf-bf17-7ef35aeeb540', 'POSGRADO', 'CON_INTERES', 3, '0.2500', '3c2b0497-3888-44ef-a874-5be8f5ace16c'),
('5535e3d4-bfb0-415f-beec-61fcb7ba3b66', 'POSGRADO', 'CON_INTERES', 4, '0.2000', '3c2b0497-3888-44ef-a874-5be8f5ace16c'),
('106ab671-d75e-4cb1-a9aa-0eb0ba8a3e05', 'POSGRADO', 'CON_INTERES', 5, '0.2000', '3c2b0497-3888-44ef-a874-5be8f5ace16c'),
('1cf233c6-2890-4d4c-8127-1da8a255de08', 'POSGRADO', 'CON_INTERES', 6, '0.2000', '3c2b0497-3888-44ef-a874-5be8f5ace16c'),
('288b58b5-655e-400b-8201-282c39754b9b', 'UPB_Tech', 'SIN_INTERES', 0, '1.0000', '3c2b0497-3888-44ef-a874-5be8f5ace16c'),
('5b331492-20f3-4dc5-a2c3-d877d954bfed', 'UPB_Tech', 'SIN_INTERES', 1, '0.5000', '3c2b0497-3888-44ef-a874-5be8f5ace16c'),
('7e8d6e91-7183-4201-aa45-14e4d77655d9', 'UPB_Tech', 'SIN_INTERES', 2, '0.3400', '3c2b0497-3888-44ef-a874-5be8f5ace16c'),
('63d4d037-69aa-4075-b188-0b49c16c35e7', 'UPB_Tech', 'SIN_INTERES', 3, '0.1500', '3c2b0497-3888-44ef-a874-5be8f5ace16c'),
('44945e70-7dfd-482f-a4d2-5cdefa94ddc6', 'UPB_Tech', 'CON_INTERES', 0, '1.0000', '3c2b0497-3888-44ef-a874-5be8f5ace16c'),
('bbbbeb14-1ea4-4ee9-ac36-da2875803674', 'UPB_Tech', 'CON_INTERES', 1, '0.5000', '3c2b0497-3888-44ef-a874-5be8f5ace16c'),
('543fbe12-8e8e-4b0b-b313-6c048cdb99ab', 'UPB_Tech', 'CON_INTERES', 2, '0.3400', '3c2b0497-3888-44ef-a874-5be8f5ace16c'),
('6e07f481-dde3-4ab2-b839-35ab78c47347', 'UPB_Tech', 'CON_INTERES', 3, '0.2500', '3c2b0497-3888-44ef-a874-5be8f5ace16c'),
('a8090899-5f37-4668-8674-76ddfa285d1d', 'UPB_Tech', 'CON_INTERES', 4, '0.2000', '3c2b0497-3888-44ef-a874-5be8f5ace16c'),
('112545d1-4e96-452b-8dc6-1e4c39dbd257', 'UPB_Tech', 'CON_INTERES', 5, '0.1500', '3c2b0497-3888-44ef-a874-5be8f5ace16c'),
('e91d8731-f642-40a5-9a2b-00691fee158b', 'UPB_Tech', 'CON_INTERES', 6, '0.1500', '3c2b0497-3888-44ef-a874-5be8f5ace16c'),
('b053b829-4e97-4b71-9795-c884e15d3e0c', 'PREGRADO', 'SIN_INTERES', 0, '0.2000', '52fe8170-293f-4c43-9660-f045de2daf7f'),
('4dd1726e-fbfc-4e9d-bff3-1e4b010e22f0', 'PREGRADO', 'CON_INTERES', 3, '0.2500', '52fe8170-293f-4c43-9660-f045de2daf7f'),
('a53204c6-0abb-4461-8a25-07bcd7dee9f7', 'POSGRADO', 'SIN_INTERES', 0, '0.2000', '52fe8170-293f-4c43-9660-f045de2daf7f'),
('9f347c1d-d3d2-4480-912a-25a975fd95b6', 'POSGRADO', 'CON_INTERES', 3, '0.2500', '52fe8170-293f-4c43-9660-f045de2daf7f'),
('d6a87ec6-f2f7-4e76-ad11-19d94bb42049', 'UPB_Tech', 'SIN_INTERES', 0, '0.1500', '52fe8170-293f-4c43-9660-f045de2daf7f'),
('df13d0ec-fd0c-456d-ae12-8122b230fdc0', 'UPB_Tech', 'CON_INTERES', 3, '0.1500', '52fe8170-293f-4c43-9660-f045de2daf7f')
ON DUPLICATE KEY UPDATE
  `level` = VALUES(`level`),
  `modality` = VALUES(`modality`),
  `extra_installments` = VALUES(`extra_installments`),
  `initial_pct_required` = VALUES(`initial_pct_required`),
  `parameter_version_id` = VALUES(`parameter_version_id`);

-- level_configs: 6 rows
INSERT INTO `level_configs` (`id`, `parameter_version_id`, `level_scope`, `is_active`, `valid_from`, `valid_to`, `max_payments_sin_interes`, `max_payments_con_interes`, `created_by`, `created_at`, `updated_at`)
VALUES
('f7558e08-28cb-11f1-8a72-1e6c74d81551', '3c2b0497-3888-44ef-a874-5be8f5ace16c', 'PREGRADO', 1, '2026-03-23', NULL, 3, 6, '4a0fa171-6a9a-4531-aceb-9e184f9f76e9', '2026-03-26 04:26:31', '2026-03-26 04:26:31'),
('f7558e8f-28cb-11f1-8a72-1e6c74d81551', '3c2b0497-3888-44ef-a874-5be8f5ace16c', 'POSGRADO', 1, '2026-03-23', NULL, 3, 6, '4a0fa171-6a9a-4531-aceb-9e184f9f76e9', '2026-03-26 04:26:31', '2026-03-26 04:26:31'),
('f7558ece-28cb-11f1-8a72-1e6c74d81551', '3c2b0497-3888-44ef-a874-5be8f5ace16c', 'UPB_Tech', 1, '2026-03-23', NULL, 3, 6, '4a0fa171-6a9a-4531-aceb-9e184f9f76e9', '2026-03-26 04:26:31', '2026-03-26 14:00:53'),
('cca471fd-fbd2-4418-b1dd-0478715bfd7d', '52fe8170-293f-4c43-9660-f045de2daf7f', 'PREGRADO', 1, '2026-04-11', NULL, 3, 6, '4a0fa171-6a9a-4531-aceb-9e184f9f76e9', '2026-04-24 21:23:29', '2026-04-24 21:23:29'),
('62b56c36-f3c7-49e7-9e15-008312e0a344', '52fe8170-293f-4c43-9660-f045de2daf7f', 'POSGRADO', 1, '2026-04-08', NULL, 3, 4, '4a0fa171-6a9a-4531-aceb-9e184f9f76e9', '2026-04-24 21:23:30', '2026-04-24 21:23:30'),
('f23c5f80-de9c-4cf5-abe4-c42493690ee1', '52fe8170-293f-4c43-9660-f045de2daf7f', 'UPB_Tech', 0, '2026-04-24', '2026-04-24', 3, 6, '4a0fa171-6a9a-4531-aceb-9e184f9f76e9', '2026-04-24 21:23:31', '2026-04-24 21:23:31')
ON DUPLICATE KEY UPDATE
  `parameter_version_id` = VALUES(`parameter_version_id`),
  `level_scope` = VALUES(`level_scope`),
  `is_active` = VALUES(`is_active`),
  `valid_from` = VALUES(`valid_from`),
  `valid_to` = VALUES(`valid_to`),
  `max_payments_sin_interes` = VALUES(`max_payments_sin_interes`),
  `max_payments_con_interes` = VALUES(`max_payments_con_interes`),
  `created_by` = VALUES(`created_by`),
  `created_at` = VALUES(`created_at`),
  `updated_at` = VALUES(`updated_at`);

-- level_rate_rules: 34 rows
INSERT INTO `level_rate_rules` (`id`, `level_config_id`, `payment_count`, `rate_monthly`, `created_at`, `updated_at`)
VALUES
('421cddf4-e0fd-4326-b0b4-63332901ea43', '62b56c36-f3c7-49e7-9e15-008312e0a344', 1, '0.000000', '2026-04-24 21:23:30', '2026-04-24 21:23:30'),
('65d73125-c6bd-42e7-8070-b2f6346b6587', '62b56c36-f3c7-49e7-9e15-008312e0a344', 2, '0.000000', '2026-04-24 21:23:30', '2026-04-24 21:23:30'),
('5f1fedf4-bab7-44cc-b165-ce13cc132eb8', '62b56c36-f3c7-49e7-9e15-008312e0a344', 3, '0.000000', '2026-04-24 21:23:30', '2026-04-24 21:23:30'),
('8d9c4b86-e249-49e7-b47b-409c208ab6cb', '62b56c36-f3c7-49e7-9e15-008312e0a344', 4, '0.010000', '2026-04-24 21:23:30', '2026-04-24 21:23:30'),
('a00dd52d-7580-46de-a90f-15f324f402f0', 'cca471fd-fbd2-4418-b1dd-0478715bfd7d', 1, '0.000000', '2026-04-24 21:23:30', '2026-04-24 21:23:30'),
('bb70c7d5-df04-4059-9bc8-9eb889d5711a', 'cca471fd-fbd2-4418-b1dd-0478715bfd7d', 2, '0.000000', '2026-04-24 21:23:30', '2026-04-24 21:23:30'),
('e567ca50-514d-47f9-871d-a3dcbaf34d92', 'cca471fd-fbd2-4418-b1dd-0478715bfd7d', 3, '0.000000', '2026-04-24 21:23:30', '2026-04-24 21:23:30'),
('dbc6603d-1dcc-4e4e-b294-3575d681b76d', 'cca471fd-fbd2-4418-b1dd-0478715bfd7d', 4, '0.010000', '2026-04-24 21:23:30', '2026-04-24 21:23:30'),
('e31a1d03-fe2c-457e-8b58-d81f51d49b00', 'cca471fd-fbd2-4418-b1dd-0478715bfd7d', 5, '0.010000', '2026-04-24 21:23:30', '2026-04-24 21:23:30'),
('03d423b2-8287-4591-9bff-0ca2514ab554', 'cca471fd-fbd2-4418-b1dd-0478715bfd7d', 6, '0.010000', '2026-04-24 21:23:30', '2026-04-24 21:23:30'),
('cecd762d-fa01-4f7e-b762-4dc43738f772', 'f23c5f80-de9c-4cf5-abe4-c42493690ee1', 1, '0.000000', '2026-04-24 21:23:31', '2026-04-24 21:23:31'),
('8826a6d3-2d12-49be-9222-3d15db7ec6ae', 'f23c5f80-de9c-4cf5-abe4-c42493690ee1', 2, '0.000000', '2026-04-24 21:23:31', '2026-04-24 21:23:31'),
('3f5c65b9-1fa2-4657-b5e5-c966595c90a3', 'f23c5f80-de9c-4cf5-abe4-c42493690ee1', 3, '0.000000', '2026-04-24 21:23:31', '2026-04-24 21:23:31'),
('a5adb957-a23f-491b-b4eb-91b2178c4ba1', 'f23c5f80-de9c-4cf5-abe4-c42493690ee1', 4, '0.010000', '2026-04-24 21:23:31', '2026-04-24 21:23:31'),
('98108596-8add-426a-b20a-9470b704e54f', 'f23c5f80-de9c-4cf5-abe4-c42493690ee1', 5, '0.010000', '2026-04-24 21:23:31', '2026-04-24 21:23:31'),
('de33aa7e-04f8-43d4-b996-8f3438c05558', 'f23c5f80-de9c-4cf5-abe4-c42493690ee1', 6, '0.010000', '2026-04-24 21:23:31', '2026-04-24 21:23:31'),
('079443e8-28cc-11f1-8a72-1e6c74d81551', 'f7558e08-28cb-11f1-8a72-1e6c74d81551', 1, '0.000000', '2026-03-26 04:26:59', '2026-03-26 04:26:59'),
('0794774a-28cc-11f1-8a72-1e6c74d81551', 'f7558e08-28cb-11f1-8a72-1e6c74d81551', 2, '0.000000', '2026-03-26 04:26:59', '2026-03-26 04:26:59'),
('07948cdd-28cc-11f1-8a72-1e6c74d81551', 'f7558e08-28cb-11f1-8a72-1e6c74d81551', 3, '0.000000', '2026-03-26 04:26:59', '2026-03-26 04:26:59'),
('07949855-28cc-11f1-8a72-1e6c74d81551', 'f7558e08-28cb-11f1-8a72-1e6c74d81551', 4, '0.010000', '2026-03-26 04:26:59', '2026-03-26 04:26:59'),
('0794a789-28cc-11f1-8a72-1e6c74d81551', 'f7558e08-28cb-11f1-8a72-1e6c74d81551', 5, '0.010000', '2026-03-26 04:26:59', '2026-03-26 04:26:59'),
('0794be6a-28cc-11f1-8a72-1e6c74d81551', 'f7558e08-28cb-11f1-8a72-1e6c74d81551', 6, '0.010000', '2026-03-26 04:26:59', '2026-03-26 04:26:59'),
('07943c2f-28cc-11f1-8a72-1e6c74d81551', 'f7558e8f-28cb-11f1-8a72-1e6c74d81551', 1, '0.000000', '2026-03-26 04:26:59', '2026-03-26 04:26:59'),
('07946f58-28cc-11f1-8a72-1e6c74d81551', 'f7558e8f-28cb-11f1-8a72-1e6c74d81551', 2, '0.000000', '2026-03-26 04:26:59', '2026-03-26 04:26:59'),
('0794815c-28cc-11f1-8a72-1e6c74d81551', 'f7558e8f-28cb-11f1-8a72-1e6c74d81551', 3, '0.000000', '2026-03-26 04:26:59', '2026-03-26 04:26:59'),
('07949424-28cc-11f1-8a72-1e6c74d81551', 'f7558e8f-28cb-11f1-8a72-1e6c74d81551', 4, '0.010000', '2026-03-26 04:26:59', '2026-03-26 04:26:59'),
('07949f73-28cc-11f1-8a72-1e6c74d81551', 'f7558e8f-28cb-11f1-8a72-1e6c74d81551', 5, '0.010000', '2026-03-26 04:26:59', '2026-03-26 04:26:59'),
('0794b86c-28cc-11f1-8a72-1e6c74d81551', 'f7558e8f-28cb-11f1-8a72-1e6c74d81551', 6, '0.010000', '2026-03-26 04:26:59', '2026-03-26 04:26:59'),
('07942f7e-28cc-11f1-8a72-1e6c74d81551', 'f7558ece-28cb-11f1-8a72-1e6c74d81551', 1, '0.000000', '2026-03-26 04:26:59', '2026-03-26 04:26:59'),
('07944b27-28cc-11f1-8a72-1e6c74d81551', 'f7558ece-28cb-11f1-8a72-1e6c74d81551', 2, '0.000000', '2026-03-26 04:26:59', '2026-03-26 04:26:59'),
('07947f85-28cc-11f1-8a72-1e6c74d81551', 'f7558ece-28cb-11f1-8a72-1e6c74d81551', 3, '0.000000', '2026-03-26 04:26:59', '2026-03-26 04:26:59'),
('07949259-28cc-11f1-8a72-1e6c74d81551', 'f7558ece-28cb-11f1-8a72-1e6c74d81551', 4, '0.010000', '2026-03-26 04:26:59', '2026-03-26 04:26:59'),
('07949db4-28cc-11f1-8a72-1e6c74d81551', 'f7558ece-28cb-11f1-8a72-1e6c74d81551', 5, '0.010000', '2026-03-26 04:26:59', '2026-03-26 04:26:59'),
('0794b550-28cc-11f1-8a72-1e6c74d81551', 'f7558ece-28cb-11f1-8a72-1e6c74d81551', 6, '0.010000', '2026-03-26 04:26:59', '2026-03-26 04:26:59')
ON DUPLICATE KEY UPDATE
  `level_config_id` = VALUES(`level_config_id`),
  `payment_count` = VALUES(`payment_count`),
  `rate_monthly` = VALUES(`rate_monthly`),
  `created_at` = VALUES(`created_at`),
  `updated_at` = VALUES(`updated_at`);

-- simulations: 8 rows
INSERT INTO `simulations` (`id`, `created_at`, `deleted_at`, `deleted_by`, `delete_reason`, `student_type`, `level`, `modality`, `tuition_gross`, `scholar_pct`, `tuition_net`, `initial_payment_pct`, `initial_payment_value`, `total_payments`, `first_payment_date`, `financed_value`, `periodic_payment_value`, `total_interest`, `total_paid`, `applied_rate_monthly`, `academic_period`, `student_observation`, `user_id`, `parameter_version_id`)
VALUES
('0dc4e506-c7d9-4341-ade5-e5969d9dc7a7', '2026-04-11 12:03:58', NULL, NULL, NULL, 'CONTINUO', 'PREGRADO', 'CON_INTERES', 7000000, '0.0700', 6510000, '0.2000', 1302000, 6, '2026-06-01', 5208000, 1073055, 157275, 6667275, '0.010000', '2026-02', NULL, '2a87cabe-dcfd-4327-825e-8647a5cd7fb5', '52fe8170-293f-4c43-9660-f045de2daf7f'),
('d5501ab5-6cec-47f0-b226-1ec8bdbcfd03', '2026-04-22 23:37:41', NULL, NULL, NULL, 'CONTINUO', 'PREGRADO', 'SIN_INTERES', 10000000, '0.0000', 10000000, '1.0000', 10000000, 1, '2026-04-23', 0, 0, 0, 10000000, '0.000000', '2026-02', 'prueba', '4ccf1906-b931-4be9-b88a-88c584e0f278', '52fe8170-293f-4c43-9660-f045de2daf7f'),
('4a1ca08c-2ad7-4c9f-b80b-fe841bcadeed', '2026-04-23 09:27:07', NULL, NULL, NULL, 'CONTINUO', 'PREGRADO', 'CON_INTERES', 12222222, '0.0000', 12222222, '0.2000', 2444444, 5, '2026-07-01', 9777778, 2505860, 245660, 12467884, '0.010000', '2026-02', NULL, '4ccf1906-b931-4be9-b88a-88c584e0f278', '52fe8170-293f-4c43-9660-f045de2daf7f'),
('169380cd-c130-46fe-bd57-16dd07fdff33', '2026-04-26 22:51:22', NULL, NULL, NULL, 'CONTINUO', 'PREGRADO', 'SIN_INTERES', 6200000, '0.0500', 5890000, '1.0000', 5890000, 1, '2026-04-27', 0, 0, 0, 5890000, '0.000000', '2026-01', NULL, '4ccf1906-b931-4be9-b88a-88c584e0f278', '52fe8170-293f-4c43-9660-f045de2daf7f'),
('edd29c1a-e5ca-4f90-a213-c327074144bf', '2026-03-20 16:05:06', NULL, NULL, NULL, 'NUEVO', 'PREGRADO', 'CON_INTERES', 7429000, '0.2500', 5571750, '0.3000', 1671525, 6, '2026-06-01', 3900225, 803602, 117782, 5689535, '0.010000', '2026-02', NULL, '95108f1c-b989-4d69-b1b4-1e3e1aeb9aca', '3c2b0497-3888-44ef-a874-5be8f5ace16c'),
('5a86bb55-7650-403e-805b-9e77b83cbfa1', '2026-04-24 22:29:25', NULL, NULL, NULL, 'CONTINUO', 'PREGRADO', 'CON_INTERES', 6700000, '0.2000', 5360000, '0.2500', 1340000, 6, '2026-06-01', 4020000, 828280, 121400, 5481400, '0.010000', '2026-02', 'prueba R-03', '9af8885c-8e94-4635-9007-f12f121d6356', '52fe8170-293f-4c43-9660-f045de2daf7f'),
('16bf37ba-2f67-4ecf-8dc6-5ee86062e2a8', '2026-04-24 23:27:26', NULL, NULL, NULL, 'CONTINUO', 'POSGRADO', 'CON_INTERES', 7000000, '0.2500', 5250000, '0.2500', 1312500, 4, '2026-07-01', 3937500, 1338837, 79011, 5329011, '0.010000', '2026-02', NULL, '9af8885c-8e94-4635-9007-f12f121d6356', '52fe8170-293f-4c43-9660-f045de2daf7f'),
('3dd91917-fd99-4ee8-925b-356ece98cd11', '2026-04-27 09:30:41', NULL, NULL, NULL, 'NUEVO', 'PREGRADO', 'CON_INTERES', 7000000, '0.2500', 5250000, '0.2500', 1312500, 6, '2026-06-01', 3937500, 811282, 118908, 5368910, '0.010000', '2026-02', 'Me agrada esta simulación', '9af8885c-8e94-4635-9007-f12f121d6356', '52fe8170-293f-4c43-9660-f045de2daf7f')
ON DUPLICATE KEY UPDATE
  `created_at` = VALUES(`created_at`),
  `deleted_at` = VALUES(`deleted_at`),
  `deleted_by` = VALUES(`deleted_by`),
  `delete_reason` = VALUES(`delete_reason`),
  `student_type` = VALUES(`student_type`),
  `level` = VALUES(`level`),
  `modality` = VALUES(`modality`),
  `tuition_gross` = VALUES(`tuition_gross`),
  `scholar_pct` = VALUES(`scholar_pct`),
  `tuition_net` = VALUES(`tuition_net`),
  `initial_payment_pct` = VALUES(`initial_payment_pct`),
  `initial_payment_value` = VALUES(`initial_payment_value`),
  `total_payments` = VALUES(`total_payments`),
  `first_payment_date` = VALUES(`first_payment_date`),
  `financed_value` = VALUES(`financed_value`),
  `periodic_payment_value` = VALUES(`periodic_payment_value`),
  `total_interest` = VALUES(`total_interest`),
  `total_paid` = VALUES(`total_paid`),
  `applied_rate_monthly` = VALUES(`applied_rate_monthly`),
  `academic_period` = VALUES(`academic_period`),
  `student_observation` = VALUES(`student_observation`),
  `user_id` = VALUES(`user_id`),
  `parameter_version_id` = VALUES(`parameter_version_id`);

-- amortization_rows: 27 rows
INSERT INTO `amortization_rows` (`id`, `payment_no`, `scheduled_date`, `payment_value`, `interest_value`, `principal_value`, `balance_after`, `simulation_id`)
VALUES
('66eb3230-dea1-4a6e-ba18-dd606cde0cef', 2, '2026-06-01', 1073055, 52080, 1020975, 4187025, '0dc4e506-c7d9-4341-ade5-e5969d9dc7a7'),
('9c8a6b90-649c-40c1-98fe-efca42d04a0d', 3, '2026-07-01', 1073055, 41870, 1031185, 3155840, '0dc4e506-c7d9-4341-ade5-e5969d9dc7a7'),
('370bc14b-0db0-47c2-8320-b077eae16dcb', 4, '2026-08-01', 1073055, 31558, 1041497, 2114343, '0dc4e506-c7d9-4341-ade5-e5969d9dc7a7'),
('263af0bf-0c5f-4c2a-b990-bb753ab0d99d', 5, '2026-09-01', 1073055, 21143, 1051912, 1062431, '0dc4e506-c7d9-4341-ade5-e5969d9dc7a7'),
('7657d958-ca32-45b9-8681-07a29cd46edc', 6, '2026-10-01', 1073055, 10624, 1062431, 0, '0dc4e506-c7d9-4341-ade5-e5969d9dc7a7'),
('6e2c8580-aeba-452c-b7d5-dc4faf38e04f', 2, '2026-07-01', 1338837, 39375, 1299462, 2638038, '16bf37ba-2f67-4ecf-8dc6-5ee86062e2a8'),
('913928e7-02af-4c0b-ae2d-5d3cd917fb19', 3, '2026-08-01', 1338837, 26380, 1312457, 1325581, '16bf37ba-2f67-4ecf-8dc6-5ee86062e2a8'),
('5c62577c-2189-4801-83c7-b55baf9faf29', 4, '2026-09-01', 1338837, 13256, 1325581, 0, '16bf37ba-2f67-4ecf-8dc6-5ee86062e2a8'),
('910776d5-bcbe-47cd-8350-f56a0d023043', 2, '2026-06-01', 811282, 39375, 771907, 3165593, '3dd91917-fd99-4ee8-925b-356ece98cd11'),
('54b7a3f5-fdf3-47eb-b0d7-847507b9f775', 3, '2026-07-01', 811282, 31656, 779626, 2385967, '3dd91917-fd99-4ee8-925b-356ece98cd11'),
('8a85ce6e-dc57-4b6b-bafe-ce64518b52bb', 4, '2026-08-01', 811282, 23860, 787422, 1598545, '3dd91917-fd99-4ee8-925b-356ece98cd11'),
('d1a3115b-8c36-4ddd-b843-ba484ef9d62d', 5, '2026-09-01', 811282, 15985, 795297, 803248, '3dd91917-fd99-4ee8-925b-356ece98cd11'),
('3e3288af-8892-4417-b09d-2a9b9a67e7e3', 6, '2026-10-01', 811282, 8032, 803250, 0, '3dd91917-fd99-4ee8-925b-356ece98cd11'),
('d35aba55-b2a1-4e7d-9b0a-92ffe74ed1ac', 2, '2026-07-01', 2505860, 97778, 2408082, 7369696, '4a1ca08c-2ad7-4c9f-b80b-fe841bcadeed'),
('9d3b9359-1756-48ab-8bec-ed2279e798c5', 3, '2026-08-01', 2505860, 73697, 2432163, 4937533, '4a1ca08c-2ad7-4c9f-b80b-fe841bcadeed'),
('4989290e-ef6f-4709-8d76-900545a6fcc4', 4, '2026-09-01', 2505860, 49375, 2456485, 2481048, '4a1ca08c-2ad7-4c9f-b80b-fe841bcadeed'),
('2b05d891-52f1-4b67-b949-9086f3531adf', 5, '2026-10-01', 2505860, 24810, 2481050, 0, '4a1ca08c-2ad7-4c9f-b80b-fe841bcadeed'),
('17e2628b-6406-4400-8841-5587fe5dac97', 2, '2026-06-01', 828280, 40200, 788080, 3231920, '5a86bb55-7650-403e-805b-9e77b83cbfa1'),
('0b46d234-df3f-4a5c-8bcd-841489e217d0', 3, '2026-07-01', 828280, 32319, 795961, 2435959, '5a86bb55-7650-403e-805b-9e77b83cbfa1'),
('76a21370-4d80-42c2-9492-5e5bc6af845a', 4, '2026-08-01', 828280, 24360, 803920, 1632039, '5a86bb55-7650-403e-805b-9e77b83cbfa1'),
('03852219-f11a-4f25-b26b-ffdab07f75ce', 5, '2026-09-01', 828280, 16320, 811960, 820079, '5a86bb55-7650-403e-805b-9e77b83cbfa1'),
('59ba989d-809a-4d0b-a1dd-083eb8db3964', 6, '2026-10-01', 828280, 8201, 820079, 0, '5a86bb55-7650-403e-805b-9e77b83cbfa1'),
('160f0027-0933-47e3-8718-f0b8b97dd842', 2, '2026-06-01', 803602, 39002, 764600, 3135625, 'edd29c1a-e5ca-4f90-a213-c327074144bf'),
('5d05eb83-39e7-46b7-95f2-244fb2310415', 3, '2026-07-01', 803602, 31356, 772246, 2363379, 'edd29c1a-e5ca-4f90-a213-c327074144bf'),
('d876a163-9c26-43f4-b5df-617157779acc', 4, '2026-08-01', 803602, 23634, 779968, 1583411, 'edd29c1a-e5ca-4f90-a213-c327074144bf'),
('18f4eeac-c519-4acc-bb3b-c3642d8f63f7', 5, '2026-09-01', 803602, 15834, 787768, 795643, 'edd29c1a-e5ca-4f90-a213-c327074144bf'),
('afc1213e-1e24-4d6b-b69d-7a39dcab565a', 6, '2026-10-01', 803602, 7956, 795646, 0, 'edd29c1a-e5ca-4f90-a213-c327074144bf')
ON DUPLICATE KEY UPDATE
  `payment_no` = VALUES(`payment_no`),
  `scheduled_date` = VALUES(`scheduled_date`),
  `payment_value` = VALUES(`payment_value`),
  `interest_value` = VALUES(`interest_value`),
  `principal_value` = VALUES(`principal_value`),
  `balance_after` = VALUES(`balance_after`),
  `simulation_id` = VALUES(`simulation_id`);

-- named_test_students: 5 rows
-- Password local para todos: UPB2027a
INSERT INTO `users` (`id`, `email`, `password`, `first_name`, `last_name`, `document_type`, `document_number`, `role`, `is_active`, `terms_accepted_at`, `last_login_at`, `created_at`, `updated_at`)
VALUES
(UUID(), 'student.hu66.01@example.test', '$2b$10$wKx.7K8wU2Zcw3sKL10LH.KIPRjWgh9op7h1.8IYNwXO0Ia2HmGOu', 'Student', 'HU66 Uno', 'CC', '9200000001', 'STUDENT', 1, NOW(), NULL, NOW(), NOW()),
(UUID(), 'student.hu66.02@example.test', '$2b$10$wKx.7K8wU2Zcw3sKL10LH.KIPRjWgh9op7h1.8IYNwXO0Ia2HmGOu', 'Student', 'HU66 Dos', 'CC', '9200000002', 'STUDENT', 1, NOW(), NULL, NOW(), NOW()),
(UUID(), 'student.hu66.03@example.test', '$2b$10$wKx.7K8wU2Zcw3sKL10LH.KIPRjWgh9op7h1.8IYNwXO0Ia2HmGOu', 'Student', 'HU66 Tres', 'CC', '9200000003', 'STUDENT', 1, NOW(), NULL, NOW(), NOW()),
(UUID(), 'student.hu66.04@example.test', '$2b$10$wKx.7K8wU2Zcw3sKL10LH.KIPRjWgh9op7h1.8IYNwXO0Ia2HmGOu', 'Student', 'HU66 Cuatro', 'CC', '9200000004', 'STUDENT', 1, NOW(), NULL, NOW(), NOW()),
(UUID(), 'student.hu66.05@example.test', '$2b$10$wKx.7K8wU2Zcw3sKL10LH.KIPRjWgh9op7h1.8IYNwXO0Ia2HmGOu', 'Student', 'HU66 Cinco', 'CC', '9200000005', 'STUDENT', 1, NOW(), NULL, NOW(), NOW())
ON DUPLICATE KEY UPDATE
  `password` = VALUES(`password`),
  `first_name` = VALUES(`first_name`),
  `last_name` = VALUES(`last_name`),
  `document_type` = VALUES(`document_type`),
  `document_number` = VALUES(`document_number`),
  `role` = VALUES(`role`),
  `is_active` = VALUES(`is_active`),
  `terms_accepted_at` = COALESCE(`users`.`terms_accepted_at`, VALUES(`terms_accepted_at`)),
  `updated_at` = NOW();

-- ------------------------------------------------------------
-- Creacion de vistas
-- ------------------------------------------------------------

-- Las vistas de Aiven se normalizaron para MariaDB 10.11.10 y para el esquema actual.
-- Se reemplazo la deuda tecnica saved_at por created_at y se quitaron referencias a tablas antiguas.

-- View `v_active_simulations`
DROP VIEW IF EXISTS `v_active_simulations`;
CREATE OR REPLACE VIEW `v_active_simulations` AS
SELECT
  `s`.`id` AS `id`,
  `s`.`created_at` AS `created_at`,
  `s`.`academic_period` AS `academic_period`,
  `s`.`level` AS `level`,
  `s`.`modality` AS `modality`,
  `s`.`student_type` AS `student_type`,
  `s`.`tuition_gross` AS `tuition_gross`,
  `s`.`tuition_net` AS `tuition_net`,
  `s`.`initial_payment_value` AS `initial_payment_value`,
  `s`.`financed_value` AS `financed_value`,
  `s`.`total_payments` AS `total_payments`,
  `s`.`total_interest` AS `total_interest`,
  `s`.`total_paid` AS `total_paid`,
  `s`.`applied_rate_monthly` AS `applied_rate_monthly`,
  `s`.`student_observation` AS `student_observation`,
  `u`.`first_name` AS `first_name`,
  `u`.`last_name` AS `last_name`,
  `u`.`email` AS `email`
FROM `simulations` `s`
JOIN `users` `u` ON `s`.`user_id` = `u`.`id`
WHERE `s`.`deleted_at` IS NULL;

-- View `v_current_parameters`
DROP VIEW IF EXISTS `v_current_parameters`;
CREATE OR REPLACE VIEW `v_current_parameters` AS
SELECT
  `pv`.`id` AS `version_id`,
  `pv`.`valid_from` AS `valid_from`,
  `pv`.`valid_to` AS `valid_to`,
  `pv`.`installments_window_from` AS `installments_window_from`,
  `pv`.`installments_window_to` AS `installments_window_to`,
  `pv`.`payment_period_days` AS `payment_period_days`,
  `lc`.`id` AS `level_config_id`,
  `lc`.`level_scope` AS `level_scope`,
  `lc`.`max_payments_sin_interes` AS `max_payments_sin_interes`,
  `lc`.`max_payments_con_interes` AS `max_payments_con_interes`,
  `lrr`.`payment_count` AS `payment_count`,
  `lrr`.`rate_monthly` AS `rate_monthly`,
  `ipr`.`modality` AS `modality`,
  `ipr`.`extra_installments` AS `extra_installments`,
  `ipr`.`initial_pct_required` AS `initial_pct_required`
FROM `parameter_versions` `pv`
JOIN `level_configs` `lc` ON `lc`.`parameter_version_id` = `pv`.`id`
LEFT JOIN `level_rate_rules` `lrr` ON `lrr`.`level_config_id` = `lc`.`id`
LEFT JOIN `initial_payment_rules` `ipr`
  ON `ipr`.`parameter_version_id` = `pv`.`id`
  AND `ipr`.`level` = `lc`.`level_scope`
WHERE `pv`.`valid_from` <= CURDATE()
  AND (`pv`.`valid_to` IS NULL OR `pv`.`valid_to` >= CURDATE())
  AND `lc`.`is_active` = 1
  AND `lc`.`valid_from` <= CURDATE()
  AND (`lc`.`valid_to` IS NULL OR `lc`.`valid_to` >= CURDATE());

-- View `v_export_summary`
DROP VIEW IF EXISTS `v_export_summary`;
CREATE OR REPLACE VIEW `v_export_summary` AS
SELECT
  `el`.`id` AS `id`,
  `el`.`format` AS `format`,
  `el`.`content_flags` AS `content_flags`,
  `el`.`exported_at` AS `exported_at`,
  `el`.`ip_address` AS `ip_address`,
  `el`.`file_name` AS `file_name`,
  `u`.`first_name` AS `exported_by_name`,
  `u`.`role` AS `exported_by_role`,
  `s`.`academic_period` AS `academic_period`,
  `s`.`level` AS `level`,
  `s`.`modality` AS `modality`,
  `s`.`total_paid` AS `total_paid`
FROM `export_logs` `el`
JOIN `users` `u` ON `el`.`user_id` = `u`.`id`
JOIN `simulations` `s` ON `el`.`simulation_id` = `s`.`id`;

-- View `v_valid_tokens`
DROP VIEW IF EXISTS `v_valid_tokens`;
CREATE OR REPLACE VIEW `v_valid_tokens` AS
SELECT
  `id`,
  `user_id`,
  `token_hash`,
  `expires_at`,
  `created_at`
FROM `password_reset_tokens`
WHERE `used_at` IS NULL
  AND `expires_at` > NOW();

-- ------------------------------------------------------------
-- Creacion de procedimientos almacenados
-- ------------------------------------------------------------

-- Los procedimientos no son llamados directamente por el backend actual; se conservan como capa SQL de consulta/reporte.
-- Se actualizaron a created_at para que no dependan de la columna legacy saved_at.

DELIMITER //

-- Procedure `sp_admin_simulation_report`
DROP PROCEDURE IF EXISTS `sp_admin_simulation_report`//
CREATE PROCEDURE `sp_admin_simulation_report`(
  IN p_level VARCHAR(20),
  IN p_modality VARCHAR(20),
  IN p_date_from DATE,
  IN p_date_to DATE
)
READS SQL DATA
BEGIN
  SELECT
    `s`.`id`,
    `s`.`created_at`,
    `s`.`level`,
    `s`.`modality`,
    `s`.`student_type`,
    `s`.`tuition_gross`,
    `s`.`tuition_net`,
    `s`.`financed_value`,
    `s`.`total_payments`,
    `s`.`total_interest`,
    `s`.`total_paid`,
    `s`.`applied_rate_monthly`,
    `u`.`first_name`,
    `u`.`last_name`,
    `u`.`email`
  FROM `simulations` `s`
  JOIN `users` `u` ON `s`.`user_id` = `u`.`id`
  WHERE `s`.`deleted_at` IS NULL
    AND (p_level IS NULL OR `s`.`level` = p_level)
    AND (p_modality IS NULL OR `s`.`modality` = p_modality)
    AND (p_date_from IS NULL OR `s`.`created_at` >= p_date_from)
    AND (p_date_to IS NULL OR `s`.`created_at` < DATE_ADD(p_date_to, INTERVAL 1 DAY))
  ORDER BY `s`.`created_at` DESC;
END//

-- Procedure `sp_get_simulation_detail`
DROP PROCEDURE IF EXISTS `sp_get_simulation_detail`//
CREATE PROCEDURE `sp_get_simulation_detail`(IN p_simulation_id CHAR(36), IN p_user_id CHAR(36))
READS SQL DATA
BEGIN
  -- Resumen de la simulacion
  SELECT `s`.*, `u`.`first_name`, `u`.`last_name`, `u`.`email`
  FROM `simulations` `s`
  JOIN `users` `u` ON `s`.`user_id` = `u`.`id`
  WHERE `s`.`id` = p_simulation_id
    AND (`s`.`user_id` = p_user_id OR (SELECT `role` FROM `users` WHERE `id` = p_user_id) = 'ADMIN')
    AND `s`.`deleted_at` IS NULL;

  -- Tabla de amortizacion asociada
  SELECT
    `payment_no`,
    `scheduled_date`,
    `payment_value`,
    `interest_value`,
    `principal_value`,
    `balance_after`
  FROM `amortization_rows`
  WHERE `simulation_id` = p_simulation_id
  ORDER BY `payment_no` ASC;
END//

-- Procedure `sp_get_user_simulations`
DROP PROCEDURE IF EXISTS `sp_get_user_simulations`//
CREATE PROCEDURE `sp_get_user_simulations`(IN p_user_id CHAR(36))
READS SQL DATA
BEGIN
  SELECT
    `s`.`id`,
    `s`.`created_at`,
    `s`.`academic_period`,
    `s`.`level`,
    `s`.`modality`,
    `s`.`student_type`,
    `s`.`tuition_net`,
    `s`.`financed_value`,
    `s`.`total_payments`,
    `s`.`total_interest`,
    `s`.`total_paid`,
    `s`.`applied_rate_monthly`
  FROM `simulations` `s`
  WHERE `s`.`user_id` = p_user_id
    AND `s`.`deleted_at` IS NULL
  ORDER BY `s`.`created_at` DESC;
END//

DELIMITER ;

SET FOREIGN_KEY_CHECKS = 1;

-- ------------------------------------------------------------
-- Validacion rapida post-ejecucion
-- ------------------------------------------------------------

CHECK TABLE users, simulations, amortization_rows, parameter_versions,
level_configs, level_rate_rules, initial_payment_rules,
audit_logs, export_logs, password_reset_tokens QUICK;

CHECKSUM TABLE simulations, audit_logs, parameter_versions EXTENDED;

-- Consultas utiles para confirmar datos de prueba:
SELECT role, COUNT(*) AS total FROM users GROUP BY role ORDER BY role;
SELECT email, role, is_active FROM users WHERE email LIKE '%.demo%@example.test' OR email LIKE 'student.hu66.%@example.test' ORDER BY role, email;
SELECT u.email, COUNT(s.id) AS simulations FROM users u LEFT JOIN simulations s ON s.user_id = u.id AND s.deleted_at IS NULL GROUP BY u.email HAVING simulations > 0 ORDER BY u.email;

SELECT COUNT(*) AS total_simulations FROM simulations;
SELECT COUNT(*) AS total_amortization_rows FROM amortization_rows;
SELECT COUNT(*) AS total_parameters FROM parameter_versions;
