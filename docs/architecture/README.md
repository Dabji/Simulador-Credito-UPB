<div align="center">

# 🏛️ Arquitectura / Architecture

**Diseño técnico, decisiones arquitectónicas, evidencias y diagramas del Simulador de Crédito UPB.**

</div>

---

## 🧭 Vista de alto nivel / High-level View

<div align="center">
  <img src="./assets/diagrams/system-context.png" alt="Vista de contexto del Simulador de Crédito UPB" width="920" />
  <br />
  <em>Cliente React, API Node.js, base de datos, LDAP y SMTP.</em>
</div>

## 🖼️ Diagramas principales / Main Diagrams

| Diagrama | Archivo |
|---|---|
| 🌐 Contexto del sistema / System context | [`assets/diagrams/system-context.png`](./assets/diagrams/system-context.png) |
| 🧩 Componentes principales / Component diagram | [`assets/diagrams/component-diagram.png`](./assets/diagrams/component-diagram.png) |
| 🟢 Servidor de aplicación / Application server | [`assets/diagrams/application-server.png`](./assets/diagrams/application-server.png) |
| ⚛️ Cliente React / React web client | [`assets/diagrams/react-web-client.png`](./assets/diagrams/react-web-client.png) |

## 📄 Documentos técnicos / Technical Documents

| Documento | Propósito |
|---|---|
| ⚙️ [`system-design.md`](./system-design.md) | Flujos de sistema, componentes, seguridad, datos y despliegue. |
| 📝 [`technical-decisions.md`](./technical-decisions.md) | Registro ADR de decisiones arquitectónicas. |
| 🔐 [`environments-and-secrets.md`](./environments-and-secrets.md) | Ambientes, variables y política de secretos. |
| 🧪 [`integration-test.md`](./integration-test.md) | Evidencias de integración, funcionales/manuales y regresión. |
| ✅ [`unit-test.md`](./unit-test.md) | Evidencias unitarias de motor financiero, servicios y validaciones. |

## 🧱 Capas principales / Main Layers

| Capa | Componentes | Responsabilidad |
|---|---|---|
| 🎨 Presentación | React, React Router, React Hook Form, Zod, Tailwind | Captura de datos, rutas por rol y visualización de resultados. |
| 🟢 API | Express, middlewares, controladores, Swagger | Endpoints REST, validación de entrada y seguridad HTTP. |
| 🧠 Aplicación | Use cases, `SimulationService`, `ParameterService`, `AuditService` | Orquestación de reglas de negocio. |
| 🧮 Dominio | Entidades, DTO, `SimulationEngine`, estrategias de interés | Cálculo financiero y reglas de simulación. |
| 🛠️ Infraestructura | Sequelize, JWT, LDAP, SMTP, PM2, Nginx | Persistencia, autenticación, correo y operación. |

## 🔒 Notas de seguridad / Security Notes

- No publicar secretos reales en Markdown, capturas ni archivos de ejemplo.
- Usar placeholders para dominios, tokens, SMTP, LDAP y base de datos.
- Exponer la API por Nginx bajo `/api`; mantener Node.js en `localhost:3000`.
