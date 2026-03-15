-- ============================================================
-- Administración de la Base de Datos
-- Simulador de Crédito Educativo — UPB
-- Sprint 2 (Financial Engine / Motor Financiero)
--
-- Contenido:
--   1. Índices de rendimiento
--   2. Vistas reutilizables
--   3. Procedimientos almacenados
--   4. Configuración de zona horaria
--   5. Purga automática de simulaciones (90 días) — Node.js
--
-- Proveedor cloud: Aiven (MySQL gestionado)
-- Restricciones conocidas del proveedor:
--   - No se permite SET GLOBAL (requiere SUPER)
--   - No se permite activar event_scheduler
--   - Timezone del servidor gestionada por Aiven
--
-- Diseño de auditoría:
--   Toda la lógica de auditoría está centralizada en el backend
--   (AuditService.ts). No se usan triggers de BD para evitar
--   duplicación y facilitar mantenimiento/depuración.
--   Eventos registrados: SIMULATION_SAVED, SIMULATION_DELETED,
--   SIMULATION_EXPORTED, UPDATE_PARAMETER_VERSION,
--   PARAMETER_RULE_UPDATED, LOGIN_SUCCESS, LOGIN_FAILED,
--   PASSWORD_RESET_REQUESTED, etc.
-- ============================================================


-- ════════════════════════════════════════════════════════════
-- 1. ÍNDICES
-- ════════════════════════════════════════════════════════════

-- Simulaciones activas por usuario, ordenadas por fecha (historial del estudiante)
ALTER TABLE simulations
  ADD INDEX IF NOT EXISTS idx_sim_user_active (user_id, deleted_at, saved_at);

-- El admin filtra por período académico
ALTER TABLE simulations
  ADD INDEX IF NOT EXISTS idx_sim_period (academic_period, deleted_at);

-- El admin filtra por nivel y modalidad (RF-25)
ALTER TABLE simulations
  ADD INDEX IF NOT EXISTS idx_sim_level_modality (level, modality, deleted_at);

-- Buscar tokens válidos no expirados y no usados
ALTER TABLE password_reset_tokens
  ADD INDEX IF NOT EXISTS idx_prt_expires (expires_at, used_at);

-- Auditoría filtrada por tipo de acción
ALTER TABLE audit_logs
  ADD INDEX IF NOT EXISTS idx_al_action_date (action, created_at);

-- El admin filtra exportaciones por formato
ALTER TABLE export_logs
  ADD INDEX IF NOT EXISTS idx_el_format_date (format, exported_at);


-- ════════════════════════════════════════════════════════════
-- 2. VISTAS
-- ════════════════════════════════════════════════════════════

-- Vista: historial activo de simulaciones (no soft-deleted)
-- Uso: panel administrativo y consultas de historial
CREATE OR REPLACE ALGORITHM = MERGE
SQL SECURITY DEFINER
VIEW v_active_simulations AS
  SELECT s.id, s.saved_at, s.academic_period, s.level, s.modality, s.student_type,
         s.tuition_gross, s.tuition_net, s.initial_payment_value,
         s.total_payments, s.total_paid, s.applied_rate_monthly,
         s.student_observation, s.user_id,
         u.first_name, u.last_name, u.email
  FROM simulations s
  JOIN users u ON s.user_id = u.id
  WHERE s.deleted_at IS NULL;

-- Vista: parámetros institucionales vigentes hoy
-- Uso: cada vez que un estudiante abre el simulador
CREATE OR REPLACE ALGORITHM = MERGE
SQL SECURITY DEFINER
VIEW v_current_parameters AS
  SELECT pv.id AS version_id, pv.valid_from, pv.valid_to,
         pv.installments_window_from, pv.installments_window_to,
         pv.payment_period_days,
         ir.level_scope, ir.rate_monthly,
         mr.modality, mr.max_total_payments, mr.min_initial_pct
  FROM parameter_versions pv
  JOIN interest_rates ir ON ir.parameter_version_id = pv.id
  JOIN modality_rules mr ON mr.parameter_version_id = pv.id
                        AND mr.level = ir.level_scope
  WHERE pv.valid_from <= CURDATE()
    AND (pv.valid_to IS NULL OR pv.valid_to >= CURDATE());

