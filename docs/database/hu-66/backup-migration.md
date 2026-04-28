# HU-66 - Preparacion y backup para migracion de base de datos CTIC

## Objetivo

Preparar la base de datos del Simulador de Credito UPB para una migracion controlada hacia infraestructura CTIC, usando MariaDB 10.11.10 como version objetivo y evitando que el backend necesite permisos estructurales como `ALTER` en produccion.

La base de datos se maneja como infraestructura: el esquema, usuarios tecnicos, permisos, tablas, vistas, procedimientos y datos iniciales quedan definidos desde SQL. El backend debe operar sobre datos con permisos funcionales, no modificar la estructura al arrancar.

## Estado final de archivos

Archivos que se conservan como entregable o evidencia:

| Archivo | Proposito |
| --- | --- |
| `scripts/01_pre_migration_validation.sql` | Consultas de inventario, integridad y checksums antes del backup. |
| `scripts/02_post_restore_validation.sql` | Consultas para validar una restauracion local o en CTIC. |
| `output/01_pre_migration_validation_result.txt` | Evidencia real de validacion ejecutada contra Aiven antes del backup. |
| `output/backup_pre_migracion_aiven.sql` | Backup logico real de Aiven. Contiene datos sensibles. No subir a GitHub. |
| `scripts/00_ctic_full_deploy_mariadb_10_11.sql` | Script consolidado para CTIC: base, usuario tecnico, permisos, tablas, vistas, procedimientos y datos de prueba. |
| `scripts/09_repair_aiven_views_for_backup.sql` | Script aplicado para corregir vistas legacy en Aiven antes de generar el backup completo. |

Archivos intermedios eliminados por quedar duplicados o absorbidos por el SQL consolidado:

- `03_ctic_user_permissions_template.sql`
- `04_schema_reference_mariadb_10_11.sql`
- `05_ctic_seed_required_users.sql`
- `06_ctic_sample_data_verification_queries.sql`
- `export_hu66_backup.sh`
- `output/manual/00_ctic_full_deploy_mariadb_10_11.metadata.json`
- `output/manual/07_ctic_seed_sample_data_from_aiven.sql`
- CSV/JSON temporales de simulaciones y amortizaciones

## Herramientas usadas

En Windows se uso el cliente instalado localmente:

```cmd
C:\Program Files\MariaDB 10.11\bin\mariadb.exe
C:\Program Files\MariaDB 10.11\bin\mariadb-dump.exe
```

La base origen esta en Aiven y reporto:

```text
Servidor origen: MySQL 8.0.45
Base origen: simulador_upb
Cliente usado para dump: MariaDB dump 10.11.10
```

La version objetivo para CTIC es:

```text
MariaDB 10.11.10 sobre Red Hat Enterprise Linux 10
```

## Paso 1 - Inventario y validacion pre-migracion

Se ejecuto `scripts/01_pre_migration_validation.sql` contra Aiven para revisar:

- version de motor origen
- tablas existentes
- motores y collations
- columnas y nulabilidad
- llaves foraneas
- conteos principales
- valores nulos o vacios en columnas endurecidas
- integridad referencial basica
- `CHECK TABLE`
- `CHECKSUM TABLE`

Comando equivalente usado desde la raiz del proyecto:

```cmd
set MYSQL_PWD=PASSWORD_AIVEN

"C:\Program Files\MariaDB 10.11\bin\mariadb.exe" ^
  --host=simuladordecredito20261-simuladordecredito20261.e.aivencloud.com ^
  --port=13557 ^
  --user=avnadmin ^
  --ssl ^
  simulador_upb ^
  < docs\database\hu-66\scripts\01_pre_migration_validation.sql ^
  > docs\database\hu-66\output\01_pre_migration_validation_result.txt

set MYSQL_PWD=
```

Resultado conservado en:

```text
output/01_pre_migration_validation_result.txt
```

Hallazgos relevantes:

```text
users.document_type_null_or_empty = 0
simulations.academic_period_null_or_empty = 0
simulations_without_user = 0
simulations_without_parameter_version = 0
amortization_rows_without_simulation = 0
initial_payment_rules_without_parameter_version = 0
level_configs_without_parameter_version = 0
level_rate_rules_without_level_config = 0
CHECK TABLE = OK en users, simulations, amortization_rows, parameter_versions,
level_configs, level_rate_rules, initial_payment_rules, audit_logs, export_logs,
password_reset_tokens
```

