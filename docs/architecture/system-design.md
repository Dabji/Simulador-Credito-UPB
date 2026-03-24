<div align="center">

# ⚙️ Diseño del Sistema — Flujos Técnicos

**Simulador de Crédito UPB**

Documentación de los flujos de datos principales y el modelo de seguridad
implementado en la plataforma.

</div>

---

## Índice

1. [Arquitectura General del Sistema](#1-arquitectura-general-del-sistema)
2. [Flujo de Datos: Simulación de Crédito](#2-flujo-de-datos-simulación-de-crédito)
3. [Modelo de Seguridad — Defense in Depth](#3-modelo-de-seguridad--defense-in-depth)
4. [Flujo de Autenticación y Autorización](#4-flujo-de-autenticación-y-autorización)
5. [Flujo de Exportación PDF](#5-flujo-de-exportación-pdf)
6. [Ciclo de Vida de una Simulación](#6-ciclo-de-vida-de-una-simulación)
7. [Modelo de Datos](#7-modelo-de-datos)

---

## 1. Arquitectura General del Sistema

```mermaid
graph TD
    subgraph CLIENTE["🖥️ Cliente (Browser)"]
        FE["⚛️ React 19 + Vite<br/>:5173"]
    end

    subgraph SERVIDOR["🔧 Servidor"]
        MW["🛡️ Middleware Pipeline<br/>(Helmet → CORS → XSS<br/>+ Rate Limit por grupo de rutas)"]
        AUTH["🔐 Auth Layer<br/>(JWT + LDAP)"]
        UC["📦 Use Cases<br/>(Preview, Save, History)"]
        ENG["🧮 SimulationEngine<br/>(Strategy Pattern)"]
        EXP["📄 Export Services<br/>(PDF, CSV)"]
        SCH["⏱️ Scheduler<br/>(SimulationPurgeJob)"]
    end

    subgraph EXTERNO["☁️ Servicios Externos"]
        DB["🗄️ MySQL 8<br/>(Aiven Cloud SSL)"]
        SMTP["📧 Brevo SMTP"]
        AD["🔑 Active Directory UPB"]
    end

    FE -->|"fetch /api/*"| MW
    MW --> AUTH
    AUTH --> UC
    UC --> ENG
    UC --> EXP
    UC --> DB
    ENG -->|"InterestStrategy"| ENG
    SCH -->|"Purga cada N horas (configurable)"| DB
    AUTH -->|"ADMIN login"| AD
    UC -->|"Reset password"| SMTP

    style FE fill:#61DAFB,stroke:#333,stroke-width:2px,color:#000
    style MW fill:#EF4444,stroke:#991B1B,color:#fff
    style AUTH fill:#8B5CF6,stroke:#5B21B6,color:#fff
    style UC fill:#22C55E,stroke:#15803D,color:#fff
    style ENG fill:#F97316,stroke:#C2410C,color:#fff
    style DB fill:#4479A1,stroke:#1E3A5F,color:#fff
```

### Componentes y Responsabilidades

| Componente | Tecnología | Responsabilidad |
|---|---|---|
| **Frontend SPA** | React 19, Vite 7, TypeScript 5.9 | UI, formularios, gráficas, navegación por roles |
| **Middleware Pipeline** | Helmet, CORS, XSS, Rate Limit | Seguridad perimetral antes de cualquier lógica |
| **Auth Layer** | JWT (jsonwebtoken), bcrypt, LDAP | Autenticación dual + verificación de tokens |
| **Use Cases** | Clases TypeScript puras | Orquestación de lógica de negocio |
| **SimulationEngine** | Strategy Pattern + Money VO | Cálculo financiero (amortización, intereses) |
| **Export Services** | PDFKit, CSV builder | Generación de documentos exportables |
| **Scheduler** | `setInterval` + batch processing | Purga automática de simulaciones vencidas |
| **Base de Datos** | MySQL 8 (Aiven), Sequelize 6 | Persistencia relacional con SSL |
| **Email** | Nodemailer + Brevo SMTP | Correos de recuperación de contraseña |
| **Active Directory** | LDAP/AD UPB | Autenticación institucional de administradores |

---

## 2. Flujo de Datos: Simulación de Crédito

Este es el flujo completo desde que el usuario presiona "Simular" hasta que ve los resultados con la tabla de amortización.

### 2.1. Diagrama de Secuencia

```mermaid
sequenceDiagram
    actor U as 👤 Usuario
    participant SF as SimulationForm.tsx
    participant API as api.ts (fetch)
    participant XSS as xssMiddleware
    participant RT as simulatorRoutes.ts
    participant PUC as PreviewSimulationUseCase
    participant SS as SimulationService
    participant ENG as SimulationEngine
    participant STR as InterestStrategy
    participant DB as MySQL (Aiven)
    participant RES as SimulationResultsPreview.tsx

    U->>SF: Completa formulario y presiona "Simular"
    SF->>SF: Validación client-side (Zod + RHF)
    SF->>API: POST /api/simulator/preview {SimulationInput}

    Note over XSS,RT: Pipeline de Middlewares

    API->>XSS: Request entrante
    XSS->>XSS: Sanitizar body, query, params
    XSS->>RT: Request sanitizada

    Note over RT: Validación manual de campos<br/>obligatorios (studentType,<br/>educationLevel, tuitionGross,<br/>academicPeriod, etc.)

    RT->>RT: SimulationInputSchema.safeParse(body)

    alt ❌ Validación falla
        RT-->>API: 400 {error: mensajes}
        API-->>SF: Mostrar errores por campo
    end

    RT->>RT: Input válido + tipado
    RT->>PUC: execute(result.data: SimulationInput)
    PUC->>DB: paramRepo.findActive()
    DB-->>PUC: ActiveParameterVersion (tasas, reglas, topes)
    PUC->>SS: calculate(input, activeVersion)

    Note over SS: Validaciones de negocio:<br/>• Cuota inicial mínima<br/>• Mes válido para período<br/>• Tope de cuotas por modalidad<br/>• Valor financiado positivo

    SS->>ENG: computeSummary(input, params, activeVersion)
    ENG->>ENG: normalizeInput() → reglas #57, #59
    ENG->>STR: getStrategy(interestMode)
    STR->>STR: resolveMonthlyRate()
    STR->>STR: computePeriodicPayment()
    ENG->>ENG: buildAmortizationSchedule() → filas

    ENG-->>SS: SimulationSummary + schedule[]
    SS-->>PUC: SimulationSummary
    PUC-->>RT: SimulationSummary
    RT-->>API: 200 JSON
    API-->>SF: Response
    SF->>RES: Renderizar resultados + tabla + gráficas
```

### 2.2. Detalle del Motor Financiero

El `SimulationEngine` aplica las siguientes transformaciones antes de calcular:

```mermaid
graph TD
    A["📥 SimulationInput (raw)"] --> B{"normalizeInput()"}
    B -->|"educationLevel === 'upbTech'"| C["scholarshipPct = 0<br/>(#57: UPB Tech sin beca)"]
    B -->|"con_interes && cuotas ≤ 3"| D["interestMode = 'sin_interes'<br/>(#59: forzar sin interés)"]
    B -->|"sin cambio"| E["Input sin modificar"]

    C --> F["getStrategy(effectiveMode)"]
    D --> F
    E --> F

    F --> G{"¿Estrategia?"}
    G -->|sin_interes| H["NoInterestStrategy<br/>rate = 0<br/>payment = financed / n"]
    G -->|con_interes| I["FrenchAmortizationStrategy<br/>rate = tasa mensual BD<br/>payment = PMT(rate, n, PV)"]

    H --> J["buildAmortizationSchedule()"]
    I --> J
    J --> K["📊 SimulationSummary<br/>+ AmortizationRowDTO[]"]

    style B fill:#F59E0B,stroke:#92400E,color:#000
    style F fill:#3B82F6,stroke:#1E40AF,color:#fff
    style H fill:#22C55E,stroke:#15803D,color:#fff
    style I fill:#8B5CF6,stroke:#5B21B6,color:#fff
    style K fill:#F97316,stroke:#C2410C,color:#fff
```

### 2.3. Fórmula del Sistema Francés

La `FrenchAmortizationStrategy` calcula la cuota periódica usando la fórmula estándar de amortización francesa:

$$
\text{Cuota} = \frac{PV \times r}{1 - (1 + r)^{-n}}
$$

Donde:
- **PV** = Valor financiado (matrícula neta − cuota inicial)
- **r** = Tasa mensual efectiva (obtenida de `ActiveParameterVersion` en BD)
- **n** = Número de cuotas del plan (= `numberOfPayments - 1`, ya que la cuota 1 es la inicial)

---

## 3. Modelo de Seguridad — Defense in Depth

La seguridad se implementa como un pipeline de **7 capas** que toda request debe atravesar antes de llegar a la lógica de negocio.

### 3.1. Pipeline de Seguridad

```mermaid
graph TD
    REQ["📥 HTTP Request"] --> L1

    L1["🪖 Capa 1: Helmet<br/>CSP, HSTS, X-Frame-Options,<br/>X-Content-Type-Options"]
    L1 --> L2

    L2["🌐 Capa 2: CORS<br/>Restricción de orígenes<br/>permitidos"]
    L2 --> L3

    L3["⏱️ Capa 3: Rate Limiting<br/>Auth: 10 req/15min<br/>Simulator: 30 req/1min"]
    L3 --> L4

    L4["🧹 Capa 4: XSS Sanitizer<br/>Limpia body, query, params<br/>contra inyección HTML/JS"]
    L4 --> L5

    L5["🔐 Capa 5: Auth Guard<br/>Verifica JWT Bearer token<br/>+ Audit Log si falla"]
    L5 --> L6

    L6["👮 Capa 6: Role Guard<br/>Verifica rol en BD<br/>(STUDENT/ADMIN)<br/>+ Audit Log si denegado"]
    L6 --> L7

    L7["✅ Capa 7: Zod Validation<br/>Esquema estricto por endpoint<br/>+ transformación de datos"]
    L7 --> HANDLER["⚙️ Handler / Use Case"]

    REQ2["🚨 Ataque rechazado"] -.->|"Cualquier capa falla"| ERR["errorHandler → JSON de error"]

    style L1 fill:#1E293B,stroke:#334155,color:#fff
    style L2 fill:#1E3A5F,stroke:#2563EB,color:#fff
    style L3 fill:#7C2D12,stroke:#EA580C,color:#fff
    style L4 fill:#991B1B,stroke:#EF4444,color:#fff
    style L5 fill:#5B21B6,stroke:#8B5CF6,color:#fff
    style L6 fill:#1E40AF,stroke:#3B82F6,color:#fff
    style L7 fill:#15803D,stroke:#22C55E,color:#fff
    style HANDLER fill:#065F46,stroke:#10B981,color:#fff
```

### 3.2. Detalle por Capa

| Capa | Middleware | Archivo | Protección |
|---|---|---|---|
| 1 | `helmet()` | `app.ts:32` | Headers HTTP de seguridad (CSP, HSTS, X-Frame-Options, etc.) |
| 2 | `cors()` | `app.ts:33` | Previene requests de orígenes no autorizados |
| 3 | `authLimiter` / `simulatorLimiter` | `rateLimitGuard.ts` | Previene fuerza bruta (auth: 10/15min, sim: 30/1min) |
| 4 | `xssMiddleware()` | `xssMiddleware.ts` | Sanitiza `<script>`, HTML malicioso en toda entrada |
| 5 | `authGuard` | `authGuard.ts` | Verifica firma JWT, expiration, y registra intentos fallidos en audit log |
| 6 | `roleGuard(UserRole)` | `roleGuard.ts` | Verifica que el usuario exista en BD, esté activo, y tenga el rol requerido |
| 7 | `validateRequest(ZodSchema)` | `validateRequest.ts` | Valida y transforma body/query/params contra esquema estricto |

### 3.3. Medidas Adicionales

| Medida | Implementación | Propósito |
|---|---|---|
| **bcrypt** (factor 10) | `Infrastructure/auth/` | Hashing irreversible de contraseñas |
| **JWT con expiración** | `JwtTokenService` | Tokens de vida corta, sin estado en servidor |
| **Cache-Control: no-store** | `app.ts:41-46` | Impide que el browser cachee respuestas autenticadas (HU-05) |
| **Audit Log** | `AuditService.ts` | Registro de LOGIN_SUCCESS, LOGIN_FAILED, ACCESS_DENIED, TOKEN_EXPIRED, SESSION_EXPIRED |
| **Zod superRefine** | `SimulationInputSchema` | Validaciones cross-field (e.g., cuota mínima según nivel educativo) |
| **Error sanitization** | `errorHandler.ts` | Nunca expone stack traces ni detalles internos al cliente |

---

## 4. Flujo de Autenticación y Autorización

### 4.1. Mapa de Rutas por Nivel de Acceso

```mermaid
graph LR
    subgraph PUBLICO["🌐 Público (sin auth)"]
        R1["/api/auth/login"]
        R2["/api/auth/register"]
        R3["/api/auth/forgot-password"]
        R4["/api/simulator/preview"]
        R5["/api/parameters/active"]
        R6["/api/health"]
        R7["/api/docs (Swagger)"]
    end

    subgraph STUDENT["🎓 STUDENT (authGuard)"]
        R8["/api/simulator/save"]
        R9["/api/simulator/history"]
        R10["/api/simulator/history/:id/export/pdf"]
        R11["/api/users/me"]
    end

    subgraph ADMIN["🛡️ ADMIN (authGuard + roleGuard)"]
        R12["/api/admin/students"]
        R13["/api/admin/parameters"]
        R14["/api/admin/simulations"]
    end

    style PUBLICO fill:#D1FAE5,stroke:#065F46,color:#000
    style STUDENT fill:#DBEAFE,stroke:#1E40AF,color:#000
    style ADMIN fill:#FEE2E2,stroke:#991B1B,color:#000
```

### 4.2. Protección Frontend

El frontend implementa un **doble control** de acceso:

```mermaid
graph TD
    A["📍 Navegación a ruta protegida"] --> B{"¿Token en AuthContext?"}
    B -->|No| C["Redirect → /login"]
    B -->|Sí| D{"¿Rol del usuario?"}
    D -->|"requiredRole !== user.role"| E["Redirect → /unauthorized"]
    D -->|"Rol correcto"| F["✅ Renderizar componente"]

    style B fill:#F59E0B,stroke:#92400E,color:#000
    style D fill:#3B82F6,stroke:#1E40AF,color:#fff
    style F fill:#22C55E,stroke:#15803D,color:#fff
```

Implementado en `App.tsx` con componentes `<ProtectedRoute requiredRole="STUDENT">` y `<PublicRoute>`.

---

## 5. Flujo de Exportación PDF

```mermaid
sequenceDiagram
    actor U as 👤 Usuario
    participant FE as React Frontend
    participant BE as Express Backend
    participant PDF as SimulationPdfBuilder
    participant DB as MySQL

    U->>FE: Click "Exportar PDF"
    FE->>BE: GET /api/simulator/history/:id/export/pdf
    BE->>BE: authGuard → verificar token
    BE->>DB: Buscar simulación por ID + usuario
    DB-->>BE: Simulation + AmortizationRows

    BE->>PDF: buildSimulationPdf(simulation, rows, user)
    PDF->>PDF: Header UPB + datos estudiante
    PDF->>PDF: Resumen financiero (tabla)
    PDF->>PDF: Tabla de amortización paginada
    PDF->>PDF: Pie chart Capital vs Intereses
    PDF-->>BE: Buffer PDF

    BE->>DB: Registrar en export_log
    BE-->>FE: Content-Type: application/pdf
    FE->>U: Descarga automática del PDF
```

---

## 6. Ciclo de Vida de una Simulación

```mermaid
stateDiagram-v2
    [*] --> Preview : POST /preview
    Preview --> Descartada : Usuario no guarda
    Preview --> Guardada : POST /save (auth required)

    Guardada --> Consultada : GET /history
    Guardada --> Exportada : GET /history/:id/export/pdf
    Guardada --> SoftDeleted : DELETE /history/:id (futuro)

    SoftDeleted --> PurgadaAuto : SimulationPurgeJob (>90 días)

    Consultada --> Exportada
    Consultada --> SoftDeleted

    Exportada --> SoftDeleted

    PurgadaAuto --> [*] : Eliminación lógica + audit_logs

    note right of Preview
        Sin persistencia
        Sin autenticación (guest)
        Solo cálculo en memoria
    end note

    note right of Guardada
        Persistida en MySQL
        Vinculada al usuario
        Incluye amortization_rows
    end note

    note right of SoftDeleted
        Campo deleted_at != null
        Visible en audit_logs
        Recuperable antes de purga
    end note
```

---

## 7. Modelo de Datos

### 7.1. Diagrama Entidad-Relación

```mermaid
erDiagram
    USER {
        uuid id PK
        string first_name
        string last_name
        string email UK
        string document_number UK
        enum document_type
        enum role "STUDENT | ADMIN"
        string password_hash
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    SIMULATION {
        uuid id PK
        uuid user_id FK
        decimal tuition_gross
        decimal scholarship_pct
        decimal tuition_net
        decimal initial_payment
        decimal initial_payment_pct
        decimal financed_value
        enum interest_mode
        string academic_period
        date first_payment_date
        int total_payments
        decimal periodic_payment
        decimal total_paid
        decimal total_interest
        string observations
        boolean starred
        timestamp created_at
        timestamp deleted_at "soft-delete"
    }

    AMORTIZATION_ROW {
        uuid id PK
        uuid simulation_id FK
        int period
        date date
        decimal initial_balance
        decimal principal
        decimal interest
        decimal payment
        decimal final_balance
    }

    PARAMETER_VERSION {
        uuid id PK
        string name
        boolean is_active
        timestamp created_at
    }

    INTEREST_RATE {
        uuid id PK
        uuid version_id FK
        enum level "PREGRADO | POSGRADO | UPBTECH"
        decimal annual_rate
        decimal monthly_rate
    }

    MODALITY_RULE {
        uuid id PK
        uuid version_id FK
        enum level
        enum modality "SIN_INTERES | CON_INTERES"
        decimal min_initial_pct
        int max_total_payments
    }

    EXPORT_LOG {
        uuid id PK
        uuid simulation_id FK
        uuid user_id FK
        enum format "PDF | CSV"
        timestamp exported_at
        string ip_address "nullable"
        string file_name
        string content_flags "JSON serializado"
    }

    AUDIT_LOG {
        uuid id PK
        string action
        string entity
        string entity_id
        enum actor_type "STUDENT | ADMIN | SYSTEM"
        uuid user_id FK "nullable"
        string ip_address
        string details "JSON serializado (TEXT long)"
        timestamp created_at
    }

    USER ||--o{ SIMULATION : "crea"
    SIMULATION ||--|{ AMORTIZATION_ROW : "contiene"
    SIMULATION ||--o{ EXPORT_LOG : "genera"
    PARAMETER_VERSION ||--|{ INTEREST_RATE : "define"
    PARAMETER_VERSION ||--|{ MODALITY_RULE : "configura"
    AUDIT_LOG }o--|| USER : "registra acción de"
    EXPORT_LOG }o--|| USER : "exportado por"
```

### 7.2. Relaciones Clave

| Relación | Cardinalidad | Descripción |
|---|---|---|
| `USER → SIMULATION` | 1:N | Un usuario puede crear múltiples simulaciones |
| `SIMULATION → AMORTIZATION_ROW` | 1:N | Cada simulación genera N filas de amortización |
| `SIMULATION → EXPORT_LOG` | 1:N | Una simulación puede exportarse múltiples veces |
| `PARAMETER_VERSION → INTEREST_RATE` | 1:N | Una versión define tasas por nivel educativo |
| `PARAMETER_VERSION → MODALITY_RULE` | 1:N | Una versión define reglas por modalidad/nivel |
| `AUDIT_LOG → USER` | N:1 | Cada acción se vincula al usuario que la realizó |

---

<div align="center">

> _"El diseño no es cómo se ve. El diseño es cómo funciona." — Steve Jobs_

<sub>🔙 <a href="../../README.md">Volver al README principal</a> · <a href="./technical-decisions.md">Decisiones Técnicas</a> · <a href="../README.md">Índice de Documentación</a></sub>

</div>
