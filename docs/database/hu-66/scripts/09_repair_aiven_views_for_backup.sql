DROP VIEW IF EXISTS v_active_simulations;
CREATE OR REPLACE VIEW v_active_simulations AS
SELECT
  s.id AS id,
  s.created_at AS created_at,
  s.academic_period AS academic_period,
  s.level AS level,
  s.modality AS modality,
  s.student_type AS student_type,
  s.tuition_gross AS tuition_gross,
  s.tuition_net AS tuition_net,
  s.initial_payment_value AS initial_payment_value,
  s.financed_value AS financed_value,
  s.total_payments AS total_payments,
  s.total_interest AS total_interest,
  s.total_paid AS total_paid,
  s.applied_rate_monthly AS applied_rate_monthly,
  s.student_observation AS student_observation,
  u.first_name AS first_name,
  u.last_name AS last_name,
  u.email AS email
FROM simulations s
JOIN users u ON s.user_id = u.id
WHERE s.deleted_at IS NULL;

DROP VIEW IF EXISTS v_current_parameters;
CREATE OR REPLACE VIEW v_current_parameters AS
SELECT
  pv.id AS version_id,
  pv.valid_from AS valid_from,
  pv.valid_to AS valid_to,
  pv.installments_window_from AS installments_window_from,
  pv.installments_window_to AS installments_window_to,
  pv.payment_period_days AS payment_period_days,
  lc.id AS level_config_id,
  lc.level_scope AS level_scope,
  lc.max_payments_sin_interes AS max_payments_sin_interes,
  lc.max_payments_con_interes AS max_payments_con_interes,
  lrr.payment_count AS payment_count,
  lrr.rate_monthly AS rate_monthly,
  ipr.modality AS modality,
  ipr.extra_installments AS extra_installments,
  ipr.initial_pct_required AS initial_pct_required
FROM parameter_versions pv
JOIN level_configs lc ON lc.parameter_version_id = pv.id
LEFT JOIN level_rate_rules lrr ON lrr.level_config_id = lc.id
LEFT JOIN initial_payment_rules ipr
  ON ipr.parameter_version_id = pv.id
  AND ipr.level = lc.level_scope
WHERE pv.valid_from <= CURDATE()
  AND (pv.valid_to IS NULL OR pv.valid_to >= CURDATE())
  AND lc.is_active = 1
  AND lc.valid_from <= CURDATE()
  AND (lc.valid_to IS NULL OR lc.valid_to >= CURDATE());

DROP VIEW IF EXISTS v_export_summary;
CREATE OR REPLACE VIEW v_export_summary AS
SELECT
  el.id AS id,
  el.format AS format,
  el.content_flags AS content_flags,
  el.exported_at AS exported_at,
  el.ip_address AS ip_address,
  el.file_name AS file_name,
  u.first_name AS exported_by_name,
  u.role AS exported_by_role,
  s.academic_period AS academic_period,
  s.level AS level,
  s.modality AS modality,
  s.total_paid AS total_paid
FROM export_logs el
JOIN users u ON el.user_id = u.id
JOIN simulations s ON el.simulation_id = s.id;

DROP VIEW IF EXISTS v_valid_tokens;
CREATE OR REPLACE VIEW v_valid_tokens AS
SELECT
  id,
  user_id,
  token_hash,
  expires_at,
  created_at
FROM password_reset_tokens
WHERE used_at IS NULL
  AND expires_at > NOW();
