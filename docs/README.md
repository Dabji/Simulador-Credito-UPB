<div align="center">

# 📖 Documentación — Simulador de Crédito UPB

Índice centralizado de toda la documentación del proyecto.

</div>

---

## 📂 Estructura

```
docs/
├── architecture/           # 🏗️ Sustento técnico (ADRs, flujos, evidencias)
│   ├── technical-decisions.md
│   ├── system-design.md
│   ├── environments-and-secrets.md
│   ├── environments-and-secrets.docx
│   └── test-evidence.md
├── deployment/             # 🚀 Ambientes, despliegue CTIC y evidencia operativa
│   ├── PRE-PROD-ENVIRONMENT.md
│   └── CTIC-PROD-DEPLOYMENT.md
├── requirements/           # Requisitos, charter, backlog y especificaciones
├── diagrams/               # Diagramas UML por módulo (StarUML)
│   └── class-diagram/      # Diagrama de clases general
├── database/               # Modelo ER y diccionario de datos
├── financial-guidelines/   # Formatos oficiales del área financiera
├── meeting-minutes/        # Actas de reunión firmadas
├── sprints/                # Artefactos por sprint
│   └── sprint-1/
└── track 2/                # 📡 Infraestructura de red (DHCP, FTP, Proxy)
├── track 2/                # 📡 Infraestructura de red (DHCP, FTP, Proxy)
│   ├── HU-65-proxy-client.md
```

---

## 🛡️ Sustento Técnico — Arquitectura y Evidencias

Documentación técnica que fundamenta las decisiones de diseño y demuestra la calidad del sistema.

| Archivo | Descripción |
|---|---|
| [`technical-decisions.md`](./architecture/technical-decisions.md) | **9 ADRs** — Clean Architecture, Strategy Pattern, validación Zod + XSS, autenticación dual JWT/LDAP, monorepo npm workspaces, stack React 19 + Vite, MySQL Aiven Cloud, soft-delete + purga automática y manejo seguro de ambientes/secretos. |
| [`system-design.md`](./architecture/system-design.md) | **Flujos técnicos** — Diagrama de secuencia completo de una simulación (Form → Middleware → UseCase → Engine → Strategy), modelo de seguridad Defense in Depth (7 capas), flujo de autenticación, exportación PDF, ciclo de vida de simulaciones y modelo ER detallado. |
| [`environments-and-secrets.md`](./architecture/environments-and-secrets.md) | **HU-58** — Definición de ambientes Local, Testing/Staging y Producción WAN; matriz de variables; estrategia de secretos; guía de configuración local y evidencia documental. |
| [`environments-and-secrets.docx`](./architecture/environments-and-secrets.docx) | **Versión Word** — Documento editable para entrega formal o revisión externa de la HU-58. |
| [`test-evidence.md`](./architecture/test-evidence.md) | **Evidencias de testing** — Salida de Jest (4 suites, 50 tests) y Vitest (2 suites, 6 tests), reporte de cobertura de código, análisis de componentes con alta/baja cobertura y plan de mejora por sprint. |

---

## 🚀 Despliegue y Ambientes

Documentación operativa de HU-59 para los ambientes de Pre-Producción y Producción CTIC.

| Archivo | Descripción |
|---|---|
| [`PRE-PROD-ENVIRONMENT.md`](./deployment/PRE-PROD-ENVIRONMENT.md) | **Pre-Producción / Staging** — Entorno automatizado con GitHub Actions, runner self-hosted RHEL, Aiven Cloud MySQL, PM2 cluster y Nginx. |
| [`CTIC-PROD-DEPLOYMENT.md`](./deployment/CTIC-PROD-DEPLOYMENT.md) | **Producción CTIC** — Guía formal para despliegue manual/script on-premise con RHEL, Nginx, PM2, systemd y MariaDB administrada por CTIC. |

---

## 📋 Requisitos y Planeación

