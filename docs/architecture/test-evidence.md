<div align="center">

# 🧪 Evidencias de Testing — Simulador de Crédito UPB

**Documento consolidado — Sprint 2 y Sprint 3**

Resultados de ejecución de las suites de pruebas automatizadas del proyecto,
incluyendo la validación de **HU-56 (Motor de Cálculo)** del **21 de abril de 2026**.

</div>

---

## Índice

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Backend — Jest + Supertest](#2-backend--jest--supertest)
3. [Frontend — Vitest + Testing Library](#3-frontend--vitest--testing-library)
4. [Cobertura de Código (Server)](#4-cobertura-de-código-server)
5. [Análisis de Cobertura](#5-análisis-de-cobertura)
6. [Estrategia de Testing](#6-estrategia-de-testing)
7. [Continuacion Sprint 3 — HU-56 Motor de Calculo](#7-continuacion-sprint-3--hu-56-motor-de-calculo)

---

## 1. Resumen Ejecutivo

| Métrica | Backend (Jest) | Frontend (Vitest) | Total |
|---|:---:|:---:|:---:|
| **Test Suites** | 4 pasaron | 2 pasaron | **6 suites** |
| **Tests** | 50 pasaron | 6 pasaron | **56 tests** |
| **Failures** | 0 ❌ | 0 ❌ | **0 failures** |
| **Duración** | 6.19s | 2.37s | **~8.5s** |
| **Resultado** | ✅ PASS | ✅ PASS | ✅ **ALL PASS** |

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

| Suite | Archivo | Tests | Estado |
|---|---|:---:|:---:|
| **SimulationEngine** | `SimulationEngine.test.ts` | ~20 | ✅ PASS |
| **AuditLog** | `AuditLog.test.ts` | ~10 | ✅ PASS |
| **AuditService** | `AuditService.test.ts` | ~10 | ✅ PASS |
| **SimulationPurgeJob** | `SimulationPurgeJob.test.ts` | ~10 | ✅ PASS |

### Qué se testea en el backend

| Componente | Tipo de test | Cobertura funcional |
|---|---|---|
| `SimulationEngine` | Unitario | Cálculo de amortización francesa, modalidad sin interés, normalización de input (#57 UPB Tech, #59 forzar sin interés), fórmula PMT, redondeo monetario, fechas por calendario |
| `AuditLog` | Unitario | Registro de eventos (LOGIN_SUCCESS, LOGIN_FAILED, ACCESS_DENIED), formato de payload, campos obligatorios |
| `AuditService` | Unitario | Extracción de IP, formateo de detalles, manejo de errores en logging |
| `SimulationPurgeJob` | Unitario | Purga por batch, respeto del umbral de 90 días, conteo de registros purgados, logging de auditoría |

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

| Suite | Archivo | Tests | Estado |
|---|---|:---:|:---:|
| **FullPageSpinner** | `FullPageSpinner.test.tsx` | 3 | ✅ PASS |
| **ProtectedRoute** | `ProtectedRoute.test.tsx` | 3 | ✅ PASS |

### Qué se testea en el frontend

| Componente | Tipo de test | Cobertura funcional |
|---|---|---|
| `FullPageSpinner` | Componente | Renderizado del spinner, visibilidad del texto de carga, estilos de animación |
| `ProtectedRoute` | Componente | Redirección a `/login` sin token, acceso con rol correcto, denegación con rol incorrecto |

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

| Componente | Statements | Branches | Functions | Lines | Análisis |
|---|:---:|:---:|:---:|:---:|---|
| `SimulationEngine.ts` | 92.64% | 86.66% | 81.81% | 92.18% | ✅ **Motor financiero** — componente más crítico, alta cobertura |
| `AuditService.ts` | 93.33% | 72.22% | 100% | 93.33% | ✅ Servicio de auditoría — alta cobertura (líneas 40-67,76 sin cubrir) |
| `FrenchAmortizationStrategy.ts` | 81.25% | 50% | 100% | 92.85% | ✅ Estrategia de amortización francesa |
| `NoInterestStrategy.ts` | 80% | 66.66% | 100% | 100% | ✅ Estrategia sin intereses |
| `constants.ts` | 100% | 100% | 100% | 100% | ✅ Constantes de dominio completamente cubiertas |

### Componentes con Cobertura Baja — Plan de Mejora

| Componente | Motivo | Plan |
|---|---|---|
| **Use Cases** (6.93%) | Requieren mocks de repositorios Sequelize | Sprint 3: Agregar tests con mocks de BD |
| **DTOs/Schemas** (14.81%) | Esquemas Zod son declarativos, difíciles de "ejecutar" en unit test | Cubrir via tests de integración de endpoints |
| **Export Services** (5.66%) | `SimulationPdfBuilder` genera binarios complejos | Sprint 3: Snapshot testing del output PDF |
| **Core Entities** (13.38%) | Entidades con factory methods sin uso directo en tests actuales | Sprint 3: Tests de dominio puro |

### Priorización de Testing

```mermaid
graph LR
    subgraph ALTA["✅ Cobertura Alta (Sprint 2)"]
        A["SimulationEngine<br/>92%"]
        B["InterestStrategies<br/>81-94%"]
        C["AuditService<br/>93%"]
        D["PurgeJob<br/>tested"]
    end

    subgraph MEDIA["🟡 Próximo Sprint"]
        E["Use Cases<br/>(con mocks BD)"]
        F["Export Services<br/>(snapshot tests)"]
    end

    subgraph FUTURA["🔴 Backlog"]
        G["Integration Tests<br/>(endpoint a endpoint)"]
        H["E2E Tests<br/>(Playwright)"]
    end

    ALTA --> MEDIA --> FUTURA

    style ALTA fill:#D1FAE5,stroke:#065F46,color:#000
    style MEDIA fill:#FEF3C7,stroke:#92400E,color:#000
    style FUTURA fill:#FEE2E2,stroke:#991B1B,color:#000
```

---

## 6. Estrategia de Testing

### Pirámide de Testing del Proyecto

```mermaid
graph TD
    E2E["🔺 E2E Tests<br/>(Playwright — futuro)<br/>Flujos completos usuario"]
    INT["🔶 Integration Tests<br/>(Supertest — parcial)<br/>Endpoints HTTP + BD"]
    UNIT["🟩 Unit Tests<br/>(Jest + Vitest — activo)<br/>Engine, Strategies, Services, Components"]

    E2E --- INT
    INT --- UNIT

    style E2E fill:#FEE2E2,stroke:#991B1B,color:#000
    style INT fill:#FEF3C7,stroke:#92400E,color:#000
    style UNIT fill:#D1FAE5,stroke:#065F46,color:#000
```

### Herramientas por Capa

| Capa | Herramienta | Estado | Archivos |
|---|---|---|---|
| **Unit (Backend)** | Jest | ✅ Activo (50 tests) | `server/src/Application/__tests__/*.test.ts` |
| **Unit (Frontend)** | Vitest + Testing Library | ✅ Activo (6 tests) | `client/src/**/__tests__/*.test.tsx` |
| **Integration** | Supertest | 🟡 Parcial | Endpoints auth + simulator |
| **E2E** | Playwright | 🔴 Planificado | Sprint 3+ |

### Convenciones de Testing

| Regla | Descripción |
|---|---|
| **Ubicación** | Tests al lado del código: `__tests__/NombreArchivo.test.ts` |
| **Naming** | `describe('Componente')` → `it('should + comportamiento esperado')` |
| **Mocks** | Jest mocks para dependencias externas (BD, email, LDAP) |
| **Assertions** | Un assert por test cuando es posible, múltiples solo si validan el mismo comportamiento |
| **CI** | Tests de **backend** (server) ejecutados automáticamente en cada PR vía GitHub Actions |

---

## 7. Continuacion Sprint 3 — HU-56 Motor de Calculo

Documento actualizado con la ejecucion real de pruebas unitarias del backend realizada el **21 de abril de 2026** sobre el workspace actual del proyecto.

### 7.1 Resumen Ejecutivo

La HU-56 quedo implementada y verificada con enfoque unitario sobre el nucleo financiero, sin mezclar UI, HTTP ni persistencia real.

Resultado de ejecucion del backend:

| Metrica | Resultado |
|---|---:|
| Test Suites | 10 passed |
| Tests | 94 passed |
| Failures | 0 |
| Resultado final | PASS |

Cobertura mas relevante para HU-56:

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

### 7.2 Comandos Ejecutados

Comando de validacion puntual para las suites nuevas de HU-56:

```powershell
npm.cmd test -- --runInBand --runTestsByPath src/Application/__tests__/SimulationService.test.ts src/Application/__tests__/FrenchAmortizationStrategy.test.ts src/Application/__tests__/NoInterestStrategy.test.ts src/Application/__tests__/ValidationSchemas.test.ts
```

Resultado:

```text
Test Suites: 4 passed, 4 total
Tests:       18 passed, 18 total
Snapshots:   0 total
```

Comando de validacion completa del backend:

```powershell
npm.cmd test -- --runInBand
```

Resultado:

```text
Test Suites: 10 passed, 10 total
Tests:       94 passed, 94 total
Snapshots:   0 total
Time:        4.766 s
```

Comando de cobertura:

```powershell
npm.cmd run test:coverage -- --runInBand
```

Resultado:

```text
Test Suites: 10 passed, 10 total
Tests:       94 passed, 94 total
Snapshots:   0 total
Time:        5.397 s
```

### 7.3 Suites Relevantes para HU-56

| Suite | Archivo | Enfoque |
|---|---|---|
| `SimulationEngine` | `server/src/Application/__tests__/SimulationEngine.test.ts` | Formula PMT, modalidad sin interes, redondeos, totales, reglas institucionales y fechas |
| `SimulationService` | `server/src/Application/__tests__/SimulationService.test.ts` | Validaciones de cuota inicial, periodo, financiado y reglas de negocio previas al calculo |
| `FrenchAmortizationStrategy` | `server/src/Application/__tests__/FrenchAmortizationStrategy.test.ts` | Bordes del calculo con interes |
| `NoInterestStrategy` | `server/src/Application/__tests__/NoInterestStrategy.test.ts` | Bordes del calculo sin interes |
| `ValidationSchemas` | `server/src/Application/__tests__/ValidationSchemas.test.ts` | Validaciones Zod/DTO de simulacion, login, registro y reset |

### 7.4 Trazabilidad HU-56

La siguiente matriz mapea los **14 casos unitarios priorizados** del anexo operativo contra la evidencia automatizada implementada en el proyecto.

| ID | Regla del diseno | Evidencia automatizada | Estado |
|---|---|---|---|
| `U-01` | Cuota lineal sin interes = financiado / (n-1) | `SimulationEngine.test.ts`: `debe calcular cuota lineal = financedValue / (n-1)`, `debe generar numberOfPayments-1 filas en la tabla (#58)`, `debe tener interest = 0 en todas las filas sin interes` | PASS |
| `U-02` | Formula PMT francesa con interes | `SimulationEngine.test.ts`: `debe calcular cuota fija con formula M = P*r*(1+r)^n / ((1+r)^n - 1)`, `totalInterest debe ser la suma de todos los intereses del plan`, `totalPaid debe incluir la cuota inicial mas la suma de cuotas con interes` | PASS |
| `U-03` | UPB Tech ignora beca | `SimulationEngine.test.ts`: `#57 - upbTech debe ignorar beca (scholarshipPct -> 0)` | PASS |
| `U-04` | Cuota inicial minima pregrado | `SimulationService.test.ts`: `rechaza pregrado cuando la cuota inicial es menor al 20%` | PASS |
| `U-05` | Cuota inicial minima UPB Tech | `SimulationService.test.ts`: `rechaza UPB Tech cuando la cuota inicial es menor al 15%` | PASS |
| `U-06` | Forzar sin interes cuando n <= 3 | `SimulationEngine.test.ts`: `#59 - forzar sin_interes si numberOfPayments <= 3 y se envio con_interes` | PASS |
| `U-07` | Ultimo saldo exactamente en cero | `SimulationEngine.test.ts`: `la ultima fila debe tener finalBalance = 0 (absorbe residuo de redondeo)` | PASS |
| `U-08` | Totales consistentes | `SimulationEngine.test.ts`: `totalPaid debe incluir la cuota inicial + suma del plan`, `totalInterest debe ser la suma de todos los intereses del plan`, `totalPaid debe incluir la cuota inicial mas la suma de cuotas con interes` | PASS |
| `U-09` | Fechas consecutivas validas y error si el mes esta fuera del periodo | `SimulationEngine.test.ts`: `debe avanzar mes a mes desde firstPaymentMonth`, `debe cruzar año correctamente (dic -> ene)`; `SimulationService.test.ts`: `rechaza un mes de primera cuota que no pertenece al periodo academico` | PASS |
| `U-10` | Bordes FrenchAmortizationStrategy: P=0, n=0, r=0, r~0 | `FrenchAmortizationStrategy.test.ts`: `retorna 0 cuando el principal es 0`, `retorna 0 cuando el numero de cuotas es 0`, `cae a cuota lineal cuando la tasa es 0`, `cae a cuota lineal cuando la tasa es practicamente 0` | PASS |
| `U-11` | Bordes NoInterestStrategy: P/n, P=0, n=0 | `NoInterestStrategy.test.ts`: `calcula P / n para cuota sin interes`, `retorna 0 cuando el principal es 0`, `retorna 0 cuando el numero de cuotas es 0` | PASS |
| `U-12` | Validaciones Zod criticas de simulacion y registro | `ValidationSchemas.test.ts`: `rechaza payload invalido de simulacion para pregrado con cuota inicial menor al 20%`, `rechaza registro con formato de documento invalido para el tipo seleccionado` | PASS |
| `U-13` | Validacion Zod de login | `ValidationSchemas.test.ts`: `rechaza login con correo vacio, contraseña vacia o rol invalido` | PASS |
| `U-14` | Validacion Zod de reset | `ValidationSchemas.test.ts`: `rechaza reset de contraseña con token faltante y confirmacion inconsistente` | PASS |

### 7.5 Hallazgos Tecnicos Relevantes

Durante la implementacion y verificacion de HU-56 se identificaron y resolvieron hallazgos que impactaban la confiabilidad del backend:

1. Se corrigio la validacion de `SimulationService` para detectar correctamente cuando la cuota inicial supera la matricula neta.
2. Se cerro la migracion `savedAt -> createdAt` en los puntos que aun bloqueaban la suite completa del backend.
3. Se ejecuto Jest en modo serial con `--runInBand` para evitar el error de sandbox `spawn EPERM` en PowerShell.

### 7.6 Conclusion

La HU-56 queda soportada por una base de pruebas unitarias repetible, aislada y trazable contra el diseno de pruebas. Los **14 casos priorizados** del anexo operativo se encuentran cubiertos y la ejecucion real del backend finalizo en estado **PASS**.

Como resultado, el motor de calculo del simulador queda validado en sus reglas mas sensibles:

- modalidad sin interes
- modalidad con interes
- redondeos y saldo final
- totales
- fechas
- reglas institucionales
- validaciones previas al calculo
- validaciones Zod de entrada relacionadas

### 7.7 Evidencias Visuales por Caso (HU-56)

#### CP-U01
![](assets/evidencias/image1.jpeg)
![](assets/evidencias/image2.jpeg)

#### CP-U02
![](assets/evidencias/image3.jpeg)
![](assets/evidencias/image4.jpeg)
![](assets/evidencias/image5.jpeg)
![](assets/evidencias/image6.jpeg)

#### CP-U03
![](assets/evidencias/image7.jpeg)
![](assets/evidencias/image8.jpeg)

#### CP-U04
![](assets/evidencias/image9.jpeg)
![](assets/evidencias/image10.jpeg)

#### CP-U05
![](assets/evidencias/image11.jpeg)
![](assets/evidencias/image12.jpeg)

#### CP-U06
![](assets/evidencias/image13.jpeg)
![](assets/evidencias/image14.jpeg)

#### CP-U07
![](assets/evidencias/image15.jpeg)
![](assets/evidencias/image16.jpeg)
![](assets/evidencias/image17.jpeg)

#### CP-U08
![](assets/evidencias/image18.jpeg)
![](assets/evidencias/image19.jpeg)
![](assets/evidencias/image20.jpeg)
![](assets/evidencias/image21.jpeg)
![](assets/evidencias/image22.jpeg)
![](assets/evidencias/image23.jpeg)
![](assets/evidencias/image24.jpeg)
![](assets/evidencias/image25.jpeg)
![](assets/evidencias/image26.jpeg)

#### CP-U09
![](assets/evidencias/image27.jpeg)
![](assets/evidencias/image28.jpeg)

#### CP-U10
![](assets/evidencias/image29.jpeg)

#### CP-U11
![](assets/evidencias/image30.jpeg)

#### CP-U12
![](assets/evidencias/image31.jpeg)
![](assets/evidencias/image32.jpeg)
![](assets/evidencias/image33.jpeg)
![](assets/evidencias/image34.jpeg)
![](assets/evidencias/image35.jpeg)
![](assets/evidencias/image36.jpeg)

#### CP-U13
![](assets/evidencias/image37.jpeg)
![](assets/evidencias/image38.jpeg)

#### CP-U14
![](assets/evidencias/image39.jpeg)
![](assets/evidencias/image40.jpeg)

---

## Capturas de Referencia (PRs)

Las siguientes capturas provienen de Pull Requests del proyecto y evidencian la ejecución de tests en contexto real:

| Evidencia | Captura |
|---|:---:|
| Suite de tests backend completa | <img src="https://github.com/user-attachments/assets/0a9ca5d4-269d-4ab9-8978-e3919043b542" width="500" /> |
| Tests pasando exitosamente | <img src="https://github.com/user-attachments/assets/3846c775-206c-41f4-92fe-7dc33336b3bc" width="500" /> |
| Validación de seguridad API (400 + fieldErrors) | <img src="https://github.com/user-attachments/assets/88a9018e-5856-41b6-871a-53387bfd3a00" width="500" /> |
| Test de respuesta API | <img src="https://github.com/user-attachments/assets/2ec10233-01db-4165-981c-22a831bed785" width="500" /> |
| Validación de esquemas Zod | <img src="https://github.com/user-attachments/assets/3c69030b-2338-4f78-a495-ee1c2d021caa" width="500" /> |
| Test de seguridad adicional | <img src="https://github.com/user-attachments/assets/46de51f4-2907-4fd4-90db-9a9817d82891" width="500" /> |
| Test cobertura completa | <img src="https://github.com/user-attachments/assets/54126681-13a4-4052-9ba0-46cd2532c5ba" width="500" /> |
| Tests de componentes frontend | <img src="https://github.com/user-attachments/assets/146a8a88-ec4e-4372-a137-e7f0fca19dbb" width="500" /> |

---

<div align="center">

> _"Si no lo puedes testear, no lo puedes mantener." — Michael Feathers_

<sub>🔙 <a href="../../README.md">Volver al README principal</a> · <a href="./technical-decisions.md">Decisiones Técnicas</a> · <a href="./system-design.md">Diseño del Sistema</a> · <a href="../README.md">Índice de Documentación</a></sub>

</div>
