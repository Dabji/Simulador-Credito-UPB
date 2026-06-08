<div align="center">

# 🗄️ Base de Datos / Database

**Modelo conceptual, modelo relacional, diccionario de datos y scripts SQL del Simulador de Crédito UPB.**

</div>

---

La persistencia del sistema se modela sobre **MySQL 8 en Aiven** para preproducción y **MariaDB/MySQL administrado por CTIC** para el entorno objetivo.

## 🧩 Modelo relacional / Relational Model

<div align="center">
  <img src="./relational-model.png" alt="Modelo relacional del Simulador de Crédito UPB" width="920" />
</div>

El archivo legacy [`er-diagram.png`](./er-diagram.png) y la imagen histórica [`diagrama simulador.png`](./diagrama%20simulador.png) apuntan al mismo modelo actualizado para mantener compatibilidad con enlaces previos.

## 🧠 Modelo conceptual / Conceptual Model

<div align="center">
  <img src="./conceptual-model.png" alt="Modelo conceptual del Simulador de Crédito UPB" width="920" />
</div>

## 📌 Tablas principales / Main Tables

| Tabla | Propósito |
|---|---|
| `users` | Usuarios estudiantes, administradores e invitados persistidos. |
| `simulations` | Cabecera de simulaciones guardadas. |
| `amortization_rows` | Detalle de cuotas y saldos por simulación. |
| `parameter_versions` | Versiones de reglas financieras. |
| `level_configs` | Configuración por nivel educativo. |
| `level_rate_rules` | Tasas por número de pagos. |
| `initial_payment_rules` | Reglas de cuota inicial por nivel y modalidad. |
| `audit_logs` | Auditoría de acciones relevantes. |
| `export_logs` | Trazabilidad de exportaciones PDF/CSV. |
| `password_reset_tokens` | Tokens temporales de recuperación de contraseña. |

## 📁 Archivos / Files

| Archivo | Propósito |
|---|---|
| [`data-dictionary.html`](./data-dictionary.html) | Diccionario de tablas, columnas, tipos y restricciones. |
| [`hu-66/backup-migration.md`](./hu-66/backup-migration.md) | Procedimiento de preparación, backup y migración CTIC. |
| [`hu-66/scripts/00_ctic_full_deploy_mariadb_10_11.sql`](./hu-66/scripts/00_ctic_full_deploy_mariadb_10_11.sql) | Script consolidado de despliegue de base de datos. |
| [`hu-66/scripts/01_pre_migration_validation.sql`](./hu-66/scripts/01_pre_migration_validation.sql) | Consultas de integridad antes de migrar. |
| [`hu-66/scripts/02_post_restore_validation.sql`](./hu-66/scripts/02_post_restore_validation.sql) | Validación posterior a restauración. |

## 🛡️ Consideraciones CTIC / CTIC Notes

- Puerto por defecto de MariaDB/MySQL: `3306`.
- La base de datos no debe exponerse públicamente.
- El usuario técnico del backend no debe requerir permisos estructurales en operación normal.
- Dumps reales, certificados y resultados sensibles deben mantenerse fuera de Git.