| Archivo | Descripción |
|---|---|
| [`project-charter.docx`](./requirements/project-charter.docx) | Acta de constitución del proyecto |
| [`product-backlog.xlsx`](./requirements/product-backlog.xlsx) | Product Backlog con todas las historias de usuario |
| [`software-requirements.pdf`](./requirements/software-requirements.pdf) | Planificación y especificación de requisitos de software (firmado) |
| [`project-specifications.pdf`](./requirements/project-specifications.pdf) | Especificaciones del proyecto integrador |
| [`project-budget.xlsx`](./requirements/project-budget.xlsx) | Presupuesto del proyecto |
| [`verification-checklist.docx`](./requirements/verification-checklist.docx) | Lista de verificación de entregables |

---

## 📐 Diagramas

| Archivo | Descripción |
|---|---|
| [`module-01-access-and-roles.mdj`](./diagrams/module-01-access-and-roles.mdj) | Módulo 1 — Acceso y gestión de roles |
| [`module-02-forms-validations-history.mdj`](./diagrams/module-02-forms-validations-history.mdj) | Módulos 2 y 4 — Formularios, validaciones e historial |
| [`module-03-calculation-results.mdj`](./diagrams/module-03-calculation-results.mdj) | Módulo 3 — Cálculo financiero y resultados |
| [`module-05-exports.mdj`](./diagrams/module-05-exports.mdj) | Módulo 5 — Exportaciones |
| [`module-06-admin-parameterization.mdj`](./diagrams/module-06-admin-parameterization.mdj) | Módulo 6 — Administración y parametrización |
| [`class-diagram.jpg`](./diagrams/class-diagram/class-diagram.jpg) | Diagrama de clases general (imagen) |
| [`class-diagram.mdj`](./diagrams/class-diagram/class-diagram.mdj) | Diagrama de clases (StarUML editable) |
| [`class-diagram-explanation.docx`](./diagrams/class-diagram/class-diagram-explanation.docx) | Explicación detallada del diagrama de clases |

---

## 🗄️ Base de Datos

| Archivo | Descripción |
|---|---|
| [`er-diagram.png`](./database/er-diagram.png) | Diagrama entidad-relación del modelo final |
| [`data-dictionary.html`](./database/data-dictionary.html) | Diccionario de datos (tablas, columnas, tipos y restricciones) |

---

## 💰 Lineamientos Financieros

| Archivo | Descripción |
|---|---|
| [`credit-application-form.pdf`](./financial-guidelines/credit-application-form.pdf) | Formato estándar de solicitud de crédito |
| [`credit-application-upb-tech.pdf`](./financial-guidelines/credit-application-upb-tech.pdf) | Formato de solicitud de crédito UPB Tech |

---

## 🤝 Actas de Reunión

Actas de reuniones firmadas con el área financiera de la UPB.

| Archivo | Sesión |
|---|---|
| [`meeting-01.pdf`](./meeting-minutes/meeting-01.pdf) | Reunión 1 |
| [`meeting-02.pdf`](./meeting-minutes/meeting-02.pdf) | Reunión 2 |
| [`meeting-03.pdf`](./meeting-minutes/meeting-03.pdf) | Reunión 3 |
| [`meeting-04.pdf`](./meeting-minutes/meeting-04.pdf) | Reunión 4 |
| [`meeting-05.pdf`](./meeting-minutes/meeting-05.pdf) | Reunión 5 |
| [`meeting-06.pdf`](./meeting-minutes/meeting-06.pdf) | Reunión 6 |
| [`meeting-07.pdf`](./meeting-minutes/meeting-07.pdf) | Reunión 7 |

---

## 🏃 Sprints

### Sprint 1

| Archivo | Descripción |
|---|---|
| [`sprint-1-backlog.xlsx`](./sprints/sprint-1/sprint-1-backlog.xlsx) | Sprint Backlog con tareas y estimaciones |
| [`sprint-1-presentation.pptx`](./sprints/sprint-1/sprint-1-presentation.pptx) | Presentación de cierre del Sprint 1 |

---

## 📡 Infraestructura de Red (Track 2)

Documentación correspondiente a la configuración de servicios de red e integración de topología.

| Archivo | Descripción |
|---|---|
| [`HU-65-proxy-client.md`](./track%202/HU-65-proxy-client.md) | **HU-65** — Configuración y validación del cliente para el servicio Proxy (Evidencia funcional y logs). |
| [`HU-65-proxy-client.docx`](./track%202/HU-65-proxy-client.docx) | **HU-65 (Word)** — Versión editable del informe de configuración y validación del cliente proxy. |
| *Directorio de pruebas* | Ver [`track 2/`](./track%202/) para evidencias de DHCP y FTP. |

