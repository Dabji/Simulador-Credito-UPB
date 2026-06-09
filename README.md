<div align="center">

  <img src="./client/src/assets/images/logo-upb-color.png" alt="Logo UPB" width="150" />

  # 🎓 Simulador de Crédito UPB

  **Plataforma integral de simulación de crédito educativo para la Universidad Pontificia Bolivariana**

  [🌐 Producción](https://simuladorfinanciaciondirecta.bucaramanga.upb.edu.co/) ·
  [📚 Documentación](./docs/README.md) ·
  [🎓 LEARN.md](./LEARN.md) ·
  [🚀 Manual CTIC](./docs/deployment/Manual%20de%20Despliegue%20Simulador%20-%20CTIC.pdf)

  [![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
  [![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev/)
  [![Node.js](https://img.shields.io/badge/Node.js-Express_5.2-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![MySQL/MariaDB](https://img.shields.io/badge/MySQL%2FMariaDB-Aiven%20%2B%20CTIC-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](./LICENSE)

</div>

---

## 🌎 Idioma / Language

[🇪🇸 Español](#-español) | [🇺🇸 English](#-english)

---

## 🇪🇸 Español

### 📖 Acerca del proyecto

El **Simulador de Crédito UPB** es una plataforma web institucional para modelar, calcular y gestionar planes de financiación educativa. Fue desarrollada para la Universidad Pontificia Bolivariana Seccional Bucaramanga y actualmente cuenta con una versión publicada en producción:

<div align="center">

### 🌐 [simuladorfinanciaciondirecta.bucaramanga.upb.edu.co](https://simuladorfinanciaciondirecta.bucaramanga.upb.edu.co/)

</div>

El sistema permite que invitados, estudiantes y administradores trabajen con escenarios de crédito académico, tablas de amortización, historial de simulaciones, exportaciones PDF/CSV y parametrización financiera.

- 🏗️ **Clean Architecture**: separación entre `Core`, `Application` e `Infrastructure`.
- 🧮 **Motor financiero con Strategy Pattern**: amortización francesa y modalidad sin interés.
- 🔐 **Autenticación dual**: login local con bcrypt/JWT e integración LDAP/Active Directory para administración institucional.
- 📧 **Notificaciones transaccionales**: recuperación de contraseña por SMTP.
- 📄 **Exportaciones PDF/CSV**: generación de documentos para revisión y trazabilidad.
- 🗃️ **Persistencia relacional**: MySQL 8/Aiven y MariaDB/MySQL para CTIC.
- 🚀 **Despliegue institucional**: Nginx, PM2, RHEL y documentación operativa para CTIC.

### 🎯 Valor educativo

Este repositorio está preparado para **GitHub Education Community Exchange / Learn & Collaborate**. Puede usarse como caso de estudio para aprender arquitectura de software, frontend moderno, backend TypeScript, validación con Zod, modelado relacional, seguridad, pruebas y despliegue institucional.

**Descripción sugerida para GitHub:**
`Educational credit simulator for UPB Bucaramanga. React, Node.js, TypeScript, Clean Architecture, Strategy Pattern, MySQL/MariaDB, Nginx and PM2 deployment.`

**Topics sugeridos:**
`react`, `vite`, `typescript`, `nodejs`, `express`, `clean-architecture`, `strategy-pattern`, `mysql`, `mariadb`, `sequelize`, `zod`, `education`, `upb`, `github-education`

### 🖼️ Galería de la aplicación

Las capturas documentan el comportamiento funcional del simulador. La URL oficial de producción debe usarse para generar nuevas capturas finales cuando se publique la ficha en GitHub Education.

<details open>
<summary><strong>🔐 Login y autenticación</strong></summary>
<br/>

| Login | Redirección por rol |
|:---:|:---:|
| <img src="https://github.com/user-attachments/assets/04bcc531-9b30-4972-8e3d-d7b0516c62b0" width="480" alt="Formulario de login" /> | <img src="https://github.com/user-attachments/assets/6c4075d5-c690-4eeb-bc1f-db442783a1cb" width="480" alt="Redirección de estudiante" /> |
| **Formulario de acceso** | **Redirección `STUDENT` hacia `/student/main`** |
| <img src="https://github.com/user-attachments/assets/588f6061-851a-49c7-8810-a89d59298b7d" width="480" alt="Validación de contraseña" /> | <img src="https://github.com/user-attachments/assets/9a76d731-de3f-4eef-a8eb-7762d41098a8" width="480" alt="Errores por campo" /> |
| **Validación visual de contraseña** | **Retroalimentación de errores por campo** |

</details>

<details>
<summary><strong>👤 Modo invitado</strong></summary>
<br/>

| Inicio invitado | Formulario de simulación |
|:---:|:---:|
| <img src="https://github.com/user-attachments/assets/40ea854a-02b2-49a7-a7d3-8bfe328df40d" width="480" alt="Página principal modo invitado" /> | <img src="https://github.com/user-attachments/assets/91d1ff52-9c86-4b1a-a116-4343927465dd" width="480" alt="Formulario de simulación invitado" /> |
| **Página principal modo invitado** | **Formulario de simulación sin registro** |
| <img src="https://github.com/user-attachments/assets/edea8693-cd6e-41ba-a666-87985c495062" width="480" alt="CTA crear simulación" /> | <img src="https://github.com/user-attachments/assets/5719bb52-769d-4914-9427-23cc3a43e3be" width="480" alt="Resultados invitado" /> |
| **CTA “Crear nueva simulación”** | **Resultados sin opción de guardado** |

</details>

<details>
<summary><strong>🧮 Simulación y resultados</strong></summary>
<br/>

| Datos y resumen | Gráficas y amortización |
|:---:|:---:|
| <img src="https://github.com/user-attachments/assets/64bba96f-5df4-4293-8692-57492f1b90c6" width="480" alt="Encabezado y datos del estudiante" /> | <img src="https://github.com/user-attachments/assets/6bf44496-fcfd-42cb-bb0b-acac2e783e5d" width="480" alt="Resumen financiero y gráficas" /> |
| **Encabezado y datos del estudiante** | **Resumen financiero y visualización** |
| <img src="https://github.com/user-attachments/assets/b02a766e-339d-4e1c-a93d-ec85d980316a" width="480" alt="Gráfica de distribución" /> | <img src="https://github.com/user-attachments/assets/afdd6c3d-5321-473d-8fa5-5cb752782188" width="480" alt="Tabla de amortización" /> |
| **Distribución de valores** | **Tabla de amortización y exportación** |

</details>

<details>
<summary><strong>🛡️ Panel de administración</strong></summary>
<br/>

| Panel principal | Gestión de simulaciones |
|:---:|:---:|
| <img src="https://github.com/user-attachments/assets/af791a4e-e106-496d-92ab-96a3a662cfa7" width="480" alt="Panel principal de administración" /> | <img src="https://github.com/user-attachments/assets/33009ce6-3ed8-4f3e-bcc0-4705b0f28d71" width="480" alt="Gestión de simulaciones" /> |
| **Panel principal Admin** | **Simulaciones con tabla y paginación** |
| <img src="https://github.com/user-attachments/assets/9ea294b1-6af8-4561-99e5-c2fd62a1cfe1" width="480" alt="Parametrización financiera" /> | <img src="https://github.com/user-attachments/assets/3a6a096d-ad90-4786-b5b3-cc30e420de22" width="480" alt="Cambio de versión activa" /> |
| **Parametrización financiera** | **Activación de versiones** |

</details>

<details>
<summary><strong>📄 Exportación, correo y pruebas</strong></summary>
<br/>

| PDF | Correo |
|:---:|:---:|
| <img src="https://github.com/user-attachments/assets/90c3fdc3-0f0c-44f8-b2cf-0ad376ee79b8" width="480" alt="Documento PDF generado" /> | <img src="https://github.com/user-attachments/assets/291ae998-3e77-4bb5-8c45-c5b7803b8912" width="480" alt="Correo de recuperación de contraseña" /> |
| **Documento PDF generado** | **Correo HTML responsive** |
| <img src="https://github.com/user-attachments/assets/0a9ca5d4-269d-4ab9-8978-e3919043b542" width="480" alt="Suite de pruebas backend" /> | <img src="https://github.com/user-attachments/assets/88a9018e-5856-41b6-871a-53387bfd3a00" width="480" alt="Validación de API" /> |
| **Suite de pruebas backend** | **Validación de seguridad en API** |

</details>

### 🏛️ Arquitectura visual

<div align="center">
  <img src="./docs/architecture/assets/diagrams/system-context.png" alt="Vista de contexto del sistema" width="900" />
  <br />
  <em>Vista de contexto: SPA React, API Node.js/Express, base de datos, LDAP y SMTP.</em>
</div>

<br />

<div align="center">
  <img src="./docs/architecture/assets/diagrams/component-diagram.png" alt="Diagrama de componentes del sistema" width="900" />
  <br />
  <em>Componentes principales del backend, servicios de dominio, repositorios e integraciones.</em>
</div>

### 📚 Documentación principal

| Entregable | Enlace |
|---|---|
| 📘 Manual de usuario | [docs/manuals/Manual_Usuario_Simulador_Credito_UPB.pdf](./docs/manuals/Manual_Usuario_Simulador_Credito_UPB.pdf) |
| 🛠️ Manual técnico | [docs/manuals/Manual de Técnico Simulador.pdf](./docs/manuals/Manual%20de%20T%C3%A9cnico%20Simulador.pdf) |
| 🚀 Manual de despliegue CTIC | [docs/deployment/Manual de Despliegue Simulador - CTIC.pdf](./docs/deployment/Manual%20de%20Despliegue%20Simulador%20-%20CTIC.pdf) |
| 🎓 Artículo IEEE | [docs/academic/Articulo IEEE Simulador de Credito UPB.pdf](./docs/academic/Articulo%20IEEE%20Simulador%20de%20Credito%20UPB.pdf) |
| 🧭 Guía educativa | [LEARN.md](./LEARN.md) |
| 🗂️ Índice documental | [docs/README.md](./docs/README.md) |

### 🧰 Stack tecnológico

| Capa | Tecnologías |
|---|---|
| ⚛️ Frontend | React 19, Vite 8, TypeScript 6, Tailwind CSS, React Router, React Hook Form, Zod |
| 🟢 Backend | Node.js, Express 5.2, TypeScript 6, JWT, bcrypt, LDAP, Nodemailer |
| 🧮 Dominio | `SimulationEngine`, Strategy Pattern, amortización francesa, modalidad sin interés |
| 🗄️ Datos | MySQL 8/Aiven, MariaDB/MySQL CTIC, Sequelize, scripts SQL versionados |
| 🚀 Operación | Nginx, PM2, systemd, RHEL, GitHub Actions para preproducción |
| 🧪 Calidad | Jest, Supertest, Vitest, evidencias funcionales/manuales e integración |

### 🚀 Inicio rápido

```bash
npm install
npm run dev
```

| Servicio | URL |
|---|---|
| Frontend | `http://localhost:5173` |
| API | `http://localhost:3000/api` |
| Swagger | `http://localhost:3000/api/docs` |
| Health check | `http://localhost:3000/api/health` |

### 🧪 Pruebas

```bash
npm run test --workspace=server
npm run test --workspace=client
```

### 🚀 Despliegue CTIC

El despliegue institucional está documentado para una VM RHEL administrada por CTIC:

- Nginx publica la SPA y enruta `/api` al backend.
- PM2 mantiene vivo el proceso Node.js en `localhost:3000`.
- MariaDB/MySQL opera en el puerto `3306`.
- LDAP usa `389` y SMTP usa `587`.
- HTTP `80` y HTTPS `443` son los puertos públicos esperados.

Ver [docs/deployment/README.md](./docs/deployment/README.md).

---

## 🇺🇸 English

### 📖 Overview

**Simulador de Crédito UPB** is an institutional web application for educational credit simulation at Universidad Pontificia Bolivariana Bucaramanga. It supports guest, student and administrator workflows for financial scenarios, amortization tables, saved history, exports and financial parameter management.

The project is ready to be shared as a **GitHub Education Community Exchange / Learn & Collaborate** case study. It includes source code, MIT license, technical documentation, deployment manuals, an IEEE-style academic article and a dedicated learning guide.

### 🎓 What students can learn

- Clean Architecture in a TypeScript/Express backend.
- React SPA design with role-based routing.
- Zod validation in client and server flows.
- Strategy Pattern applied to a real financial simulation engine.
- MySQL/MariaDB modeling with Sequelize repositories.
- Deployment on RHEL using Nginx, PM2 and environment-based configuration.
- Technical writing for institutional software handoff.

### 📌 Main resources

| Resource | Link |
|---|---|
| 🌐 Production site | [Official UPB deployment](https://simuladorfinanciaciondirecta.bucaramanga.upb.edu.co/) |
| 🎓 Learning guide | [LEARN.md](./LEARN.md) |
| 📚 Documentation index | [docs/README.md](./docs/README.md) |
| 🚀 CTIC deployment manual | [Manual de Despliegue Simulador - CTIC.pdf](./docs/deployment/Manual%20de%20Despliegue%20Simulador%20-%20CTIC.pdf) |
| 📄 IEEE paper | [Articulo IEEE Simulador de Credito UPB.pdf](./docs/academic/Articulo%20IEEE%20Simulador%20de%20Credito%20UPB.pdf) |

### 🗂️ Repository map

```text
client/                 React 19 + Vite 8 + TypeScript frontend
server/                 Node.js + Express 5 backend
docs/                   Technical, academic, deployment and user documentation
infrastructure/nginx/   Nginx configuration templates
.github/                Pull request and automation files
```

### ✅ Open Source readiness

- `README.md` with bilingual project presentation.
- `LEARN.md` for GitHub Education.
- `LICENSE` with MIT terms.
- `CONTRIBUTING.md` for contribution rules.
- `SECURITY.md` for responsible disclosure.
- `CODE_OF_CONDUCT.md` for community participation.

## 🤝 Colaboradores / Contributors

Colaboradores identificados a partir del historial de Git y la autoría del artículo IEEE. Las cuentas automatizadas se excluyen de esta tabla.

| Colaborador | Rol / contribución | Evidencia |
|---|---|---|
| <img src="https://github.com/Dabji.png?size=80" alt="Dabji avatar" width="42" /> Juan David Ordoñez Ferreira | Desarrollo full-stack, documentación y soporte de despliegue | Git + artículo IEEE |
| <a href="https://github.com/josemora090525"><img src="https://avatars.githubusercontent.com/u/196080635?v=4" alt="José David Mora Patiño avatar" width="42" /></a> José David Mora Patiño | Desarrollo full-stack y artefactos de despliegue | Git + artículo IEEE |
| <img src="https://github.com/Richard117297.png?size=80" alt="Richard117297 avatar" width="42" /> David Ricardo Carvajal Barragán | Desarrollo full-stack y evidencias de pruebas | Git + artículo IEEE |
| <img src="https://github.com/davideduardoflorez10-beep.png?size=80" alt="davideduardoflorez10-beep avatar" width="42" /> David Eduardo Flórez Durán | Desarrollo full-stack y artefactos de proyecto | Git + artículo IEEE |
| <img src="https://github.com/GabrielSastoque.png?size=80" alt="GabrielSastoque avatar" width="42" /> Gabriel Arturo Sastoque Cadena | Desarrollo, soporte académico y documentación | Git + artículo IEEE |
| <img src="https://github.com/juanpa-arenas-upb.png?size=80" alt="juanpa-arenas-upb avatar" width="42" /> Juan Pablo Arenas Avendaño | Contribución académica y técnica | Git + artículo IEEE |
| <img src="https://github.com/SimonP0607.png?size=80" alt="SimonP0607 avatar" width="42" /> Simón Pérez Gómez | Contribución académica y técnica | Git + artículo IEEE |
| <a href="https://github.com/StonksUp"><img src="https://avatars.githubusercontent.com/u/184121459?v=4" alt="Matías avatar" width="42" /></a> Matías (StonksUp) | Contribución académica y técnica | GitHub / equipo del proyecto |
| Gabriel Miguel Rodríguez Castro | Contribución académica y técnica | Git + artículo IEEE |
| S. Cifuentes Cárdenas | Acompañamiento académico y autoría documental | Artículo IEEE |

## 📄 Licencia

Este proyecto está distribuido bajo la [Licencia MIT](./LICENSE).

<div align="center">
  <sub>Proyecto Integrador · Ingeniería de Sistemas e Informática · Universidad Pontificia Bolivariana Seccional Bucaramanga</sub>
</div>
