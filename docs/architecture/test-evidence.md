<div align="center">

# 🧪 Evidencias de Testing — Simulador de Crédito UPB

**Sprint 2 — Financial Engine**

Resultados de ejecución de las suites de pruebas automatizadas del proyecto,
capturados el **24 de marzo de 2026**.

</div>

---

## Índice

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Backend — Jest + Supertest](#2-backend--jest--supertest)
3. [Frontend — Vitest + Testing Library](#3-frontend--vitest--testing-library)
4. [Cobertura de Código (Server)](#4-cobertura-de-código-server)
5. [Análisis de Cobertura](#5-análisis-de-cobertura)
6. [Estrategia de Testing](#6-estrategia-de-testing)
7. [Evidencia Documental - HU-57 Integracion](#7-evidencia-documental---hu-57-integracion)

---

## 1. Resumen Ejecutivo

| Métrica         | Backend (Jest) | Frontend (Vitest) |      Total      |
| --------------- | :------------: | :---------------: | :-------------: |
| **Test Suites** |   4 pasaron    |     2 pasaron     |  **6 suites**   |
| **Tests**       |   50 pasaron   |     6 pasaron     |  **56 tests**   |
| **Failures**    |      0 ❌      |       0 ❌        | **0 failures**  |
| **Duración**    |     6.19s      |       2.37s       |    **~8.5s**    |
| **Resultado**   |    ✅ PASS     |      ✅ PASS      | ✅ **ALL PASS** |

---

## 2. Backend — Jest + Supertest

### Comando ejecutado

```bash
npm run test --workspace=server
# Equivale a: jest --forceExit --detectOpenHandles
```

### Salida completa de la terminal

```
 PASS  src/Application/__tests__/AuditLog.test.ts
 PASS  src/Application/__tests__/SimulationEngine.test.ts
 PASS  src/Application/__tests__/SimulationPurgeJob.test.ts
 PASS  src/Application/__tests__/AuditService.test.ts

Test Suites: 4 passed, 4 total
Tests:       50 passed, 50 total
Snapshots:   0 total
Time:        6.187 s
Ran all test suites.
```

### Suites de Test del Backend

| Suite                  | Archivo                      | Tests | Estado  |
| ---------------------- | ---------------------------- | :---: | :-----: |
| **SimulationEngine**   | `SimulationEngine.test.ts`   |  ~20  | ✅ PASS |
| **AuditLog**           | `AuditLog.test.ts`           |  ~10  | ✅ PASS |
| **AuditService**       | `AuditService.test.ts`       |  ~10  | ✅ PASS |
| **SimulationPurgeJob** | `SimulationPurgeJob.test.ts` |  ~10  | ✅ PASS |

### Qué se testea en el backend

| Componente           | Tipo de test | Cobertura funcional                                                                                                                                                            |
| -------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `SimulationEngine`   | Unitario     | Cálculo de amortización francesa, modalidad sin interés, normalización de input (#57 UPB Tech, #59 forzar sin interés), fórmula PMT, redondeo monetario, fechas por calendario |
| `AuditLog`           | Unitario     | Registro de eventos (LOGIN_SUCCESS, LOGIN_FAILED, ACCESS_DENIED), formato de payload, campos obligatorios                                                                      |
| `AuditService`       | Unitario     | Extracción de IP, formateo de detalles, manejo de errores en logging                                                                                                           |
| `SimulationPurgeJob` | Unitario     | Purga por batch, respeto del umbral de 90 días, conteo de registros purgados, logging de auditoría                                                                             |

---

## 3. Frontend — Vitest + Testing Library

### Comando ejecutado

```bash
npm run test --workspace=client
# Equivale a: vitest run
```

### Salida completa de la terminal

```
 RUN  v4.0.18 D:/Desarrollo/Proyectos/UPB/Simulador-Credito-UPB/client

 ✓ src/shared/components/__tests__/FullPageSpinner.test.tsx (3 tests) 187ms
 ✓ src/shared/components/__tests__/ProtectedRoute.test.tsx (3 tests) 196ms

 Test Files  2 passed (2)
      Tests  6 passed (6)
   Start at  13:04:30
   Duration  2.37s (transform 157ms, setup 407ms, import 453ms, tests 383ms, environment 2.90s)
```

### Suites de Test del Frontend

| Suite               | Archivo                    | Tests | Estado  |
| ------------------- | -------------------------- | :---: | :-----: |
| **FullPageSpinner** | `FullPageSpinner.test.tsx` |   3   | ✅ PASS |
| **ProtectedRoute**  | `ProtectedRoute.test.tsx`  |   3   | ✅ PASS |

### Qué se testea en el frontend

| Componente        | Tipo de test | Cobertura funcional                                                                      |
| ----------------- | ------------ | ---------------------------------------------------------------------------------------- |
| `FullPageSpinner` | Componente   | Renderizado del spinner, visibilidad del texto de carga, estilos de animación            |
| `ProtectedRoute`  | Componente   | Redirección a `/login` sin token, acceso con rol correcto, denegación con rol incorrecto |

---

## 4. Cobertura de Código (Server)

### Comando ejecutado

```bash
npm run test:coverage --workspace=server
# Equivale a: jest --coverage --forceExit --detectOpenHandles
```

### Reporte de cobertura

```
------------------------------------|---------|----------|---------|---------|-------------------
File                                | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
------------------------------------|---------|----------|---------|---------|-------------------
All files                           |   19.09 |    12.62 |   15.73 |   19.47 |
------------------------------------|---------|----------|---------|---------|-------------------
 Application/dtos                   |   14.81 |        0 |       0 |   14.81 |
  constants.ts                      |     100 |      100 |     100 |     100 |
  SimulationInput.ts                |       0 |        0 |       0 |       0 | 7-56
  LoginUserInput.ts                 |       0 |      100 |     100 |       0 | 6-22
  RegisterUserInput.ts              |       0 |      100 |     100 |       0 | 6-59
  ForgotPasswordInput.ts            |       0 |      100 |     100 |       0 | 6-18
  ResetPasswordInput.ts             |       0 |      100 |       0 |       0 | 6-27
  UpdateMyProfileInput.ts           |       0 |      100 |     100 |       0 | 5-37
  UpdateUserByAdminInput.ts         |     100 |      100 |     100 |     100 |
------------------------------------|---------|----------|---------|---------|-------------------
 Application/services               |   55.79 |    37.14 |      50 |   55.38 |
  AuditService.ts                   |   93.33 |    72.22 |     100 |   93.33 | 40-67,76
  SimulationEngine.ts               |   92.64 |    86.66 |   81.81 |   92.18 | 56,177,203-205
  SimulationService.ts              |       0 |        0 |       0 |       0 | 5-119
  ParameterService.ts               |       0 |        0 |       0 |       0 | 5-42
------------------------------------|---------|----------|---------|---------|-------------------
 Application/services/export        |    5.66 |        0 |       0 |    6.04 |
  SimulationCsvBuilder.ts           |    1.61 |        0 |       0 |    1.63 | 16-43,49-143
  SimulationPdfBuilder.ts           |    6.89 |        0 |       0 |    7.48 | 29-77,83-434
------------------------------------|---------|----------|---------|---------|-------------------
 Application/strategies             |   80.95 |    54.54 |     100 |   94.44 |
  FrenchAmortizationStrategy.ts     |   81.25 |       50 |     100 |   92.85 | 25
  NoInterestStrategy.ts             |      80 |    66.66 |     100 |     100 | 14
------------------------------------|---------|----------|---------|---------|-------------------
 Application/use-cases              |    6.93 |        0 |   11.11 |    7.32 |
  PreviewSimulationUseCase.ts       |       0 |        0 |       0 |       0 | 5-20
  SaveSimulationUseCase.ts          |       0 |        0 |       0 |       0 | 11-94
  AuthenticateUserUseCase.ts        |       0 |        0 |       0 |       0 | 7-167
  RegisterUserUseCase.ts            |       0 |        0 |       0 |       0 | 6-45
  ListUsersByAdminUseCase.ts        |   11.11 |        0 |       0 |   11.53 | 36-96
------------------------------------|---------|----------|---------|---------|-------------------
 Core/entities                      |   13.38 |    22.22 |    7.31 |   13.49 |
  Money.ts                          |   54.54 |    66.66 |      50 |   54.54 | 9,19,27,35-40
  AppError.ts                       |      70 |    16.66 |   28.57 |      70 | 57,63,69,75,82-83
------------------------------------|---------|----------|---------|---------|-------------------

Test Suites: 4 passed, 4 total
Tests:       50 passed, 50 total
Snapshots:   0 total
Time:        20.085 s
```

---

## 5. Análisis de Cobertura

### Componentes con Cobertura Alta (>80%)

Estos son los componentes críticos del dominio financiero, testeados exhaustivamente:

| Componente                      | Statements | Branches | Functions | Lines  | Análisis                                                               |
| ------------------------------- | :--------: | :------: | :-------: | :----: | ---------------------------------------------------------------------- |
| `SimulationEngine.ts`           |   92.64%   |  86.66%  |  81.81%   | 92.18% | ✅ **Motor financiero** — componente más crítico, alta cobertura       |
| `AuditService.ts`               |   93.33%   |  72.22%  |   100%    | 93.33% | ✅ Servicio de auditoría — alta cobertura (líneas 40-67,76 sin cubrir) |
| `FrenchAmortizationStrategy.ts` |   81.25%   |   50%    |   100%    | 92.85% | ✅ Estrategia de amortización francesa                                 |
| `NoInterestStrategy.ts`         |    80%     |  66.66%  |   100%    |  100%  | ✅ Estrategia sin intereses                                            |
| `constants.ts`                  |    100%    |   100%   |   100%    |  100%  | ✅ Constantes de dominio completamente cubiertas                       |

### Componentes con Cobertura Baja — Plan de Mejora

| Componente                  | Motivo                                                              | Plan                                         |
| --------------------------- | ------------------------------------------------------------------- | -------------------------------------------- |
| **Use Cases** (6.93%)       | Requieren mocks de repositorios Sequelize                           | Sprint 3: Agregar tests con mocks de BD      |
| **DTOs/Schemas** (14.81%)   | Esquemas Zod son declarativos, difíciles de "ejecutar" en unit test | Cubrir via tests de integración de endpoints |
| **Export Services** (5.66%) | `SimulationPdfBuilder` genera binarios complejos                    | Sprint 3: Snapshot testing del output PDF    |
| **Core Entities** (13.38%)  | Entidades con factory methods sin uso directo en tests actuales     | Sprint 3: Tests de dominio puro              |

### Priorización de Testing

| Prioridad | Alcance | Estado |
|---|---|---|
| Alta | `SimulationEngine`, estrategias de interes, `AuditService`, `PurgeJob` | Cubierto en Sprint 2. |
| Media | Use cases con mocks de base de datos, export services con snapshot tests | Recomendado como siguiente incremento. |
| Futura | Pruebas endpoint a endpoint y E2E Playwright | Backlog de mejora. |

---

## 6. Estrategia de Testing

### Pirámide de Testing del Proyecto

| Capa | Herramienta | Enfoque |
|---|---|---|
| E2E | Playwright | Futuro: flujos completos de usuario. |
| Integracion | Supertest | Endpoints HTTP y persistencia controlada. |
| Unitarias | Jest + Vitest | Motor, estrategias, servicios y componentes. |

### Herramientas por Capa

| Capa                | Herramienta              | Estado               | Archivos                                     |
| ------------------- | ------------------------ | -------------------- | -------------------------------------------- |
| **Unit (Backend)**  | Jest                     | ✅ Activo (50 tests) | `server/src/Application/__tests__/*.test.ts` |
| **Unit (Frontend)** | Vitest + Testing Library | ✅ Activo (6 tests)  | `client/src/**/__tests__/*.test.tsx`         |
| **Integration**     | Supertest                | 🟡 Parcial           | Endpoints auth + simulator                   |
| **E2E**             | Playwright               | 🔴 Planificado       | Sprint 3+                                    |

---

## 7. Evidencia Documental - HU-57 Integracion

### 7.1 Resumen Ejecutivo

| Campo | Detalle |
|---|---|
| Historia de usuario | `HU-57` |
| Documento maestro | [`docs/architecture/integration-test.md`](./integration-test.md) |
| Alcance | Integracion API (`24` casos), funcional/manual (`16` casos) y regresion basica (`7` casos), con soporte previo de ambiente (`6` validaciones) y Gate `HU-56` (`14` evidencias unitarias de apoyo) |
| Fecha de ejecucion | Ventana consolidada entre `23/04/2026` y `25/04/2026` |
| Ambiente validado | Frontend `http://localhost:5173`, backend `http://localhost:3000/api`, MySQL local, navegador + DevTools, Postman, terminal y soporte de BD/logs |
| Resultado global | ✅ `47/47 PASS` en el plan HU-57 (`24` integracion API + `16` funcional/manual + `7` regresion), con `0 FAIL` y `0 BLOCKED` |
| Observaciones generales | Cierre documental completo, sin hallazgos funcionales criticos. Se documento como observacion de ambiente la ausencia del seed `student.expected@example.test`, resuelta con uso de estudiante alternativo activo. La version de parametros operativa validada fue `52fe8170-293f-4c43-9660-f045de2daf7f` |

### 7.2 Cobertura por Bloque

| Bloque | Planificados | Ejecutados | PASS | FAIL | BLOCKED | Evidencia principal |
|---|---:|---:|---:|---:|---:|---|
| `auth` | 10 | 10 | 10 | 0 | 0 | Login, registro, logout, recovery y reset con bodies, status y token |
| `simulator` | 3 | 3 | 3 | 0 | 0 | Preview, save y validaciones del motor desde API |
| `history-export` | 3 | 3 | 3 | 0 | 0 | Historial, detalle y exportacion de simulaciones propias |
| `profile-parameters` | 3 | 3 | 3 | 0 | 0 | Perfil propio, actualizacion visible y parametros publicos |
| `admin` | 5 | 5 | 5 | 0 | 0 | Login admin, estudiantes, parametros, simulaciones y restricciones |
| `functional-manual` | 16 | 16 | 16 | 0 | 0 | Flujo HU-57 alineado con matriz oficial `F-01` a `F-16` |
| `regression` | 7 | 7 | 7 | 0 | 0 | Revalidacion final de login, preview, save, detalle, export, admin y parametros |
| **Total HU-57** | **47** | **47** | **47** | **0** | **0** | Cobertura cerrada y consolidada documentalmente |

### 7.3 Soportes Documentales Destacados

| Tipo de evidencia | Contenido consolidado | Rutas / ejemplos |
|---|---|---|
| `JSON / Body API` | Respuestas completas de auth, simulator, history-export, profile-parameters y admin | `docs/architecture/assets/evidence-integration-test/evidence-integration/auth/`, `simulator/`, `history-export/`, `profile-parameters/`, `admin/` |
| `Capturas funcionales` | Navegacion manual, storage, redirecciones, formularios, resmenes, historial, paneles student/admin | `docs/architecture/assets/evidence-integration-test/evidence-integration/functional-manual/` |
| `Regresion final` | Login estudiante/admin, preview, save, detalle, export PDF, consumo de parametros activos | `docs/architecture/assets/evidence-integration-test/evidence-integration/regression/` |
| `Archivos exportados` | PDF y CSV generados desde detalle student y modulos admin | `F-08_student_export_pdf_file_01.pdf`, `F-10_admin_students_export_csv_file_01.csv`, `F-12_admin_simulation_export_pdf_file_01.pdf`, `F-12_admin_simulation_export_csv_file_01.csv`, `R-05_export_pdf_file_01.pdf` |
| `Ambiente y prerequisitos` | Frontend, Swagger, health, parametros activos, logs de backend y consultas BD | `docs/architecture/assets/evidence-integration-test/evidence-integration/environment/` |
| `Gate HU-56` | Soporte unitario previo para reglas financieras y validaciones base | `docs/architecture/assets/evidence-unit-test/` |

### 7.4 Hallazgos y Cierre

| Item | Detalle |
|---|---|
| Hallazgo controlado 1 | El usuario esperado `student.expected@example.test` no estaba sembrado en BD; se uso `student.demo04@example.test` como estudiante alternativo activo sin bloquear HU-57 |
| Hallazgo controlado 2 | La gestion de parametros admin se recondujo sobre la version activa existente para evitar solapamiento de vigencias durante la evidencia de `I-16` |
| Estado final | HU-57 quedo documentado de forma completa en `integration-test.md`, con trazabilidad de ambiente, integracion API, funcional/manual y regresion |
| Resultado documental | Base documental cerrada, consistente con evidencias reales y lista para revision academica o de QA |

### Convenciones de Testing

| Regla          | Descripción                                                                             |
| -------------- | --------------------------------------------------------------------------------------- |
| **Ubicación**  | Tests al lado del código: `__tests__/NombreArchivo.test.ts`                             |
| **Naming**     | `describe('Componente')` → `it('should + comportamiento esperado')`                     |
| **Mocks**      | Jest mocks para dependencias externas (BD, email, LDAP)                                 |
| **Assertions** | Un assert por test cuando es posible, múltiples solo si validan el mismo comportamiento |
| **CI**         | Tests de **backend** (server) ejecutados automáticamente en cada PR vía GitHub Actions  |

---

## Capturas de Referencia (PRs)

Las siguientes capturas provienen de Pull Requests del proyecto y evidencian la ejecución de tests en contexto real:

| Evidencia                                       |                                                  Captura                                                  |
| ----------------------------------------------- | :-------------------------------------------------------------------------------------------------------: |
| Suite de tests backend completa                 | <img src="https://github.com/user-attachments/assets/0a9ca5d4-269d-4ab9-8978-e3919043b542" width="500" /> |
| Tests pasando exitosamente                      | <img src="https://github.com/user-attachments/assets/3846c775-206c-41f4-92fe-7dc33336b3bc" width="500" /> |
| Validación de seguridad API (400 + fieldErrors) | <img src="https://github.com/user-attachments/assets/88a9018e-5856-41b6-871a-53387bfd3a00" width="500" /> |
| Test de respuesta API                           | <img src="https://github.com/user-attachments/assets/2ec10233-01db-4165-981c-22a831bed785" width="500" /> |
| Validación de esquemas Zod                      | <img src="https://github.com/user-attachments/assets/3c69030b-2338-4f78-a495-ee1c2d021caa" width="500" /> |
| Test de seguridad adicional                     | <img src="https://github.com/user-attachments/assets/46de51f4-2907-4fd4-90db-9a9817d82891" width="500" /> |
| Test cobertura completa                         | <img src="https://github.com/user-attachments/assets/54126681-13a4-4052-9ba0-46cd2532c5ba" width="500" /> |
| Tests de componentes frontend                   | <img src="https://github.com/user-attachments/assets/146a8a88-ec4e-4372-a137-e7f0fca19dbb" width="500" /> |

---

<div align="center">

> _"Si no lo puedes testear, no lo puedes mantener." — Michael Feathers_

<sub>🔙 <a href="../../README.md">Volver al README principal</a> · <a href="./technical-decisions.md">Decisiones Técnicas</a> · <a href="./system-design.md">Diseño del Sistema</a> · <a href="../README.md">Índice de Documentación</a></sub>

</div>

## Sprint 3 — HU-56 Pruebas Unitarias

Documento actualizado con la ejecucion real de pruebas unitarias del backend realizada el **21 de abril de 2026**, reorganizado con base en la estructura actual de evidencias en `docs/architecture/assets/evidence-unit-test/`.

### 1. Panorama General

| Campo | Detalle |
|---|---|
| Historia de usuario | `HU-56` |
| Objetivo | Validar de forma aislada el nucleo financiero del simulador, sin mezclar UI, HTTP ni persistencia real |
| Alcance principal | `14` casos priorizados (`U-01` a `U-14`) para motor de calculo, validaciones de servicio, estrategias y esquemas Zod |
| Fecha de ejecucion base | `21/04/2026` |
| Ambiente de ejecucion | Backend local en Node.js/TypeScript con Jest sobre `server/` |
| Resultado global HU-56 | `PASS` |
| Resultado backend completo | `10` suites aprobadas, `94` pruebas aprobadas, `0` fallos |
| Evidencia principal | Carpetas `environment/`, `simulation-engine/`, `simulation-service/`, `strategies/`, `summary/` y `validation-schemas/` |

La HU-56 se enfoco en garantizar que el componente matematico y financiero mas sensible del simulador quedara cubierto por pruebas repetibles, trazables y aisladas. En terminos funcionales, se validaron modalidad sin interes, modalidad con interes, reglas institucionales, redondeos, totales, fechas y validaciones de entrada.

### 2. Ambiente y Preparacion

| Campo | Detalle |
|---|---|
| Workspace | Monorepo `Simulador-Credito-UPB` |
| Carpeta objetivo | `server/` |
| Framework de pruebas | `Jest` |
| Modo recomendado | `--runInBand` |
| Justificacion operativa | Evitar errores `spawn EPERM` en PowerShell durante ejecucion local |
| Dependencias externas | No requeridas para las suites HU-56; se usan fixtures y objetos en memoria |
| Evidencia de ambiente | `assets/evidence-unit-test/environment/backend-local-running.png` |

Evidencia de ambiente:

![](assets/evidence-unit-test/environment/backend-local-running.png)

---

### 3. Comandos Ejecutados

**Validacion puntual de suites reforzadas para HU-56**

```powershell
npm.cmd test -- --runInBand --runTestsByPath src/Application/__tests__/SimulationService.test.ts src/Application/__tests__/FrenchAmortizationStrategy.test.ts src/Application/__tests__/NoInterestStrategy.test.ts src/Application/__tests__/ValidationSchemas.test.ts
```

Resultado observado:

```text
Test Suites: 4 passed, 4 total
Tests:       18 passed, 18 total
Snapshots:   0 total
```

**Validacion completa del backend**

```powershell
npm.cmd test -- --runInBand
```

Resultado observado:

```text
Test Suites: 10 passed, 10 total
Tests:       94 passed, 94 total
Snapshots:   0 total
Time:        4.766 s
```

**Cobertura global del backend**

```powershell
npm.cmd run test:coverage -- --runInBand
```

Resultado observado:

```text
Test Suites: 10 passed, 10 total
Tests:       94 passed, 94 total
Snapshots:   0 total
Time:        5.397 s
```

Evidencia consolidada:

![](assets/evidence-unit-test/summary/jest-run-all.png)

---

### 4. Inventario de Suites Relevantes para HU-56

| Suite | Archivo | Rol dentro de HU-56 | Casos HU-56 cubiertos |
|---|---|---|---|
| `SimulationEngine` | `server/src/Application/__tests__/SimulationEngine.test.ts` | Calculo financiero central, reglas institucionales, fechas, redondeos y consistencia de totales | `U-01`, `U-02`, `U-03`, `U-06`, `U-07`, `U-08`, `U-09` |
| `SimulationService` | `server/src/Application/__tests__/SimulationService.test.ts` | Validaciones previas al calculo y restricciones de negocio | `U-04`, `U-05`, soporte parcial de `U-09` |
| `FrenchAmortizationStrategy` | `server/src/Application/__tests__/FrenchAmortizationStrategy.test.ts` | Bordes matematicos y resolucion de tasa en estrategia con interes | `U-10` |
| `NoInterestStrategy` | `server/src/Application/__tests__/NoInterestStrategy.test.ts` | Comportamiento base y bordes de estrategia sin interes | `U-11` |
| `ValidationSchemas` | `server/src/Application/__tests__/ValidationSchemas.test.ts` | Validaciones Zod/DTO de simulacion, registro, login y reset | `U-12`, `U-13`, `U-14` |

Cobertura mas relevante observada:

| Componente | Statements | Branches | Functions | Lines |
|---|---:|---:|---:|---:|
| `SimulationEngine.ts` | 92.68% | 88.00% | 83.33% | 92.30% |
| `SimulationService.ts` | 76.56% | 51.92% | 66.66% | 80.70% |
| `FrenchAmortizationStrategy.ts` | 95.45% | 90.00% | 100.00% | 94.11% |
| `NoInterestStrategy.ts` | 100.00% | 100.00% | 100.00% | 100.00% |
| `SimulationInput.ts` | 100.00% | 100.00% | 100.00% | 100.00% |
| `LoginUserInput.ts` | 100.00% | 100.00% | 100.00% | 100.00% |
| `ResetPasswordInput.ts` | 100.00% | 100.00% | 100.00% | 100.00% |
| `RegisterUserInput.ts` | 84.61% | 50.00% | 100.00% | 100.00% |

---

### 5. Trazabilidad HU-56

| ID | Regla o comportamiento | Suite / archivo | Evidencia automatizada principal | Carpeta de evidencia | Estado |
|---|---|---|---|---|---|
| `U-01` | Cuota lineal sin interes = financiado / `(n-1)` | `SimulationEngine.test.ts` | `debe calcular cuota lineal = financedValue / (n-1)` | `simulation-engine/` | `PASS` |
| `U-02` | Formula PMT francesa con interes | `SimulationEngine.test.ts` | `debe calcular cuota fija con formula M = P*r*(1+r)^n / ((1+r)^n - 1)` | `simulation-engine/` | `PASS` |
| `U-03` | UPB Tech ignora beca | `SimulationEngine.test.ts` | `#57 - upbTech debe ignorar beca (scholarshipPct -> 0)` | `simulation-engine/` | `PASS` |
| `U-04` | Cuota inicial minima pregrado | `SimulationService.test.ts` | `rechaza pregrado cuando la cuota inicial es menor al 20%` | `simulation-service/` | `PASS` |
| `U-05` | Cuota inicial minima UPB Tech | `SimulationService.test.ts` | `rechaza UPB Tech cuando la cuota inicial es menor al 15%` | `simulation-service/` | `PASS` |
| `U-06` | Forzar sin interes cuando `n <= 3` | `SimulationEngine.test.ts` | `#59 - forzar sin_interes si numberOfPayments <= 3 y se envio con_interes` | `simulation-engine/` | `PASS` |
| `U-07` | Ultimo saldo exactamente en cero | `SimulationEngine.test.ts` | `la ultima fila debe tener finalBalance = 0 (absorbe residuo de redondeo)` | `simulation-engine/` | `PASS` |
| `U-08` | Totales consistentes | `SimulationEngine.test.ts` | `totalPaid` y `totalInterest` coherentes con el cronograma | `simulation-engine/` | `PASS` |
| `U-09` | Fechas consecutivas validas y error si el mes esta fuera del periodo | `SimulationEngine.test.ts` + `SimulationService.test.ts` | avance mes a mes, cruce de ano y rechazo de mes invalido | `simulation-engine/` | `PASS` |
| `U-10` | Bordes de `FrenchAmortizationStrategy` | `FrenchAmortizationStrategy.test.ts` | principal 0, cuotas 0, tasa 0, tasa casi 0, tasa faltante | `strategies/french-amortization/` | `PASS` |
| `U-11` | Bordes de `NoInterestStrategy` | `NoInterestStrategy.test.ts` | `P/n`, principal 0, cuotas 0 | `strategies/no-interest/` | `PASS` |
| `U-12` | Validaciones Zod criticas de simulacion y registro | `ValidationSchemas.test.ts` | rechazo de payload invalido en simulacion y registro | `validation-schemas/` | `PASS` |
| `U-13` | Validacion Zod de login | `ValidationSchemas.test.ts` | rechazo por correo, password o rol invalido | `validation-schemas/` | `PASS` |
| `U-14` | Validacion Zod de reset | `ValidationSchemas.test.ts` | rechazo por token faltante y confirmacion inconsistente | `validation-schemas/` | `PASS` |

---

### 6. Cobertura Complementaria Agregada

Ademas de los `14` casos priorizados, HU-56 quedo reforzada con validaciones adicionales:

- en `SimulationService.test.ts`: regla institucional mas estricta, cuota inicial mayor que matricula neta y financiado en cero con mas cuotas
- en `FrenchAmortizationStrategy.test.ts`: tasa faltante y ausencia de `activeVersion`
- en `SimulationEngine.test.ts`: integridad de cronograma, modalidad derivada desde `levelConfigs`, tasas por nivel y consistencia de resumen

Estas validaciones complementarias no sustituyen la matriz `U-01` a `U-14`, pero fortalecen la confiabilidad del motor financiero.

---

### 7. Registro Detallado por Bloque de Evidencia

#### 7.1 `simulation-engine`

![](assets/evidence-unit-test/simulation-engine/cp-u01-sin-interes-lineal-01.png)
![](assets/evidence-unit-test/simulation-engine/cp-u01-sin-interes-lineal-jest-02.png)
![](assets/evidence-unit-test/simulation-engine/cp-u02-pmt-francesa-01.png)
![](assets/evidence-unit-test/simulation-engine/cp-u02-pmt-francesa-02.png)
![](assets/evidence-unit-test/simulation-engine/cp-u02-pmt-francesa-jest-03.png)
![](assets/evidence-unit-test/simulation-engine/cp-u02-pmt-francesa-jest-04.png)
![](assets/evidence-unit-test/simulation-engine/cp-u03-upbtech-ignora-beca-01.png)
![](assets/evidence-unit-test/simulation-engine/cp-u03-upbtech-ignora-beca-jest-02.png)
![](assets/evidence-unit-test/simulation-engine/cp-u06-forzar-sin-interes-n-menor-igual-3-01.png)
![](assets/evidence-unit-test/simulation-engine/cp-u06-forzar-sin-interes-n-menor-igual-3-jest-02.png)
![](assets/evidence-unit-test/simulation-engine/cp-u07-ultimo-saldo-cero-01.png)
![](assets/evidence-unit-test/simulation-engine/cp-u07-ultimo-saldo-cero-jest-02.png)
![](assets/evidence-unit-test/simulation-engine/cp-u07-ultimo-saldo-cero-jest-03.png)
![](assets/evidence-unit-test/simulation-engine/cp-u08-totales-consistentes-simulacion1-01.png)
![](assets/evidence-unit-test/simulation-engine/cp-u08-totales-consistentes-simulacion1-02.png)
![](assets/evidence-unit-test/simulation-engine/cp-u08-totales-consistentes-simulacion2-03.png)
![](assets/evidence-unit-test/simulation-engine/cp-u08-totales-consistentes-simulacion2-04.png)
![](assets/evidence-unit-test/simulation-engine/cp-u08-totales-consistentes-simulacion3-05.png)
![](assets/evidence-unit-test/simulation-engine/cp-u08-totales-consistentes-simulacion3-06.png)
![](assets/evidence-unit-test/simulation-engine/cp-u08-totales-consistentes-simulacion4-07.png)
![](assets/evidence-unit-test/simulation-engine/cp-u08-totales-consistentes-simulacion4-08.png)
![](assets/evidence-unit-test/simulation-engine/cp-u08-totales-consistentes-jest-09.png)
![](assets/evidence-unit-test/simulation-engine/cp-u08-totales-consistentes-jest-10.png)
![](assets/evidence-unit-test/simulation-engine/cp-u09-fechas-periodo-validos-01.png)
![](assets/evidence-unit-test/simulation-engine/cp-u09-fechas-periodo-validos-jest-02.png)

#### 7.2 `simulation-service`

![](assets/evidence-unit-test/simulation-service/cp-u04-cuota-inicial-minima-pregrado-01.png)
![](assets/evidence-unit-test/simulation-service/cp-u04-cuota-inicial-minima-pregrado-jest-02.png)
![](assets/evidence-unit-test/simulation-service/cp-u05-cuota-inicial-minima-upbtech-01.png)
![](assets/evidence-unit-test/simulation-service/cp-u05-cuota-inicial-minima-upbtech-jest-02.png)

#### 7.3 `strategies`

![](assets/evidence-unit-test/strategies/french-amortization/cp-u10-bordes-calculo-jets-01.png)
![](assets/evidence-unit-test/strategies/no-interest/cp-u11-bordes-calculo-jets-01.png)

#### 7.4 `validation-schemas`

![](assets/evidence-unit-test/validation-schemas/cp-u12-zod-simulacion-01.png)
![](assets/evidence-unit-test/validation-schemas/cp-u12-zod-simulacion-02.png)
![](assets/evidence-unit-test/validation-schemas/cp-u12-zod-simulacion-03.png)
![](assets/evidence-unit-test/validation-schemas/cp-u12-zod-registro-04.png)
![](assets/evidence-unit-test/validation-schemas/cp-u12-zod-registro-05.png)
![](assets/evidence-unit-test/validation-schemas/cp-u12-zod-simulacion-registro-jets-05.png)
![](assets/evidence-unit-test/validation-schemas/cp-u13-zod-login-01.png)
![](assets/evidence-unit-test/validation-schemas/cp-u13-zod-login-jets-02.png)
![](assets/evidence-unit-test/validation-schemas/cp-u14-zod-reset-01.png)
![](assets/evidence-unit-test/validation-schemas/cp-u14-zod-rest-jets-02.png)

#### 7.5 `summary`

![](assets/evidence-unit-test/summary/jest-run-all.png)

---

### 8. Hallazgos Tecnicos Relevantes

1. Se corrigieron validaciones de `SimulationService` para escenarios limite de cuota inicial y financiado.
2. Se cerro la migracion `savedAt -> createdAt` en los puntos que afectaban pruebas del backend.
3. Se mantuvo `--runInBand` como modo recomendado para estabilidad en PowerShell.
4. La evidencia unitaria se normalizo por bloques (`simulation-engine`, `simulation-service`, `strategies`, `validation-schemas`, `summary`).

---

### 9. Resumen Final de Cobertura

| Bloque | Casos HU-56 asociados | Estado | Observacion |
|---|---|---|---|
| `environment` | soporte de ambiente | `PASS` | backend local operativo documentado |
| `simulation-engine` | `U-01`, `U-02`, `U-03`, `U-06`, `U-07`, `U-08`, `U-09` | `PASS` | bloque central del motor financiero |
| `simulation-service` | `U-04`, `U-05` | `PASS` | validaciones previas al calculo |
| `strategies` | `U-10`, `U-11` | `PASS` | bordes matematicos de estrategias |
| `validation-schemas` | `U-12`, `U-13`, `U-14` | `PASS` | validaciones Zod/DTO criticas |
| `summary` | consolidado general | `PASS` | evidencia del run completo `10/10 suites`, `94/94 tests` |

La HU-56 queda respaldada por una base de pruebas unitarias repetible, aislada del flujo UI/API y trazable contra la matriz priorizada.

---

### 10. Anexos y Estructura de Evidencia

| Carpeta | Contenido principal |
|---|---|
| `docs/architecture/assets/evidence-unit-test/environment/` | soporte de ambiente local para ejecucion unitaria |
| `docs/architecture/assets/evidence-unit-test/simulation-engine/` | casos `U-01`, `U-02`, `U-03`, `U-06`, `U-07`, `U-08`, `U-09` |
| `docs/architecture/assets/evidence-unit-test/simulation-service/` | casos `U-04`, `U-05` |
| `docs/architecture/assets/evidence-unit-test/strategies/french-amortization/` | caso `U-10` |
| `docs/architecture/assets/evidence-unit-test/strategies/no-interest/` | caso `U-11` |
| `docs/architecture/assets/evidence-unit-test/validation-schemas/` | casos `U-12`, `U-13`, `U-14` |
| `docs/architecture/assets/evidence-unit-test/summary/` | evidencia consolidada de ejecucion total |

---

## Referencias de Documentación

<div align="center">

> _"Si no lo puedes testear, no lo puedes mantener." — Michael Feathers_

<sub>🔙 <a href="../../README.md">Volver al README principal</a> · <a href="./technical-decisions.md">Decisiones Técnicas</a> · <a href="./system-design.md">Diseño del Sistema</a> · <a href="../README.md">Índice de Documentación</a></sub>

</div>
