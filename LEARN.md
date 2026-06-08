# 🎓 Learn with Simulador de Crédito UPB

<div align="center">

**A bilingual learning guide for students exploring a real institutional web application.**
**Guía bilingüe para estudiar una aplicación web institucional real.**

[🇪🇸 Español](#-español) · [🇺🇸 English](#-english)

</div>

---

## 🇪🇸 Español

### 🎯 Propósito educativo

Este repositorio funciona como caso de estudio para estudiantes que quieren entender cómo se construye una aplicación web completa: requerimientos, arquitectura, motor financiero, persistencia relacional, seguridad, pruebas, documentación y despliegue institucional.

El proyecto resuelve una necesidad concreta de la Universidad Pontificia Bolivariana Seccional Bucaramanga: permitir que estudiantes e interesados simulen escenarios de financiación educativa y que administradores actualicen reglas financieras sin modificar código.

### 🧭 Qué puedes aprender

| Tema | Dónde explorarlo |
|---|---|
| 🏗️ Clean Architecture | `server/src/Core`, `server/src/Application`, `server/src/Infrastructure` |
| 🧮 Strategy Pattern | Motor de simulación y estrategias de interés |
| ⚛️ React SPA | `client/src`, rutas, componentes compartidos y flujos por rol |
| ✅ Validación con Zod | Esquemas de entrada en frontend y backend |
| 🟢 API REST con Express | Rutas, middlewares, Swagger y controladores |
| 🗄️ Persistencia relacional | Modelos Sequelize, repositorios y scripts SQL |
| 🔐 Seguridad | JWT, bcrypt, LDAP, CORS, Helmet, rate limiting y sanitización |
| 🚀 Despliegue CTIC | `docs/deployment`, Nginx, PM2, RHEL y variables de entorno |
| ✍️ Technical Writing | `docs/architecture`, manuales y artículo académico |

### 🛤️ Ruta sugerida de aprendizaje

1. **Empieza por el frontend:** revisa navegación, roles y formulario de simulación en `client/src`.
2. **Entra al dominio financiero:** estudia `SimulationEngine`, amortización francesa y estrategia sin interés.
3. **Sigue una request completa:** desde una ruta Express hasta un caso de uso y repositorio.
4. **Cruza código con base de datos:** compara `docs/database/relational-model.png` con los modelos Sequelize.
5. **Cierra con despliegue:** lee el manual CTIC y el runbook RHEL para entender el paso a producción.

### 🧪 Ejercicios sugeridos

- Agrega una regla de validación al formulario y replícala en backend.
- Implementa una nueva estrategia financiera y regístrala en `SimulationEngine`.
- Crea una prueba unitaria para un caso límite de amortización.
- Relaciona cada flujo funcional con sus tablas principales.
- Propón una mejora de accesibilidad en una pantalla del frontend.

### ✅ Buenas prácticas visibles

- Separación clara entre dominio, aplicación e infraestructura.
- Documentación de despliegue pensada para transferencia a CTIC.
- Plantillas de variables sin secretos reales.
- Evidencia funcional y técnica versionada.
- Manuales y artículo académico como soporte de trazabilidad.

---

## 🇺🇸 English

### 🎯 Educational purpose

This repository is a case study for students who want to understand how a complete institutional web application is built: requirements, architecture, financial calculation, relational persistence, security, testing, documentation and deployment to a real infrastructure environment.

The project addresses a real need at Universidad Pontificia Bolivariana Bucaramanga: allowing students and applicants to simulate educational financing scenarios while administrators manage financial rules without changing application code.

### 🧭 What you can learn

| Topic | Where to look |
|---|---|
| 🏗️ Clean Architecture | `server/src/Core`, `server/src/Application`, `server/src/Infrastructure` |
| 🧮 Strategy Pattern | Simulation engine and interest strategies |
| ⚛️ React SPA | `client/src`, routing, shared components and role-based flows |
| ✅ Zod validation | Client and server input schemas |
| 🟢 REST API with Express | Routes, middlewares, Swagger and controllers |
| 🗄️ Relational persistence | Sequelize models, repositories and SQL scripts |
| 🔐 Security | JWT, bcrypt, LDAP, CORS, Helmet, rate limiting and sanitization |
| 🚀 CTIC deployment | `docs/deployment`, Nginx, PM2, RHEL and environment variables |
| ✍️ Technical writing | `docs/architecture`, manuals and academic paper |

### 🛤️ Suggested learning path

1. **Start with the frontend:** review routing, roles and the simulation form in `client/src`.
2. **Study the financial domain:** inspect `SimulationEngine`, French amortization and no-interest strategy.
3. **Trace backend layers:** follow a request from an Express route to a use case and repository.
4. **Review the database:** compare `docs/database/relational-model.png` with Sequelize models.
5. **Understand deployment:** read the CTIC manual and RHEL runbook to see how the project reaches production.

### 🧪 Suggested exercises

- Add a new validation rule to the simulation form and mirror it in the backend.
- Implement a new financial strategy and register it in `SimulationEngine`.
- Write a unit test for an amortization edge case.
- Map each functional flow to the relational tables that support it.
- Propose an accessibility improvement for one frontend screen.

### ✅ Why this fits GitHub Education

- It is based on a real institutional problem.
- It combines software architecture, finance, security, DevOps and documentation.
- It includes runnable code, formal manuals and deployment evidence.
- It can be studied without requiring access to private credentials or production secrets.
