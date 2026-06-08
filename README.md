<div align="center">

  <img src="./client/src/assets/images/logo-upb-color.png" alt="Logo UPB" width="150" />

  # 🎓 Simulador de Crédito UPB

  **Plataforma integral de simulación de crédito educativo para la Universidad Pontificia Bolivariana**

  [![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
  [![Node.js](https://img.shields.io/badge/Node.js-Express_5.2-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![MySQL](https://img.shields.io/badge/MySQL-Aiven_Cloud-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
  [![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev/)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

</div>

---

## 📖 Acerca de

El **Simulador de Crédito UPB** permite a estudiantes, invitados y administradores de la Universidad Pontificia Bolivariana modelar, calcular y gestionar planes de financiamiento educativo de forma ágil y segura.

- 🏗️ **Clean Architecture** — Capas `Core/` → `Application/` → `Infrastructure/` con inversión de dependencias estricta.
- 🧮 **Motor Financiero (Strategy Pattern)** — `SimulationEngine` con estrategias intercambiables: amortización francesa (`FrenchAmortizationStrategy`) y sin interés (`NoInterestStrategy`).
- 🔐 **Autenticación Dual** — Login local con bcrypt + JWT y federación LDAP/Active Directory institucional, con autorización por roles (`STUDENT` / `ADMIN`).
- 📧 **Notificaciones Transaccionales** — Correos HTML responsive de recuperación de contraseña vía Brevo SMTP.
- 📄 **Exportación PDF & CSV** — Generación de documentos de simulación con PDFKit y builder CSV.
- 🗑️ **Purga Automática** — Scheduler que archiva simulaciones tras período de retención configurable (soft-delete + auditoría).
- 👤 **Modo Invitado** — Simulaciones sin registro, con restricciones controladas (sin guardado ni historial).

---

## 🖼️ Galería de la Aplicación

<details>
<summary><strong>🔐 Login y Autenticación</strong></summary>
<br/>

|  |  |
|:---:|:---:|
| <img src="https://github.com/user-attachments/assets/04bcc531-9b30-4972-8e3d-d7b0516c62b0" width="480" alt="Login" /> | <img src="https://github.com/user-attachments/assets/6c4075d5-c690-4eeb-bc1f-db442783a1cb" width="480" alt="Student redirect" /> |
| **Formulario de Login** | **Redirección STUDENT → `/student/main`** |
| <img src="https://github.com/user-attachments/assets/588f6061-851a-49c7-8810-a89d59298b7d" width="480" alt="Password validation" /> | <img src="https://github.com/user-attachments/assets/9a76d731-de3f-4eef-a8eb-7762d41098a8" width="480" alt="Field errors" /> |
| **Validación visual de contraseña en tiempo real** | **Retroalimentación de errores por campo** |

</details>

<details>
<summary><strong>👤 Modo Invitado</strong></summary>
<br/>

|  |  |
|:---:|:---:|
| <img src="https://github.com/user-attachments/assets/40ea854a-02b2-49a7-a7d3-8bfe328df40d" width="480" alt="Guest main" /> | <img src="https://github.com/user-attachments/assets/91d1ff52-9c86-4b1a-a116-4343927465dd" width="480" alt="Guest simulation" /> |
| **Página principal modo invitado** | **Formulario de simulación (guest)** |
| <img src="https://github.com/user-attachments/assets/edea8693-cd6e-41ba-a666-87985c495062" width="480" alt="Guest CTA" /> | <img src="https://github.com/user-attachments/assets/5719bb52-769d-4914-9427-23cc3a43e3be" width="480" alt="Guest results" /> |
| **CTA "Crear Nueva Simulación"** | **Resultados invitado (sin botón Guardar)** |

</details>

<details>
<summary><strong>🧮 Simulador y Resultados</strong></summary>
<br/>

|  |  |
|:---:|:---:|
| <img src="https://github.com/user-attachments/assets/64bba96f-5df4-4293-8692-57492f1b90c6" width="480" alt="Encabezado y datos" /> | <img src="https://github.com/user-attachments/assets/6bf44496-fcfd-42cb-bb0b-acac2e783e5d" width="480" alt="Resumen y gráficas" /> |
| **Encabezado y datos del estudiante** | **Resumen financiero y gráficas** |
| <img src="https://github.com/user-attachments/assets/b02a766e-339d-4e1c-a93d-ec85d980316a" width="480" alt="Donut chart" /> | <img src="https://github.com/user-attachments/assets/afdd6c3d-5321-473d-8fa5-5cb752782188" width="480" alt="Tabla amortización" /> |
| **Gráficas de distribución** | **Tabla de amortización + Exportar** |

</details>

<details>
<summary><strong>📜 Historial de Simulaciones (Estudiante)</strong></summary>
<br/>

|  |  |
|:---:|:---:|
| <img src="https://github.com/user-attachments/assets/2f37e5f7-da21-4a5a-aad8-4ff65c8b415c" width="480" alt="Student history" /> | <img src="https://github.com/user-attachments/assets/51cd6f7b-be44-46b1-baee-83497126e1b9" width="480" alt="Filters dropdown" /> |
| **Vista completa con tabla + aviso 90 días** | **Filtros: Modalidad / Período / Fecha** |
| <img src="https://github.com/user-attachments/assets/62c2e05b-9587-414d-a258-06c0edaa9fef" width="480" alt="Row selected" /> | <img src="https://github.com/user-attachments/assets/c2e4ded3-5618-4886-8144-2d95f5556f96" width="480" alt="History flow" /> |
| **Fila seleccionada + acciones habilitadas** | **Flujo historial de simulación** |

</details>

<details>
<summary><strong>📄 Exportación PDF</strong></summary>
<br/>

|  |  |
|:---:|:---:|
| <img src="https://github.com/user-attachments/assets/90c3fdc3-0f0c-44f8-b2cf-0ad376ee79b8" width="480" alt="PDF preview 1" /> | <img src="https://github.com/user-attachments/assets/375f1d96-ee7a-450b-a206-9ad5595e8dc0" width="480" alt="PDF preview 2" /> |
| **Documento PDF generado (página 1)** | **Tabla de amortización en PDF** |

</details>

<details>
<summary><strong>🛡️ Panel de Administración</strong></summary>
<br/>

|  |  |
|:---:|:---:|
| <img src="https://github.com/user-attachments/assets/af791a4e-e106-496d-92ab-96a3a662cfa7" width="480" alt="Admin main" /> | <img src="https://github.com/user-attachments/assets/33009ce6-3ed8-4f3e-bcc0-4705b0f28d71" width="480" alt="Admin simulations" /> |
| **Panel principal Admin (3 módulos)** | **Gestión de Simulaciones + paginación** |
| <img src="https://github.com/user-attachments/assets/2a41f9d7-6c01-426e-ad5b-9d3055b08bdb" width="480" alt="Admin filters" /> | <img src="https://github.com/user-attachments/assets/51f36e99-d303-436a-a73f-8dcca10c6a52" width="480" alt="Delete modal" /> |
| **Filtros y búsqueda** | **Modal de confirmación "Eliminar"** |
| <img src="https://github.com/user-attachments/assets/9ea294b1-6af8-4561-99e5-c2fd62a1cfe1" width="480" alt="Admin parameters" /> | <img src="https://github.com/user-attachments/assets/3a6a096d-ad90-4786-b5b3-cc30e420de22" width="480" alt="Admin parameters toggle" /> |
| **Parametrización financiera** | **Intercambio de versiones activas** |

</details>

<details>
<summary><strong>🧭 Navegación y UX</strong></summary>
<br/>

|  |  |
|:---:|:---:|
| <img src="https://github.com/user-attachments/assets/06a76285-c0e0-4aed-85a0-79c295cb8702" width="480" alt="BackNavLink hover" /> | <img src="https://github.com/user-attachments/assets/9ab6c103-0606-446f-8f8e-a02fc02570c6" width="480" alt="BackNavLink 2" /> |
| **Hover en BackNavLink (AdminStudents)** | **BackNavLink (AdminSimulations)** |
| <img src="https://github.com/user-attachments/assets/da4709ea-50f9-48d1-9ece-b5db9612663e" width="120" alt="Logo gray" /> | <img src="https://github.com/user-attachments/assets/4c259a4d-8f1a-4d2b-876d-4ab65dafd702" width="120" alt="Logo color" /> |
| **Logo UPB (gris)** | **Logo UPB hover (color) + focus ring** |

</details>

<details>
<summary><strong>📧 Correo de Recuperación</strong></summary>
<br/>

<div align="center">
  <img src="https://github.com/user-attachments/assets/291ae998-3e77-4bb5-8c45-c5b7803b8912" width="600" alt="Password reset email" />
  <br/><em>Correo HTML responsive de recuperación de contraseña</em>
</div>

</details>

<details>
<summary><strong>🧪 Testing</strong></summary>
<br/>

|  |  |
|:---:|:---:|
| <img src="https://github.com/user-attachments/assets/0a9ca5d4-269d-4ab9-8978-e3919043b542" width="480" alt="Tests 1" /> | <img src="https://github.com/user-attachments/assets/3846c775-206c-41f4-92fe-7dc33336b3bc" width="480" alt="Tests 2" /> |
| **Suite de tests backend** | **Tests pasando correctamente** |
| <img src="https://github.com/user-attachments/assets/88a9018e-5856-41b6-871a-53387bfd3a00" width="480" alt="API validation" /> | <img src="https://github.com/user-attachments/assets/146a8a88-ec4e-4372-a137-e7f0fca19dbb" width="480" alt="Header tests" /> |
| **Validación de seguridad en API (400 + fieldErrors)** | **Tests de componentes** |

</details>

---

## 🏛️ Arquitectura del Sistema

```mermaid
graph TD
    A["👤 Usuario<br/>(Estudiante / Admin / Invitado)"] -->|HTTP| B["⚛️ Frontend<br/>React 19 + Vite 8<br/>:5173"]
    B -->|fetch /api/*| C["🟢 Backend<br/>Express 5 + TypeScript<br/>:3000"]
    C -->|Sequelize ORM<br/>SSL| D["🗄️ MySQL 8<br/>Aiven Cloud"]
    C -->|SMTP| E["📧 Brevo<br/>Email"]
    C -->|LDAP| F["🔑 Active Directory<br/>UPB"]

    style A fill:#f9f,stroke:#333,stroke-width:2px,color:#000
    style B fill:#61DAFB,stroke:#333,stroke-width:2px,color:#000
    style C fill:#339933,stroke:#333,stroke-width:2px,color:#fff
    style D fill:#4479A1,stroke:#333,stroke-width:2px,color:#fff
    style E fill:#0B5394,stroke:#333,stroke-width:2px,color:#fff
    style F fill:#FF6F00,stroke:#333,stroke-width:2px,color:#fff
```

### Clean Architecture (Backend)

```mermaid
graph LR
    subgraph Core["🔵 Core (Dominio)"]
        E1["Entities<br/>User · Simulation · Money<br/>ParameterVersion · SimulationRow"]
        E2["Repository Interfaces<br/>IUserRepo · ISimulationRepo<br/>IParameterVersionRepo"]
        E3["Errors<br/>AppError"]
    end

    subgraph App["🟢 Application"]
        S1["Use Cases<br/>AuthenticateUser · SaveSimulation<br/>PreviewSimulation · RegisterUser<br/>ResetPassword · ListSimulations..."]
        S2["Services<br/>SimulationEngine<br/>SimulationService · AuditService"]
        S3["Strategies<br/>FrenchAmortization<br/>NoInterest"]
        S4["DTOs<br/>SimulationInput · LoginInput<br/>SimulationSummary..."]
    end

    subgraph Infra["🟠 Infrastructure"]
        I1["HTTP<br/>Express Routes · Middlewares<br/>Swagger · Error Handler"]
        I2["Persistence<br/>Sequelize Models<br/>Repository Implementations"]
        I3["Auth<br/>JWT · LDAP"]
        I4["Email · Logger · Scheduler"]
    end

    Infra -->|depends on| App
    App -->|depends on| Core
    Core -.->|no dependencies| Core

    style Core fill:#dbeafe,stroke:#3b82f6,stroke-width:2px,color:#000
    style App fill:#dcfce7,stroke:#22c55e,stroke-width:2px,color:#000
    style Infra fill:#ffedd5,stroke:#f97316,stroke-width:2px,color:#000
```

### Strategy Pattern — Motor Financiero

```mermaid
classDiagram
    class InterestStrategy {
        <<interface>>
        +resolveMonthlyRate(input, params) number
        +computePeriodicPayment(principal, rate, n) number
    }

    class FrenchAmortizationStrategy {
        +resolveMonthlyRate() number
        +computePeriodicPayment() number
    }

    class NoInterestStrategy {
        +resolveMonthlyRate() number
        +computePeriodicPayment() number
    }

    class SimulationEngine {
        -strategies: Record~string, InterestStrategy~
        +computeSummary(input, params) SimulationSummary
        +buildAmortizationSchedule() AmortizationRowDTO[]
    }

    InterestStrategy <|.. FrenchAmortizationStrategy : con_interes
    InterestStrategy <|.. NoInterestStrategy : sin_interes
    SimulationEngine --> InterestStrategy : usa
```

---

## 📚 Índice Documental

> Toda la documentación del proyecto se encuentra organizada en la carpeta [`docs/`](./docs/). Consulta el [índice detallado](./docs/README.md) para ver cada archivo.

### Entregables principales

| Entregable | Enlace directo |
|---|---|
| Manual de usuario | [`docs/manuals/Manual_Usuario_Simulador_Credito_UPB.pdf`](./docs/manuals/Manual_Usuario_Simulador_Credito_UPB.pdf) |
| Manual tecnico | [`docs/manuals/Manual de Técnico Simulador.pdf`](./docs/manuals/Manual%20de%20T%C3%A9cnico%20Simulador.pdf) |
| Manual de despliegue CTIC | [`docs/deployment/Manual de Despliegue Simulador - CTIC.pdf`](./docs/deployment/Manual%20de%20Despliegue%20Simulador%20-%20CTIC.pdf) |
| Articulo IEEE | [`docs/academic/Articulo IEEE Simulador de Credito UPB.pdf`](./docs/academic/Articulo%20IEEE%20Simulador%20de%20Credito%20UPB.pdf) |

| Categoría | Descripción | Ubicación |
|---|---|---|
| 🎓 **Entregables académicos** | Artículo IEEE y sustentación final. | [`docs/academic/`](./docs/academic/) |
| 📘 **Manuales** | Manual de usuario y manual técnico. | [`docs/manuals/`](./docs/manuals/) |
| 📋 **Requisitos** | Project Charter, Product Backlog, especificaciones del proyecto integrador y plan de requisitos de software. | [`docs/requirements/`](./docs/requirements/) |
| 📐 **Diagramas** | Diagramas UML por módulo (StarUML `.mdj`) y diagrama de clases general. | [`docs/diagrams/`](./docs/diagrams/) |
| 🗄️ **Base de Datos** | Diagrama entidad-relación y diccionario de datos. | [`docs/database/`](./docs/database/) |
| 🚀 **Despliegue CTIC** | Manual formal, runbooks, bootstrap, variables ejemplo y evidencias operativas. | [`docs/deployment/`](./docs/deployment/) |
| 💰 **Lineamientos Financieros** | Formatos oficiales de solicitud de crédito del área financiera UPB. | [`docs/financial-guidelines/`](./docs/financial-guidelines/) |
| 🤝 **Actas de Reunión** | Actas firmadas de reuniones con el área financiera (7 sesiones). | [`docs/meeting-minutes/`](./docs/meeting-minutes/) |
| 🏃 **Sprints** | Backlogs y presentaciones de cada Sprint. | [`docs/sprints/`](./docs/sprints/) |
| 🏗️ **Sustento Técnico** | Decisiones arquitectónicas, flujos de datos, ambientes, secretos y evidencias de testing. | [`docs/architecture/`](./docs/architecture/) |

### 🛡️ Sustento Técnico — Arquitectura y Evidencias

Documentación técnica que fundamenta las decisiones de diseño y demuestra la calidad del sistema:

| Documento | Descripción |
|---|---|
| 📝 [**Decisiones Técnicas (ADR)**](./docs/architecture/technical-decisions.md) | 9 Architecture Decision Records: Clean Architecture, Strategy Pattern, Zod validation, autenticación dual JWT+LDAP, monorepo, stack frontend, MySQL Aiven, soft-delete + purga automática y manejo seguro de ambientes/secretos. |
| ⚙️ [**Diseño del Sistema**](./docs/architecture/system-design.md) | Flujos de datos completos con diagramas Mermaid: pipeline de simulación (SimulationForm → Engine → AmortizationTable), modelo de seguridad Defense in Depth (7 capas), flujo de autenticación, exportación PDF, ciclo de vida de simulaciones y modelo ER detallado. |
| 🔐 [**Ambientes y Secretos (HU-58)**](./docs/architecture/environments-and-secrets.md) | Estrategia oficial de configuración para Local, Testing/Staging y Producción WAN; matriz de variables; exclusión de secretos y guía rápida de `.env`. |
| 📄 [**Ambientes y Secretos — DOCX**](./docs/architecture/environments-and-secrets.docx) | Versión editable Word para entrega formal o revisión externa. |
| 🧪 [**Evidencias de Testing**](./docs/architecture/test-evidence.md) | Resultados de ejecución de Jest (50 tests backend) y Vitest (6 tests frontend), reporte de cobertura de código, análisis de priorización y estrategia de testing por sprint. |

---

## 🗂️ Estructura del Proyecto

```
simulador-credito-upb/
├── client/                          # ⚛️ Frontend — React 19 + Vite + TypeScript
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/                # Login, Register, ForgotPassword, ResetPassword
│   │   │   ├── admin/               # Panel admin (Students, Parameters, Simulations)
│   │   │   ├── simulator/           # Simulador (user + guest)
│   │   │   └── landing/             # Landing page pública
│   │   ├── shared/
│   │   │   ├── components/          # Layout, Header, Footer, SimulationForm, Charts...
│   │   │   ├── services/            # API client
│   │   │   └── utils/               # Helpers
│   │   └── App.tsx                  # Router principal + rutas protegidas
│   ├── nginx.conf                   # Nginx config (producción)
│   ├── tailwind.config.js
│   └── package.json
│
├── server/                          # 🟢 Backend — Node.js + Express 5 + TypeScript
│   ├── src/
│   │   ├── Core/                    # 🔵 Dominio (entities, repos interfaces, errors)
│   │   ├── Application/             # 🟢 Casos de uso, servicios, strategies, DTOs
│   │   │   ├── use-cases/           # AuthenticateUser, SaveSimulation, etc.
│   │   │   ├── services/            # SimulationEngine, AuditService, PDF/CSV builders
│   │   │   └── strategies/          # FrenchAmortization, NoInterest
│   │   ├── Infrastructure/          # 🟠 Frameworks y drivers
│   │   │   ├── http/                # Express app, routes, middlewares, Swagger
│   │   │   ├── persistence/         # Sequelize models + repository implementations
│   │   │   ├── auth/                # JWT + LDAP services
│   │   │   ├── email/               # Nodemailer + Brevo SMTP
│   │   │   ├── scheduler/           # Purga automática de simulaciones
│   │   │   └── config/              # env, database singleton
│   │   └── index.ts                 # Bootstrap del servidor
│   ├── jest.config.ts
│   └── package.json
│
├── docs/                            # 📖 Documentación del proyecto
│   ├── academic/                    # Artículo IEEE y sustentación final
│   ├── architecture/               # 🏗️ ADRs, flujos técnicos, ambientes, secretos y testing
│   ├── database/                    # ER diagram + diccionario de datos
│   ├── deployment/                  # Manual CTIC, runbooks y evidencias operativas
│   ├── diagrams/                    # Diagramas UML por módulo
│   ├── financial-guidelines/        # Formatos de crédito financiero
│   ├── manuals/                     # Manual de usuario y manual técnico
│   ├── meeting-minutes/             # Actas de reunión firmadas
│   ├── requirements/                # Charter, backlog, especificaciones
│   └── sprints/                     # Artefactos por sprint
│
├── .github/                         # CI/CD workflows, templates, Dependabot
├── .env.example                     # Variables de entorno de referencia
├── package.json                     # Monorepo workspaces (npm)
├── LICENSE                          # Licencia MIT
├── SECURITY.md                      # Política de reporte de vulnerabilidades
├── CONTRIBUTING.md                  # Guía de contribución
├── CODE_OF_CONDUCT.md               # Código de conducta
└── README.md
```

---

## 🚀 Guía de Inicio Rápido

### Prerrequisitos

- **Node.js** ≥ 18
- **npm** ≥ 9

### Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-org/simulador-credito-upb.git
cd simulador-credito-upb

# 2. Instalar dependencias (monorepo — instala client + server)
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Edita .env con tus credenciales de BD (Aiven), LDAP, SMTP y JWT
```

> 🔐 Consulta la guía completa de ambientes y secretos en
> [`docs/architecture/environments-and-secrets.md`](./docs/architecture/environments-and-secrets.md).

### Desarrollo

```bash
# Levantar backend + frontend simultáneamente
npm run dev

# O por separado:
npm run dev:server    # Backend  → http://localhost:3000
npm run dev:client    # Frontend → http://localhost:5173
```

| Servicio | URL | Descripción |
|---|---|---|
| Frontend | `http://localhost:5173` | Aplicación React (Vite HMR) |
| Backend API | `http://localhost:3000/api` | REST API Express |
| Swagger Docs | `http://localhost:3000/api/docs` | Documentación interactiva de la API |
| Health Check | `http://localhost:3000/api/health` | Estado del servidor |

### Testing

```bash
# Tests del backend (Jest)
npm run test --workspace=server

# Tests del frontend (Vitest)
npm run test --workspace=client
```

---

## 🚀 Ambientes de Despliegue

| Ambiente | Modelo | Documentación |
|---|---|---|
| 🟡 **Pre-Producción (Staging)** | Automatizado vía GitHub Actions + Aiven Cloud | [`docs/deployment/PRE-PROD-ENVIRONMENT.md`](./docs/deployment/PRE-PROD-ENVIRONMENT.md) |
| 🟢 **Producción (CTIC)** | Despliegue manual/script on-premise + MariaDB CTIC | [`docs/deployment/CTIC-PROD-DEPLOYMENT.md`](./docs/deployment/CTIC-PROD-DEPLOYMENT.md) |

---

## 🛠️ Stack Tecnológico

### Frontend

| Herramienta | Propósito |
|---|---|
| ⚛️ **React 19** | Librería de UI con componentes funcionales |
| ⚡ **Vite 8** | Bundler ultrarrápido con HMR |
| 🎨 **Tailwind CSS v4** | Utility-first CSS framework |
| 🔷 **TypeScript 6** | Tipado estático |
| ✅ **Zod 4** | Validación de esquemas en cliente y servidor |
| 📝 **React Hook Form 7** | Gestión de formularios performante |
| 🧭 **React Router 7** | Enrutamiento SPA con rutas protegidas |
| 💎 **Lucide React** | Iconografía SVG moderna |
| 🧪 **Vitest + Testing Library** | Testing unitario y de integración |

### Backend

| Herramienta | Propósito |
|---|---|
| 🟢 **Node.js + Express 5** | Runtime y framework HTTP |
| 🔷 **TypeScript 6** | Tipado estático |
| 🗄️ **Sequelize 6 + MySQL 8** | ORM con conexión SSL a Aiven Cloud |
| 🔑 **JWT (jsonwebtoken)** | Autenticación stateless |
| 🔐 **bcrypt** | Hashing seguro de contraseñas |
| 🏛️ **passport-ldapauth** | Autenticación federada LDAP/AD |
| 📧 **Nodemailer + Brevo SMTP** | Correos transaccionales (reset password) |
| 🛡️ **Helmet + CORS + XSS** | Seguridad HTTP y sanitización |
| ⏱️ **express-rate-limit** | Rate limiting por endpoint |
| 📄 **PDFKit** | Generación de documentos PDF |
| 📊 **Swagger UI Express** | Documentación interactiva de la API |
| 📝 **Winston** | Logging estructurado |
| 🧪 **Jest + Supertest** | Testing del API |

---

## 🤝 Contribución

1. Crea un **fork** del repositorio.
2. Crea una rama para tu feature: `git checkout -b feature/mi-feature`.
3. Haz commit de tus cambios: `git commit -m "feat: descripción del cambio"`.
4. Sube tu rama: `git push origin feature/mi-feature`.
5. Abre un **Pull Request** describiendo tus cambios.

> 📖 Consulta la [Guía de Contribución](./CONTRIBUTING.md) para convenciones de código, commits y flujo de trabajo.
> 📝 Usa la [plantilla de Pull Request](./.github/PULL_REQUEST_TEMPLATE.md) para la estructura esperada.
> 🤝 Lee nuestro [Código de Conducta](./CODE_OF_CONDUCT.md) antes de participar.

---

## 🔒 Seguridad

Si descubres una vulnerabilidad de seguridad, **NO** abras un issue público. Consulta nuestra [Política de Seguridad](./SECURITY.md) para el proceso de reporte responsable.

---

## 📄 Licencia

Este proyecto está licenciado bajo la [Licencia MIT](LICENSE) — libre para uso, modificación y distribución.

---

<div align="center">

  Hecho con ❤️ por el equipo de desarrollo — **Universidad Pontificia Bolivariana**

  <sub>Proyecto Integrador · Ingeniería de Sistemas e Informática · 2026-2027</sub>

</div>