---

## 🖼️ Capturas de Pantalla

Las siguientes capturas provienen de los Pull Requests del proyecto y documentan el estado funcional de cada módulo.

<details>
<summary><strong>🔐 Autenticación y Registro</strong></summary>
<br/>

| Captura | Descripción |
|:---:|---|
| <img src="https://github.com/user-attachments/assets/04bcc531-9b30-4972-8e3d-d7b0516c62b0" width="400" /> | Formulario de login |
| <img src="https://github.com/user-attachments/assets/6c4075d5-c690-4eeb-bc1f-db442783a1cb" width="400" /> | Redirección STUDENT → `/student/main` |
| <img src="https://github.com/user-attachments/assets/8a5be1ae-f2c2-42a3-8279-3f0bf85121a7" width="400" /> | Dashboard del estudiante autenticado |
| <img src="https://github.com/user-attachments/assets/588f6061-851a-49c7-8810-a89d59298b7d" width="400" /> | Validación visual de fortaleza de contraseña |
| <img src="https://github.com/user-attachments/assets/9a76d731-de3f-4eef-a8eb-7762d41098a8" width="400" /> | Retroalimentación de errores por campo |
| <img src="https://github.com/user-attachments/assets/291ae998-3e77-4bb5-8c45-c5b7803b8912" width="400" /> | Correo HTML de recuperación de contraseña |

</details>

<details>
<summary><strong>👤 Modo Invitado</strong></summary>
<br/>

| Captura | Descripción |
|:---:|---|
| <img src="https://github.com/user-attachments/assets/40ea854a-02b2-49a7-a7d3-8bfe328df40d" width="400" /> | Página principal invitado con badge "Modo Invitado" |
| <img src="https://github.com/user-attachments/assets/edea8693-cd6e-41ba-a666-87985c495062" width="400" /> | CTA "Crear Nueva Simulación" |
| <img src="https://github.com/user-attachments/assets/2cf7914c-bae2-44b8-ad7d-2f50c9d7a1d8" width="400" /> | Tarjeta informativa modo invitado |
| <img src="https://github.com/user-attachments/assets/91d1ff52-9c86-4b1a-a116-4343927465dd" width="400" /> | Formulario de simulación (guest) |
| <img src="https://github.com/user-attachments/assets/5719bb52-769d-4914-9427-23cc3a43e3be" width="400" /> | Resultados invitado (sin botón "Guardar") |

</details>

<details>
<summary><strong>🧮 Simulador y Resultados</strong></summary>
<br/>

| Captura | Descripción |
|:---:|---|
| <img src="https://github.com/user-attachments/assets/64bba96f-5df4-4293-8692-57492f1b90c6" width="400" /> | Encabezado y datos del estudiante |
| <img src="https://github.com/user-attachments/assets/6bf44496-fcfd-42cb-bb0b-acac2e783e5d" width="400" /> | Resumen financiero y gráficas |
| <img src="https://github.com/user-attachments/assets/b02a766e-339d-4e1c-a93d-ec85d980316a" width="400" /> | Gráficas de distribución (donut chart) |
| <img src="https://github.com/user-attachments/assets/1e95658a-923a-4bf1-a350-45e332bcb8b3" width="400" /> | Vista completa de resultados |
| <img src="https://github.com/user-attachments/assets/afdd6c3d-5321-473d-8fa5-5cb752782188" width="400" /> | Tabla de amortización + botón Exportar |

</details>

<details>
<summary><strong>📜 Historial de Simulaciones</strong></summary>
<br/>

