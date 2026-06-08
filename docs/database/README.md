# Base de Datos / Database

La persistencia del Simulador de Credito UPB se modela sobre MySQL 8 en Aiven para preproduccion y MariaDB/MySQL administrado por CTIC para el entorno objetivo.

The persistence layer uses MySQL 8 on Aiven for pre-production and CTIC-managed MariaDB/MySQL for the target institutional environment.

## Modelo relacional / Relational Model

<div align="center">
  <img src="./relational-model.png" alt="Modelo relacional del Simulador de Credito UPB" width="920" />
</div>

El archivo legacy [`er-diagram.png`](./er-diagram.png) y la imagen historica [`diagrama simulador.png`](./diagrama%20simulador.png) apuntan al mismo modelo actualizado para mantener compatibilidad con enlaces previos.

## Modelo conceptual / Conceptual Model

<div align="center">
  <img src="./conceptual-model.png" alt="Modelo conceptual del Simulador de Credito UPB" width="920" />
</div>

## Tablas principales / Main Tables

| Tabla | Proposito |
|---|---|
| `users` | Usuarios estudiantes, administradores e invitados persistidos. |
| `simulations` | Cabecera de simulaciones guardadas. |
| `amortization_rows` | Detalle de cuotas y saldos por simulacion. |
| `parameter_versions` | Versiones de reglas financieras. |
| `level_configs` | Configuracion por nivel educativo. |
| `level_rate_rules` | Tasas por numero de pagos. |
| `initial_payment_rules` | Reglas de cuota inicial por nivel y modalidad. |
| `audit_logs` | Auditoria de acciones relevantes. |
| `export_logs` | Trazabilidad de exportaciones PDF/CSV. |
| `password_reset_tokens` | Tokens temporales de recuperacion de contrasena. |

## Archivos / Files

| Archivo | Proposito |
|---|---|
| [`data-dictionary.html`](./data-dictionary.html) | Diccionario de tablas, columnas, tipos y restricciones. |
| [`hu-66/backup-migration.md`](./hu-66/backup-migration.md) | Procedimiento de preparacion, backup y migracion CTIC. |
| [`hu-66/scripts/00_ctic_full_deploy_mariadb_10_11.sql`](./hu-66/scripts/00_ctic_full_deploy_mariadb_10_11.sql) | Script consolidado de despliegue de base de datos. |
| [`hu-66/scripts/01_pre_migration_validation.sql`](./hu-66/scripts/01_pre_migration_validation.sql) | Consultas de integridad antes de migrar. |
| [`hu-66/scripts/02_post_restore_validation.sql`](./hu-66/scripts/02_post_restore_validation.sql) | Validacion posterior a restauracion. |

## Consideraciones CTIC / CTIC Notes

- Puerto por defecto de MariaDB/MySQL: `3306`.
- La base de datos no debe exponerse publicamente.
- El usuario tecnico del backend no debe requerir permisos estructurales en operacion normal.
- Dumps reales, certificados y resultados sensibles deben mantenerse fuera de Git.
