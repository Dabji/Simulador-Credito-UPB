# Learn with Simulador de Credito UPB

[Espanol](#espanol) | [English](#english)

---

## Espanol

### Proposito educativo

Este repositorio sirve como caso de estudio para estudiantes que quieran entender como se construye una aplicacion web institucional completa: levantamiento de requerimientos, arquitectura, calculo financiero, persistencia relacional, pruebas, documentacion y despliegue en infraestructura real.

El proyecto fue desarrollado para resolver una necesidad concreta de la Universidad Pontificia Bolivariana Seccional Bucaramanga: permitir que estudiantes e interesados simulen escenarios de financiacion educativa y que administradores actualicen reglas financieras sin modificar codigo.

### Que puedes aprender

| Tema | Donde mirarlo |
|---|---|
| Clean Architecture | `server/src/Core`, `server/src/Application`, `server/src/Infrastructure` |
| Strategy Pattern | Motor de simulacion y estrategias de interes |
| React SPA | `client/src`, rutas, componentes compartidos y flujo por roles |
| Validacion con Zod | Esquemas de entrada en frontend y backend |
| API REST con Express | Rutas, middlewares, Swagger y controladores |
| Persistencia relacional | Modelos Sequelize, repositorios y scripts SQL |
| Seguridad | JWT, bcrypt, LDAP, CORS, Helmet, rate limiting y sanitizacion |
| Despliegue CTIC | `docs/deployment`, Nginx, PM2, RHEL y variables de entorno |
| Documentacion tecnica | `docs/architecture`, manuales y articulo academico |

### Rutas recomendadas de aprendizaje

1. **Frontend primero:** revisa la navegacion, los roles y el formulario de simulacion en `client/src`.
2. **Dominio financiero:** estudia el motor de simulacion, la amortizacion francesa y la estrategia sin interes.
3. **Backend por capas:** sigue una solicitud desde una ruta Express hasta el caso de uso y el repositorio.
4. **Base de datos:** compara `docs/database/relational-model.png` con los modelos Sequelize.
5. **Despliegue:** lee el manual CTIC y el runbook RHEL para entender como pasa de codigo a produccion.

### Ejercicios sugeridos

- Agrega una nueva regla de validacion al formulario de simulacion y replica la validacion en backend.
- Implementa una nueva estrategia financiera y registrala en el `SimulationEngine`.
- Crea una prueba unitaria para un caso limite de amortizacion.
- Revisa el modelo relacional y documenta que tabla soporta cada flujo funcional.
- Propone una mejora de accesibilidad en una pantalla del frontend.

### Buenas practicas que muestra el proyecto

- Separacion entre dominio, aplicacion e infraestructura.
- Documentacion de despliegue pensada para transferencia a un equipo externo.
- Plantillas de variables sin secretos reales.
- Evidencia funcional y tecnica versionada.
- Uso de manuales y articulo academico como soporte de trazabilidad.

---

## English

### Educational purpose

This repository is a case study for students who want to understand how a complete institutional web application is built: requirements, architecture, financial calculation, relational persistence, testing, documentation and deployment to a real infrastructure environment.

The project addresses a real need at Universidad Pontificia Bolivariana Bucaramanga: allowing students and applicants to simulate educational financing scenarios while administrators manage financial rules without changing application code.

### What you can learn

| Topic | Where to look |
|---|---|
| Clean Architecture | `server/src/Core`, `server/src/Application`, `server/src/Infrastructure` |
| Strategy Pattern | Simulation engine and interest strategies |
| React SPA | `client/src`, routing, shared components and role-based flows |
| Zod validation | Client and server input schemas |
| REST API with Express | Routes, middlewares, Swagger and controllers |
| Relational persistence | Sequelize models, repositories and SQL scripts |
| Security | JWT, bcrypt, LDAP, CORS, Helmet, rate limiting and sanitization |
| CTIC deployment | `docs/deployment`, Nginx, PM2, RHEL and environment variables |
| Technical writing | `docs/architecture`, manuals and academic paper |

### Suggested learning path

1. **Start with the frontend:** review routing, roles and the simulation form in `client/src`.
2. **Study the financial domain:** inspect the simulation engine, French amortization and no-interest strategy.
3. **Trace backend layers:** follow a request from an Express route to a use case and repository.
4. **Review the database:** compare `docs/database/relational-model.png` with Sequelize models.
5. **Understand deployment:** read the CTIC manual and RHEL runbook to see how the project reaches production.

### Suggested exercises

- Add a new validation rule to the simulation form and mirror it in the backend.
- Implement a new financial strategy and register it in `SimulationEngine`.
- Write a unit test for an amortization edge case.
- Map each functional flow to the relational tables that support it.
- Propose an accessibility improvement for one frontend screen.

### Why this project fits GitHub Education

- It is based on a real institutional problem.
- It combines software architecture, finance, security, DevOps and documentation.
- It includes runnable code, formal manuals and deployment evidence.
- It can be studied without requiring access to private credentials or production secrets.