| Captura | Descripción |
|:---:|---|
| <img src="https://github.com/user-attachments/assets/2f37e5f7-da21-4a5a-aad8-4ff65c8b415c" width="400" /> | Vista completa con tabla + mensaje de retención 90 días |
| <img src="https://github.com/user-attachments/assets/51cd6f7b-be44-46b1-baee-83497126e1b9" width="400" /> | Dropdown de filtros (Modalidad / Período / Fecha) |
| <img src="https://github.com/user-attachments/assets/62c2e05b-9587-414d-a258-06c0edaa9fef" width="400" /> | Fila seleccionada + botones "Ver" y "Exportar" |
| <img src="https://github.com/user-attachments/assets/c2e4ded3-5618-4886-8144-2d95f5556f96" width="400" /> | Flujo completo de historial |
| <img src="https://github.com/user-attachments/assets/924cad68-586a-4a83-8d4c-fe2f5bcb7415" width="400" /> | Detalle de simulación guardada |
| <img src="https://github.com/user-attachments/assets/6cdd5295-59d0-4c68-8527-3bd705aeaa16" width="400" /> | Vista de exportación |
| <img src="https://github.com/user-attachments/assets/b5fbac4b-0677-4bde-9166-bb7d6204f3db" width="400" /> | Gráfica en detalle de historial |
| <img src="https://github.com/user-attachments/assets/9d8b3d88-dc5a-467f-a4be-6d6088d3b917" width="400" /> | Tabla amortización en detalle |
| <img src="https://github.com/user-attachments/assets/70ff4fdb-b035-4175-984c-aa5b038182ef" width="400" /> | Exportación desde historial |

</details>

<details>
<summary><strong>📄 Exportación PDF</strong></summary>
<br/>

| Captura | Descripción |
|:---:|---|
| <img src="https://github.com/user-attachments/assets/90c3fdc3-0f0c-44f8-b2cf-0ad376ee79b8" width="400" /> | Documento PDF generado (encabezado + datos) |
| <img src="https://github.com/user-attachments/assets/375f1d96-ee7a-450b-a206-9ad5595e8dc0" width="400" /> | Tabla de amortización en PDF |

</details>

<details>
<summary><strong>🛡️ Panel de Administración</strong></summary>
<br/>

| Captura | Descripción |
|:---:|---|
| <img src="https://github.com/user-attachments/assets/7ab7218d-469a-4912-aa68-4ee8e6bee410" width="400" /> | Login como ADMIN |
| <img src="https://github.com/user-attachments/assets/af791a4e-e106-496d-92ab-96a3a662cfa7" width="400" /> | Menú principal Admin (Students / Parameters / Simulations) |
| <img src="https://github.com/user-attachments/assets/2fe63994-1aff-4acf-b3bc-2946a290addc" width="400" /> | `/admin/students` |
| <img src="https://github.com/user-attachments/assets/5a868a21-fff1-4b9e-b37a-4a54ecb9a691" width="400" /> | `/admin/parameters` |
| <img src="https://github.com/user-attachments/assets/0f1ad345-ce54-4bb6-9d8f-7b2b9c874249" width="400" /> | `/admin/simulations` |
| <img src="https://github.com/user-attachments/assets/33009ce6-3ed8-4f3e-bcc0-4705b0f28d71" width="400" /> | Gestión de Simulaciones: tabla + paginación |
| <img src="https://github.com/user-attachments/assets/2a41f9d7-6c01-426e-ad5b-9d3055b08bdb" width="400" /> | Dropdown de filtros + búsqueda aplicada |
| <img src="https://github.com/user-attachments/assets/51f36e99-d303-436a-a73f-8dcca10c6a52" width="400" /> | Modal de confirmación "Eliminar Simulación" |
| <img src="https://github.com/user-attachments/assets/065c0e09-20bf-47fb-88ef-2f948b1ec19e" width="400" /> | Placeholder "Ver Simulación" |
| <img src="https://github.com/user-attachments/assets/9ea294b1-6af8-4561-99e5-c2fd62a1cfe1" width="400" /> | Parametrización financiera (editar versión) |
| <img src="https://github.com/user-attachments/assets/3a6a096d-ad90-4786-b5b3-cc30e420de22" width="400" /> | Activar versión e intercambio sin pérdida de datos |

</details>

<details>
<summary><strong>🧭 Navegación, UX y Header</strong></summary>
<br/>