-- Vista: tokens válidos de recuperación de contraseña (no expirados, no usados)
-- Uso: validación rápida en flujo de reset password
CREATE OR REPLACE ALGORITHM = MERGE
SQL SECURITY DEFINER
VIEW v_valid_tokens AS
  SELECT id, user_id, token_hash, expires_at, created_at
  FROM password_reset_tokens
  WHERE used_at IS NULL
    AND expires_at > NOW();

-- Vista: resumen administrativo de exportaciones
-- Uso: panel de auditoría del admin
CREATE OR REPLACE ALGORITHM = MERGE
SQL SECURITY DEFINER
VIEW v_export_summary AS
  SELECT el.id, el.format, el.content_flags, el.exported_at, el.ip_address,
         u.first_name AS exported_by_name, u.role AS exported_by_role,
         s.academic_period, s.level, s.modality, s.total_paid
  FROM export_logs el
  JOIN users u ON el.user_id = u.id
  JOIN simulations s ON el.simulation_id = s.id;


-- ════════════════════════════════════════════════════════════
-- 3. PROCEDIMIENTOS ALMACENADOS
-- ════════════════════════════════════════════════════════════

-- Procedimiento: historial de simulaciones de un usuario
DROP PROCEDURE IF EXISTS sp_get_user_simulations;
DELIMITER @@
CREATE PROCEDURE sp_get_user_simulations(IN p_user_id CHAR(36))
LANGUAGE SQL
NOT DETERMINISTIC
READS SQL DATA
SQL SECURITY DEFINER
BEGIN
  SELECT s.id, s.saved_at, s.academic_period, s.level, s.modality, s.student_type,
         s.tuition_net, s.total_payments, s.total_paid, s.applied_rate_monthly
  FROM simulations s
  WHERE s.user_id = p_user_id
    AND s.deleted_at IS NULL
  ORDER BY s.saved_at DESC;
END@@
DELIMITER ;

-- Procedimiento: detalle completo de una simulación con tabla de amortización
-- Acceso: el dueño de la simulación o cualquier ADMIN
DROP PROCEDURE IF EXISTS sp_get_simulation_detail;
DELIMITER @@
CREATE PROCEDURE sp_get_simulation_detail(IN p_simulation_id CHAR(36), IN p_user_id CHAR(36))
LANGUAGE SQL
NOT DETERMINISTIC
READS SQL DATA
SQL SECURITY DEFINER
BEGIN
  DECLARE v_user_role VARCHAR(20);
  SELECT role INTO v_user_role FROM users WHERE id = p_user_id LIMIT 1;

  -- Resumen de la simulación
  SELECT s.*, u.first_name, u.last_name
  FROM simulations s
  JOIN users u ON s.user_id = u.id
  WHERE s.id = p_simulation_id
    AND (s.user_id = p_user_id OR v_user_role = 'ADMIN')
    AND s.deleted_at IS NULL;

  -- Tabla de amortización asociada
  SELECT payment_no, scheduled_date, payment_value, interest_value,
         principal_value, balance_after
  FROM amortization_rows
  WHERE simulation_id = p_simulation_id
  ORDER BY payment_no ASC;
END@@
DELIMITER ;

-- Procedimiento: reporte administrativo filtrable
-- Permite filtrar simulaciones por nivel, modalidad y rango de fechas
DROP PROCEDURE IF EXISTS sp_admin_simulation_report;
DELIMITER @@
CREATE PROCEDURE sp_admin_simulation_report(
  IN p_level       VARCHAR(20),
  IN p_modality    VARCHAR(20),
  IN p_date_from   DATE,
  IN p_date_to     DATE
)
LANGUAGE SQL
NOT DETERMINISTIC
READS SQL DATA
SQL SECURITY DEFINER
BEGIN
  SELECT s.id, s.saved_at, s.academic_period, s.level, s.modality, s.student_type,
         s.tuition_gross, s.tuition_net, s.total_payments, s.total_paid,
         s.applied_rate_monthly,
         u.first_name, u.last_name, u.email
  FROM simulations s
  JOIN users u ON s.user_id = u.id
  WHERE s.deleted_at IS NULL
    AND (p_level    IS NULL OR s.level    = p_level)
    AND (p_modality IS NULL OR s.modality = p_modality)
    AND (p_date_from IS NULL OR s.saved_at >= p_date_from)
    AND (p_date_to   IS NULL OR s.saved_at <= p_date_to)
  ORDER BY s.saved_at DESC;
