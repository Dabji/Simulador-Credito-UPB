# Documentacion / Documentation

Indice central de documentacion del **Simulador de Credito UPB**.
Central documentation index for the **UPB Educational Credit Simulator**.

Produccion / Production: [https://simuladorfinanciaciondirecta.bucaramanga.upb.edu.co/](https://simuladorfinanciaciondirecta.bucaramanga.upb.edu.co/)

## Estructura / Structure

| Carpeta | Contenido |
|---|---|
| [`academic/`](./academic/) | Articulo IEEE y sustentacion final. |
| [`architecture/`](./architecture/) | Diseno del sistema, ADR, ambientes, pruebas y diagramas. |
| [`database/`](./database/) | Modelo conceptual, modelo relacional, scripts y diccionario. |
| [`deployment/`](./deployment/) | Manual CTIC, runbooks, bootstrap, puertos y evidencias. |
| [`diagrams/`](./diagrams/) | Modelos UML editables y diagrama de clases. |
| [`financial-guidelines/`](./financial-guidelines/) | Formatos financieros usados como insumo funcional. |
| [`manuals/`](./manuals/) | Manual de usuario y manual tecnico. |
| [`meeting-minutes/`](./meeting-minutes/) | Actas de reuniones con el area financiera. |
| [`requirements/`](./requirements/) | Project Charter, backlog, SRS, presupuesto y checklist. |
| [`sprints/`](./sprints/) | Evidencias y entregables por sprint. |

## Entregables principales / Main Deliverables

| Artefacto | Ubicacion | Uso |
|---|---|---|
| Manual de usuario | [`manuals/Manual_Usuario_Simulador_Credito_UPB.pdf`](./manuals/Manual_Usuario_Simulador_Credito_UPB.pdf) | Guia funcional para estudiantes, invitados y administradores. |
| Manual tecnico | [`manuals/Manual de Técnico Simulador.pdf`](./manuals/Manual%20de%20T%C3%A9cnico%20Simulador.pdf) | Arquitectura, componentes, base de datos y operacion. |
| Manual de despliegue CTIC | [`deployment/Manual de Despliegue Simulador - CTIC.pdf`](./deployment/Manual%20de%20Despliegue%20Simulador%20-%20CTIC.pdf) | Instalacion, validacion y nuevo despliegue en VM CTIC. |
| Articulo IEEE | [`academic/Articulo IEEE Simulador de Credito UPB.pdf`](./academic/Articulo%20IEEE%20Simulador%20de%20Credito%20UPB.pdf) | Sustento academico del proyecto. |
| Diagramas de sustentacion | [`architecture/assets/diagrams/`](./architecture/assets/diagrams/) | Imagenes exportadas y versionadas desde la sustentacion final. |

## Arquitectura / Architecture

| Documento | Contenido |
|---|---|
| [`architecture/README.md`](./architecture/README.md) | Vista ejecutiva de arquitectura y diagramas graficos. |
| [`architecture/system-design.md`](./architecture/system-design.md) | Flujos tecnicos, componentes, seguridad, datos y despliegue. |
| [`architecture/technical-decisions.md`](./architecture/technical-decisions.md) | ADR: Clean Architecture, Strategy Pattern, validacion, auth, Aiven y seguridad. |
| [`architecture/environments-and-secrets.md`](./architecture/environments-and-secrets.md) | Ambientes, variables, secretos y manejo fail-fast. |
| [`architecture/integration-test.md`](./architecture/integration-test.md) | Evidencias de integracion, funcionales/manuales y regresion. |
| [`architecture/unit-test.md`](./architecture/unit-test.md) | Evidencias unitarias del motor financiero, servicios y validaciones. |
| [`architecture/test-evidence.md`](./architecture/test-evidence.md) | Resumen historico de evidencia de testing. |

## Base de datos / Database

| Documento | Contenido |
|---|---|
| [`database/README.md`](./database/README.md) | Modelo relacional, modelo conceptual y consideraciones CTIC. |
| [`database/relational-model.png`](./database/relational-model.png) | Modelo relacional actualizado. |
| [`database/conceptual-model.png`](./database/conceptual-model.png) | Modelo conceptual de entidades y relaciones. |
| [`database/data-dictionary.html`](./database/data-dictionary.html) | Diccionario de datos. |
| [`database/hu-66/backup-migration.md`](./database/hu-66/backup-migration.md) | Preparacion y migracion hacia MariaDB CTIC. |
| [`database/hu-66/scripts/00_ctic_full_deploy_mariadb_10_11.sql`](./database/hu-66/scripts/00_ctic_full_deploy_mariadb_10_11.sql) | Script consolidado de despliegue de base de datos. |

## Despliegue / Deployment

| Documento | Contenido |
|---|---|
| [`deployment/README.md`](./deployment/README.md) | Indice operativo, diagramas, puertos y reglas de seguridad. |
| [`deployment/CTIC-RHEL-RUNBOOK.md`](./deployment/CTIC-RHEL-RUNBOOK.md) | Runbook accionable para VM RHEL. |
| [`deployment/CTIC-PROD-DEPLOYMENT.md`](./deployment/CTIC-PROD-DEPLOYMENT.md) | Guia tecnica de produccion CTIC. |
| [`deployment/PRE-PROD-ENVIRONMENT.md`](./deployment/PRE-PROD-ENVIRONMENT.md) | Ambiente de preproduccion y runner self-hosted. |
| [`deployment/HU-91-DEPLOYMENT-CLOSURE.md`](./deployment/HU-91-DEPLOYMENT-CLOSURE.md) | Cierre tecnico de despliegue y evidencias. |
| [`deployment/ctic-rhel10-bootstrap.sh`](./deployment/ctic-rhel10-bootstrap.sh) | Bootstrap RHEL 10. |
| [`deployment/ctic-rhel10.deploy.env.example`](./deployment/ctic-rhel10.deploy.env.example) | Plantilla sin secretos. |

## Politica de publicacion / Publishing Policy

- No versionar `.env`, `*.deploy.env`, certificados, llaves privadas, dumps reales, logs de produccion ni artefactos generados.
- Mantener solo plantillas sin secretos y ejemplos con placeholders.
- Usar variables genericas para dominios, tokens, SMTP, LDAP y base de datos.
- Verificar enlaces locales antes de publicar el repositorio en GitHub Education.