Checksums registrados antes de migracion:

```text
simulations = 672182402
audit_logs = 4119862177
parameter_versions = 1442779204
```

Estos checksums no son conteos de filas; son huellas de integridad para comparar antes y despues.

## Paso 2 - Analisis de tablas principales

El inventario confirmo las tablas funcionales del sistema:

| Tabla | Rol en el sistema |
| --- | --- |
| `users` | Usuarios estudiantes y administradores. Incluye `document_type` como `ENUM('CC','CE','DE','PA','PE','PT','RC','TI','VI') NOT NULL`. |
| `parameter_versions` | Versiones de parametros financieros vigentes o historicas. |
| `initial_payment_rules` | Reglas de cuota inicial por nivel, modalidad y numero de cuotas. |
| `level_configs` | Configuracion activa por nivel academico. |
| `level_rate_rules` | Tasas mensuales por configuracion y numero de pagos. |
| `simulations` | Simulaciones guardadas por estudiantes. Usa `created_at` como fecha oficial. |
| `amortization_rows` | Filas de amortizacion asociadas a cada simulacion. |
| `audit_logs` | Auditoria funcional de acciones relevantes. |
| `export_logs` | Registro de exportaciones PDF/CSV. |
| `password_reset_tokens` | Tokens de recuperacion de password. |

Durante la preparacion se ratifico que `saved_at` ya no debe usarse. La fecha oficial de simulacion es `created_at`.

## Paso 3 - Reparacion de vistas legacy en Aiven

Al intentar generar el backup completo, `mariadb-dump` fallo porque Aiven tenia vistas legacy invalidas. El error fue:

```text
View 'simulador_upb.v_active_simulations' references invalid table(s) or column(s)
```

La causa era deuda tecnica anterior:

- `v_active_simulations` apuntaba a `saved_at`.
- `v_current_parameters` apuntaba a tablas antiguas como `interest_rates` y `modality_rules`.

Se corrigieron las vistas en Aiven con:

```text
scripts/09_repair_aiven_views_for_backup.sql
```

Vistas reparadas:

```text
v_active_simulations
v_current_parameters
v_export_summary
v_valid_tokens
```

Validacion posterior de vistas:

```text
v_active_simulations = 30 filas
v_current_parameters = 20 filas
v_export_summary = 36 filas
v_valid_tokens = 0 filas
```

Despues de esto el backup completo pudo generarse incluyendo vistas.

## Paso 4 - Backup logico real de Aiven

Se genero un backup logico completo desde Aiven con `mariadb-dump`:

```cmd
set MYSQL_PWD=PASSWORD_AIVEN

"C:\Program Files\MariaDB 10.11\bin\mariadb-dump.exe" ^
  --host=simuladordecredito20261-simuladordecredito20261.e.aivencloud.com ^
  --port=13557 ^
  --user=avnadmin ^
  --ssl ^
  --single-transaction ^
  --routines ^
  --triggers ^
  --events ^
  --default-character-set=utf8mb4 ^
  --hex-blob ^
  simulador_upb ^
  > docs\database\hu-66\output\backup_pre_migracion_aiven.sql

set MYSQL_PWD=
```

Archivo generado:

```text
output/backup_pre_migracion_aiven.sql
```

Tamanio registrado:

```text
1.994.555 bytes
```

El backup contiene:

```text
10 CREATE TABLE
INSERTS de datos
vistas
procedimientos almacenados
triggers/eventos si existen
```

Advertencia: este archivo contiene datos reales, correos, hashes y simulaciones. Debe permanecer fuera de GitHub.

## Paso 5 - Script consolidado para CTIC

El script de despliegue institucional esta en:

```text
scripts/00_ctic_full_deploy_mariadb_10_11.sql
```

Incluye:

- `CREATE DATABASE IF NOT EXISTS simulador_credito_upb`
- usuario tecnico `simulador_app`
- permisos funcionales: `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `EXECUTE`
- tablas del esquema actual
- usuarios administradores y estudiantes de prueba
- parametros financieros
- simulaciones y amortizaciones de ejemplo
- vistas compatibles con MariaDB 10.11.10
- procedimientos almacenados compatibles con `created_at`
- validaciones finales `CHECK TABLE` y `CHECKSUM TABLE`

El usuario tecnico no debe recibir `ALTER`. CTIC ejecuta el DDL con usuario administrador/root y luego el backend usa `simulador_app` solo para operar datos.

Comando esperado en CTIC:

```bash
mariadb -u root -p < docs/database/hu-66/scripts/00_ctic_full_deploy_mariadb_10_11.sql
```

Antes de ejecutar, CTIC debe reemplazar:

```sql
${DB_APP_PASSWORD}
```

por la clave real del usuario tecnico institucional.

## Paso 6 - Prueba local en MariaDB 10.11.10

Durante la preparacion se probo el script consolidado en una instalacion local de MariaDB 10.11.10. Esa prueba permitio detectar dos puntos importantes:

1. DBeaver debe ejecutar el archivo como script completo, no como sentencia aislada.
2. El backend intentaba ejecutar una migracion legacy `updateDocumentTypesMigration` al arrancar.

El problema del backend era que intentaba ejecutar:

```sql
ALTER TABLE users MODIFY COLUMN document_type ...
```

Eso falla correctamente con `simulador_app`, porque ese usuario no debe tener permiso `ALTER`.

Se elimino la ejecucion automatica de esa migracion desde `server/src/index.ts` y se retiro el archivo legacy `updateDocumentTypes.ts`.

Validaciones backend realizadas despues:

```text
npm.cmd run build = PASS
npm.cmd run test -- --runInBand = PASS
10 test suites passed
94 tests passed
```

Smoke test funcional:

```text
GET /api/parameters/active = 200
POST /api/simulator/preview = 200
POST /api/simulator/save = 200
GET /api/simulator/history = 200
audit_logs incremento de 1412 a 1413
```

Login estudiante no se pudo confirmar por no tener una contrasena valida conocida para esa BD. Login admin llego al flujo LDAP, pero el LDAP institucional respondio timeout desde el entorno local. Esto no esta relacionado con HU-66.

## Paso 7 - Validacion post-restauracion

Despues de restaurar el backup o ejecutar el script consolidado, se debe correr:

```cmd
"C:\Program Files\MariaDB 10.11\bin\mariadb.exe" ^
  -u root ^
  -p ^
  simulador_credito_upb ^
  < docs\database\hu-66\scripts\02_post_restore_validation.sql ^
  > docs\database\hu-66\output\02_post_restore_validation_result.txt
```

En CTIC, ajustando host, puerto y usuario:

```bash
mariadb -h HOST_CTIC -P 3306 -u USUARIO_ADMIN -p simulador_credito_upb \
  < docs/database/hu-66/scripts/02_post_restore_validation.sql \
  > docs/database/hu-66/output/02_post_restore_validation_result.txt
```

Se espera:

```text
CHECK TABLE = OK
conteos coherentes
sin NULL/vacios en users.document_type
sin NULL/vacios en simulations.academic_period
sin registros huerfanos en relaciones principales
```

## Configuracion esperada del backend contra CTIC

El `.env` del backend debe quedar apuntando a CTIC, no a Aiven:

```env
DB_HOST=<host_ctic>
DB_PORT=3306
DB_NAME=simulador_credito_upb
DB_USER=simulador_app
DB_PASSWORD=<password_definida_por_ctic>
DB_SSL=false
```

Si CTIC exige SSL, `DB_SSL` debe ajustarse segun la configuracion institucional.

## Checklist final para entrega

Antes de entregar a CTIC:

1. Confirmar que `scripts/00_ctic_full_deploy_mariadb_10_11.sql` tiene el nombre de base deseado.
2. Confirmar que `${DB_APP_PASSWORD}` fue reemplazado por CTIC o documentado como placeholder.
3. Entregar el script consolidado a CTIC por canal seguro.
4. No subir `output/backup_pre_migracion_aiven.sql` a GitHub.
5. Guardar `output/01_pre_migration_validation_result.txt` como evidencia.
6. Ejecutar `scripts/02_post_restore_validation.sql` despues de restaurar o desplegar.
7. Actualizar `.env` del backend contra CTIC.
8. Probar login, parametros activos, guardado de simulacion, historial y auditoria.
9. Rotar la contrasena de Aiven si fue expuesta durante el proceso.

## Archivos sensibles

No subir a repositorio publico:

```text
output/backup_pre_migracion_aiven.sql
output/01_pre_migration_validation_result.txt
scripts/00_ctic_full_deploy_mariadb_10_11.sql
```

El directorio `docs/database/hu-66/output/` esta ignorado por Git para proteger el backup y las evidencias generadas. Los scripts de `docs/database/hu-66/scripts/` se conservan como entregables revisables.
