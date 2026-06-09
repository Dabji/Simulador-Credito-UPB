<div align="center">

# 📚 Documentación / Documentation

**Índice documental del Simulador de Crédito UPB**
**Documentation index for the UPB Educational Credit Simulator**

[🌐 Producción](https://simuladorfinanciaciondirecta.bucaramanga.upb.edu.co/) ·
[🎓 LEARN.md](../LEARN.md) ·
[🏠 README](../README.md)

</div>

---

## 🗂️ Estructura / Structure

| Carpeta | Contenido |
|---|---|
| 🎓 [`academic/`](./academic/) | Artículo IEEE y entregables académicos. |
| 🏛️ [`architecture/`](./architecture/) | Diseño del sistema, ADR, ambientes, pruebas y diagramas. |
| 🗄️ [`database/`](./database/) | Modelo conceptual, modelo relacional, scripts y diccionario. |
| 🚀 [`deployment/`](./deployment/) | Manual CTIC, runbooks, bootstrap, puertos y evidencias. |
| 📐 [`diagrams/`](./diagrams/) | Modelos UML editables y diagrama de clases. |
| 💰 [`financial-guidelines/`](./financial-guidelines/) | Formatos financieros usados como insumo funcional. |
| 📘 [`manuals/`](./manuals/) | Manual de usuario y manual técnico. |
| 🤝 [`meeting-minutes/`](./meeting-minutes/) | Actas de reuniones con el área financiera. |
| 📋 [`requirements/`](./requirements/) | Project Charter, backlog, SRS, presupuesto y checklist. |
| 🏃 [`sprints/`](./sprints/) | Evidencias y entregables por sprint. |

## ⭐ Entregables principales / Main Deliverables

| Artefacto | Ubicación | Uso |
|---|---|---|
| 📘 Manual de usuario | [`manuals/Manual_Usuario_Simulador_Credito_UPB.pdf`](./manuals/Manual_Usuario_Simulador_Credito_UPB.pdf) | Guía funcional para estudiantes, invitados y administradores. |
| 🛠️ Manual técnico | [`manuals/Manual de Técnico Simulador.pdf`](./manuals/Manual%20de%20T%C3%A9cnico%20Simulador.pdf) | Arquitectura, componentes, base de datos y operación. |
| 🚀 Manual de despliegue CTIC | [`deployment/Manual de Despliegue Simulador - CTIC.pdf`](./deployment/Manual%20de%20Despliegue%20Simulador%20-%20CTIC.pdf) | Instalación, validación y nuevo despliegue en VM CTIC. |
| 🎓 Artículo IEEE | [`academic/Articulo IEEE Simulador de Credito UPB.pdf`](./academic/Articulo%20IEEE%20Simulador%20de%20Credito%20UPB.pdf) | Sustento académico del proyecto. |
| 🖼️ Diagramas de sustentación | [`architecture/assets/diagrams/`](./architecture/assets/diagrams/) | Imágenes exportadas y versionadas desde la sustentación final. |

## 🏛️ Arquitectura / Architecture

| Documento | Contenido |
|---|---|
| [`architecture/README.md`](./architecture/README.md) | Vista ejecutiva de arquitectura y diagramas gráficos. |
| [`architecture/system-design.md`](./architecture/system-design.md) | Flujos técnicos, componentes, seguridad, datos y despliegue. |
| [`architecture/technical-decisions.md`](./architecture/technical-decisions.md) | ADR: Clean Architecture, Strategy Pattern, validación, auth, Aiven y seguridad. |
| [`architecture/environments-and-secrets.md`](./architecture/environments-and-secrets.md) | Ambientes, variables, secretos y manejo fail-fast. |
| [`architecture/integration-test.md`](./architecture/integration-test.md) | Evidencias de integración, funcionales/manuales y regresión. |
| [`architecture/unit-test.md`](./architecture/unit-test.md) | Evidencias unitarias del motor financiero, servicios y validaciones. |
| [`architecture/test-evidence.md`](./architecture/test-evidence.md) | Resumen histórico de evidencia de testing. |

## 🗄️ Base de datos / Database

| Documento | Contenido |
|---|---|
| [`database/README.md`](./database/README.md) | Modelo relacional, modelo conceptual y consideraciones CTIC. |
| [`database/relational-model.png`](./database/relational-model.png) | Modelo relacional actualizado. |
| [`database/conceptual-model.png`](./database/conceptual-model.png) | Modelo conceptual de entidades y relaciones. |
| [`database/data-dictionary.html`](./database/data-dictionary.html) | Diccionario de datos. |
| [`database/hu-66/backup-migration.md`](./database/hu-66/backup-migration.md) | Preparación y migración hacia MariaDB CTIC. |
| [`database/hu-66/scripts/00_ctic_full_deploy_mariadb_10_11.sql`](./database/hu-66/scripts/00_ctic_full_deploy_mariadb_10_11.sql) | Script consolidado de despliegue de base de datos. |

## 🚀 Despliegue / Deployment

| Documento | Contenido |
|---|---|
| [`deployment/README.md`](./deployment/README.md) | Índice operativo, diagramas, puertos y reglas de seguridad. |
| [`deployment/CTIC-RHEL-RUNBOOK.md`](./deployment/CTIC-RHEL-RUNBOOK.md) | Runbook accionable para VM RHEL. |
| [`deployment/CTIC-PROD-DEPLOYMENT.md`](./deployment/CTIC-PROD-DEPLOYMENT.md) | Guía técnica de producción CTIC. |
| [`deployment/PRE-PROD-ENVIRONMENT.md`](./deployment/PRE-PROD-ENVIRONMENT.md) | Ambiente de preproducción y runner self-hosted. |
| [`deployment/HU-91-DEPLOYMENT-CLOSURE.md`](./deployment/HU-91-DEPLOYMENT-CLOSURE.md) | Cierre técnico de despliegue y evidencias. |
| [`deployment/ctic-rhel10-bootstrap.sh`](./deployment/ctic-rhel10-bootstrap.sh) | Bootstrap RHEL 10. |
| [`deployment/ctic-rhel10.deploy.env.example`](./deployment/ctic-rhel10.deploy.env.example) | Plantilla sin secretos. |

## 🔒 Política de publicación / Publishing Policy

- No versionar `.env`, `*.deploy.env`, certificados, llaves privadas, dumps reales, logs de producción ni artefactos generados.
- Mantener solo plantillas sin secretos y ejemplos con placeholders.
- Usar variables genéricas para dominios, tokens, SMTP, LDAP y base de datos.
- Verificar enlaces locales antes de publicar el repositorio en GitHub Education.