END@@
DELIMITER ;


-- ════════════════════════════════════════════════════════════
-- 4. CONFIGURACIÓN DE ZONA HORARIA
-- ════════════════════════════════════════════════════════════

-- NOTA PARA AIVEN CLOUD:
-- SET GLOBAL time_zone requiere privilegio SUPER, el cual Aiven
-- no otorga a ningún usuario por política de seguridad.
-- La zona horaria se maneja de dos formas alternativas:
--
-- a) A nivel de sesión (cada conexión):
SET SESSION time_zone = '-05:00';
--
-- b) A nivel de Sequelize (backend Node.js):
--    En database.ts se configura timezone: '-05:00' que ejecuta
--    SET time_zone = '-05:00' automáticamente en cada conexión
--    del pool. Esto garantiza que TODOS los timestamps del ORM
--    se almacenen en hora colombiana (UTC-5).

-- Verificar zona horaria de la sesión actual:
SELECT
  @@SESSION.time_zone AS zona_sesion,
  NOW()               AS hora_actual;


-- ════════════════════════════════════════════════════════════
-- 5. PURGA AUTOMÁTICA DE SIMULACIONES (90 DÍAS)
-- ════════════════════════════════════════════════════════════

-- PROBLEMA:
-- Se requiere que las simulaciones con más de 90 días se oculten
-- automáticamente del sistema (soft-delete), sin eliminar datos
-- físicamente de la BD.
--
-- SOLUCIÓN IDEAL (MySQL EVENT):
-- No se puede implementar porque Aiven Cloud restringe los
-- privilegios SUPER y SYSTEM_VARIABLES_ADMIN a todos los usuarios.
-- Esto impide ejecutar SET GLOBAL event_scheduler = ON y crear
-- eventos programados.
--
-- El código SQL que se intentó ejecutar fue:
--
--   SET GLOBAL event_scheduler = ON;
--   CREATE EVENT evt_purge_old_simulations
--   ON SCHEDULE EVERY 1 DAY
--   STARTS CURRENT_TIMESTAMP
--   DO
--     UPDATE simulations
--     SET deleted_at = NOW(),
--         delete_reason = 'PURGA_AUTOMATICA_RETENCION_90_DIAS'
--     WHERE deleted_at IS NULL
--       AND TIMESTAMPDIFF(DAY, saved_at, NOW()) >= 90;
--
-- SOLUCIÓN IMPLEMENTADA (Node.js Scheduler):
-- Se creó un job programado en el backend que ejecuta la misma
-- lógica cada 24 horas usando setInterval nativo de Node.js.
--
-- Archivo: server/src/Infrastructure/scheduler/SimulationPurgeJob.ts
--
-- Comportamiento:
--   - Se inicia automáticamente al arrancar el servidor (index.ts)
--   - Primera ejecución diferida 30 segundos tras el arranque
--   - Ciclo repetitivo cada 24 horas
--   - Establece deleted_at = NOW(), deleted_by = NULL (SYSTEM),
--     delete_reason = 'PURGA_AUTOMATICA_RETENCION_90_DIAS'
--   - La auditoría (SIMULATION_DELETED con actor_type = 'SYSTEM')
--     se registra desde el propio scheduler vía AuditService.ts
--   - El intervalo usa .unref() para no impedir el shutdown del proceso
--
-- Query equivalente que ejecuta el scheduler:
--
--   UPDATE simulations
--   SET deleted_at    = NOW(),
--       deleted_by    = NULL,
--       delete_reason = 'PURGA_AUTOMATICA_RETENCION_90_DIAS'
--   WHERE deleted_at IS NULL
--     AND saved_at <= NOW() - INTERVAL 90 DAY;
