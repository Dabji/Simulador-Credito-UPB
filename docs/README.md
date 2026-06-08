# Documentacion del Simulador de Credito UPB

Indice central para la documentacion versionada del proyecto. Esta carpeta queda orientada exclusivamente al Simulador de Credito UPB y consolida los artefactos tecnicos, academicos, operativos y de entrega final de HU-83.

## Estructura documental

```text
docs/
├── academic/              # Articulo IEEE y presentacion final
├── architecture/          # Diseno del sistema, ADR, pruebas y diagramas tecnicos
│   └── assets/diagrams/   # Diagramas extraidos de la sustentacion final
├── database/              # Modelo conceptual, modelo relacional, scripts y diccionario
├── deployment/            # Despliegue CTIC, runbooks, evidencias y assets operativos
├── diagrams/              # Modelos UML editables y diagrama de clases
├── financial-guidelines/  # Formatos financieros usados como insumo
├── manuals/               # Manuales finales de usuario y tecnico
├── meeting-minutes/       # Actas de reuniones con el area financiera
├── requirements/          # Charter, backlog, SRS y verificacion
└── sprints/               # Evidencias y entregables por sprint
```

## Manuales y entregables finales

| Artefacto | Ubicacion | Uso |
|---|---|---|
| Manual de usuario | [`manuals/Manual_Usuario_Simulador_Credito_UPB.pdf`](./manuals/Manual_Usuario_Simulador_Credito_UPB.pdf) | Guia funcional para estudiantes, invitados y administradores. |
| Manual tecnico | [`manuals/Manual de Técnico Simulador.pdf`](./manuals/Manual%20de%20T%C3%A9cnico%20Simulador.pdf) | Descripcion tecnica de arquitectura, componentes, base de datos y operacion. |
| Manual de despliegue CTIC | [`deployment/Manual de Despliegue Simulador - CTIC.pdf`](./deployment/Manual%20de%20Despliegue%20Simulador%20-%20CTIC.pdf) | Procedimiento formal para instalar, validar y volver a desplegar en la VM CTIC. |
| Articulo IEEE | [`academic/Articulo IEEE Simulador de Credito UPB.pdf`](./academic/Articulo%20IEEE%20Simulador%20de%20Credito%20UPB.pdf) | Sustento academico del proyecto. |
| Sustentacion final | [`academic/Simulador de Crédito UPB Sustentación Final.pptx`](./academic/Simulador%20de%20Cr%C3%A9dito%20UPB%20Sustentaci%C3%B3n%20Final.pptx) | Presentacion final y fuente de diagramas graficos. |

## Arquitectura

| Documento | Contenido |
|---|---|
| [`architecture/README.md`](./architecture/README.md) | Vista ejecutiva de arquitectura y enlaces a diagramas graficos. |
| [`architecture/system-design.md`](./architecture/system-design.md) | Flujos tecnicos principales, Mermaid y responsabilidades de componentes. |
| [`architecture/technical-decisions.md`](./architecture/technical-decisions.md) | ADR: Clean Architecture, Strategy Pattern, validacion, auth, monorepo, Aiven y seguridad. |
| [`architecture/environments-and-secrets.md`](./architecture/environments-and-secrets.md) | Ambientes, variables, secretos y manejo fail-fast. |
| [`architecture/integration-test.md`](./architecture/integration-test.md) | Evidencias de pruebas de integracion, funcionales/manuales y regresion. |
| [`architecture/unit-test.md`](./architecture/unit-test.md) | Evidencias de pruebas unitarias y de servicios. |
| [`architecture/test-evidence.md`](./architecture/test-evidence.md) | Resumen historico de evidencia de testing. |

## Base de datos

| Documento | Contenido |
|---|---|
| [`database/README.md`](./database/README.md) | Resumen del modelo relacional final y enlaces a imagenes. |
| [`database/relational-model.png`](./database/relational-model.png) | Modelo relacional actualizado del simulador. |
| [`database/conceptual-model.png`](./database/conceptual-model.png) | Modelo conceptual de entidades y relaciones. |
| [`database/data-dictionary.html`](./database/data-dictionary.html) | Diccionario de datos. |
| [`database/hu-66/backup-migration.md`](./database/hu-66/backup-migration.md) | Preparacion y migracion hacia MariaDB CTIC. |
| [`database/hu-66/scripts/00_ctic_full_deploy_mariadb_10_11.sql`](./database/hu-66/scripts/00_ctic_full_deploy_mariadb_10_11.sql) | Script consolidado de despliegue de base de datos. |

## Despliegue CTIC

| Documento | Contenido |
|---|---|
| [`deployment/README.md`](./deployment/README.md) | Indice operativo de despliegue, puertos y diagramas CTIC. |
| [`deployment/CTIC-RHEL-RUNBOOK.md`](./deployment/CTIC-RHEL-RUNBOOK.md) | Runbook accionable para VM RHEL. |
| [`deployment/CTIC-PROD-DEPLOYMENT.md`](./deployment/CTIC-PROD-DEPLOYMENT.md) | Guia tecnica de produccion CTIC. |
| [`deployment/PRE-PROD-ENVIRONMENT.md`](./deployment/PRE-PROD-ENVIRONMENT.md) | Ambiente de preproduccion y runner self-hosted. |
| [`deployment/HU-91-DEPLOYMENT-CLOSURE.md`](./deployment/HU-91-DEPLOYMENT-CLOSURE.md) | Cierre tecnico de despliegue y evidencias de validacion. |
| [`deployment/ctic-rhel10-bootstrap.sh`](./deployment/ctic-rhel10-bootstrap.sh) | Bootstrap RHEL 10 para instalar dependencias, configurar Nginx y levantar PM2. |
| [`deployment/ctic-rhel10.deploy.env.example`](./deployment/ctic-rhel10.deploy.env.example) | Plantilla sin secretos para el archivo real de despliegue. |

## Requisitos, sprints y soporte de proyecto

| Carpeta | Contenido |
|---|---|
| [`requirements/`](./requirements/) | Project Charter, backlog, SRS, presupuesto y checklist de verificacion. |
| [`sprints/`](./sprints/) | Artefactos de seguimiento por sprint. |
| [`meeting-minutes/`](./meeting-minutes/) | Actas firmadas con el area financiera. |
| [`financial-guidelines/`](./financial-guidelines/) | Formatos oficiales usados como insumo funcional. |
| [`diagrams/`](./diagrams/) | Diagramas UML editables y diagrama de clases general. |

## Politica de publicacion

- No versionar `.env`, `*.deploy.env`, certificados, llaves privadas, dumps reales, logs de produccion ni artefactos generados.
- Mantener solo plantillas sin secretos y ejemplos con placeholders.
- Usar variables genericas para dominios, usuarios, tokens, SMTP, LDAP y base de datos.
- Validar enlaces locales y ausencia de documentacion ajena antes de hacer publico el repositorio.
