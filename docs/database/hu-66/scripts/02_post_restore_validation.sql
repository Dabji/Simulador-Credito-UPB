-- HU-66 - Validacion post-restore
-- Ejecutar sobre MariaDB 10.11.10 despues de importar schema y datos.

SELECT 'database' AS item, DATABASE() AS value;
SELECT 'version' AS item, VERSION() AS value;

SELECT
  table_name,
  engine,
  table_collation,
  table_rows
FROM information_schema.tables
WHERE table_schema = DATABASE()
ORDER BY table_name;

SELECT 'users_count' AS check_name, COUNT(*) AS value FROM users;
SELECT 'admins_count' AS check_name, COUNT(*) AS value FROM users WHERE role = 'ADMIN';
SELECT 'students_count' AS check_name, COUNT(*) AS value FROM users WHERE role = 'STUDENT';
SELECT 'simulations_count' AS check_name, COUNT(*) AS value FROM simulations;
SELECT 'amortization_rows_count' AS check_name, COUNT(*) AS value FROM amortization_rows;
SELECT 'parameter_versions_count' AS check_name, COUNT(*) AS value FROM parameter_versions;
SELECT 'initial_payment_rules_count' AS check_name, COUNT(*) AS value FROM initial_payment_rules;
SELECT 'level_configs_count' AS check_name, COUNT(*) AS value FROM level_configs;
SELECT 'level_rate_rules_count' AS check_name, COUNT(*) AS value FROM level_rate_rules;

SELECT
  'simulations.academic_period_null_or_empty' AS check_name,
  COUNT(*) AS findings
FROM simulations
WHERE academic_period IS NULL OR TRIM(academic_period) = '';

SELECT
  'users.document_type_null_or_empty' AS check_name,
  COUNT(*) AS findings
FROM users
WHERE document_type IS NULL OR TRIM(document_type) = '';

SELECT
  'simulations_without_user' AS check_name,
  COUNT(*) AS findings
FROM simulations s
LEFT JOIN users u ON u.id = s.user_id
WHERE u.id IS NULL;

SELECT
  'simulations_without_parameter_version' AS check_name,
  COUNT(*) AS findings
FROM simulations s
LEFT JOIN parameter_versions pv ON pv.id = s.parameter_version_id
WHERE pv.id IS NULL;

SELECT
  'amortization_rows_without_simulation' AS check_name,
  COUNT(*) AS findings
FROM amortization_rows ar
LEFT JOIN simulations s ON s.id = ar.simulation_id
WHERE s.id IS NULL;

SELECT
  'initial_payment_rules_without_parameter_version' AS check_name,
  COUNT(*) AS findings
FROM initial_payment_rules ipr
LEFT JOIN parameter_versions pv ON pv.id = ipr.parameter_version_id
WHERE pv.id IS NULL;

SELECT
  'level_configs_without_parameter_version' AS check_name,
  COUNT(*) AS findings
FROM level_configs lc
LEFT JOIN parameter_versions pv ON pv.id = lc.parameter_version_id
WHERE pv.id IS NULL;

SELECT
  'level_rate_rules_without_level_config' AS check_name,
  COUNT(*) AS findings
FROM level_rate_rules lrr
LEFT JOIN level_configs lc ON lc.id = lrr.level_config_id
WHERE lc.id IS NULL;

CHECK TABLE
  users,
  parameter_versions,
  initial_payment_rules,
  level_configs,
  level_rate_rules,
  simulations,
  amortization_rows,
  audit_logs,
  export_logs,
  password_reset_tokens QUICK;

CHECKSUM TABLE
  simulations,
  audit_logs,
  parameter_versions EXTENDED;