| Captura | Descripción |
|:---:|---|
| <img src="https://github.com/user-attachments/assets/ba98ca71-177e-4813-b6fb-9539df892101" width="400" /> | Header institucional UPB |
| <img src="https://github.com/user-attachments/assets/06a76285-c0e0-4aed-85a0-79c295cb8702" width="400" /> | Hover en BackNavLink (AdminStudents) |
| <img src="https://github.com/user-attachments/assets/9ab6c103-0606-446f-8f8e-a02fc02570c6" width="400" /> | BackNavLink (AdminSimulations) |
| <img src="https://github.com/user-attachments/assets/c4d505da-c9a9-4bb6-b40d-2301e402c765" width="400" /> | BackNavLink (StudentHistory) |
| <img src="https://github.com/user-attachments/assets/e9914d71-4e2f-4f23-83c4-62ec645c22e2" width="400" /> | Hover detalle vista |
| <img src="https://github.com/user-attachments/assets/b058cd8c-798c-4d12-b0a4-2a6d95dcebac" width="400" /> | Hover completo |
| <img src="https://github.com/user-attachments/assets/da4709ea-50f9-48d1-9ece-b5db9612663e" width="200" /> | Logo UPB gris (estado normal) |
| <img src="https://github.com/user-attachments/assets/4c259a4d-8f1a-4d2b-876d-4ab65dafd702" width="200" /> | Logo UPB color (hover) + focus ring |

</details>

<details>
<summary><strong>🧪 Testing y Validación API</strong></summary>
<br/>

| Captura | Descripción |
|:---:|---|
| <img src="https://github.com/user-attachments/assets/0a9ca5d4-269d-4ab9-8978-e3919043b542" width="400" /> | Suite de tests backend |
| <img src="https://github.com/user-attachments/assets/3846c775-206c-41f4-92fe-7dc33336b3bc" width="400" /> | Tests pasando correctamente |
| <img src="https://github.com/user-attachments/assets/88a9018e-5856-41b6-871a-53387bfd3a00" width="400" /> | Validación de seguridad en API (400 + fieldErrors) |
| <img src="https://github.com/user-attachments/assets/2ec10233-01db-4165-981c-22a831bed785" width="400" /> | Test de respuesta de API |
| <img src="https://github.com/user-attachments/assets/3c69030b-2338-4f78-a495-ee1c2d021caa" width="400" /> | Validación de esquemas Zod |
| <img src="https://github.com/user-attachments/assets/46de51f4-2907-4fd4-90db-9a9817d82891" width="400" /> | Test de seguridad adicional |
| <img src="https://github.com/user-attachments/assets/54126681-13a4-4052-9ba0-46cd2532c5ba" width="400" /> | Test cobertura completa |
| <img src="https://github.com/user-attachments/assets/146a8a88-ec4e-4372-a137-e7f0fca19dbb" width="400" /> | Tests de componentes frontend |

</details>

---

## 🏛️ Referencia Rápida — Arquitectura

### Sistema General

```mermaid
graph TD
    A["👤 Usuario"] -->|HTTP| B["⚛️ React 19 + Vite :5173"]
    B -->|fetch /api/*| C["🟢 Express 5 :3000"]
    C -->|Sequelize SSL| D["🗄️ MySQL 8 (Aiven)"]
    C -->|SMTP| E["📧 Brevo"]
    C -->|LDAP| F["🔑 AD UPB"]

    style B fill:#61DAFB,stroke:#333,stroke-width:2px,color:#000
    style C fill:#339933,stroke:#333,stroke-width:2px,color:#fff
    style D fill:#4479A1,stroke:#333,stroke-width:2px,color:#fff
```

### Modelo de Datos Simplificado

```mermaid
erDiagram
    USER ||--o{ SIMULATION : "crea"
    SIMULATION ||--|{ AMORTIZATION_ROW : "contiene"
    SIMULATION ||--o{ EXPORT_LOG : "genera"
    PARAMETER_VERSION ||--|{ INTEREST_RATE : "define"
    PARAMETER_VERSION ||--|{ MODALITY_RULE : "define"
    AUDIT_LOG }o--|| USER : "registra"
```

> Para diagramas de arquitectura detallados, consulta el [README del servidor](../server/README.md).
> Para el mapa de rutas del frontend, consulta el [README del cliente](../client/README.md).

---

<div align="center">
  <sub>🔙 <a href="../README.md">Volver al README principal</a></sub>
</div>
