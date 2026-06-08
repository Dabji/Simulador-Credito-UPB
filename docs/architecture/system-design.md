<div align="center">

# Diseno del Sistema / System Design

**Simulador de Credito UPB**

Documentacion tecnica de arquitectura, componentes, flujos y modelo de datos del sistema.

</div>

---

## Indice

1. [Vista de contexto](#1-vista-de-contexto)
2. [Componentes de aplicacion](#2-componentes-de-aplicacion)
3. [Cliente React](#3-cliente-react)
4. [Servidor de aplicacion](#4-servidor-de-aplicacion)
5. [Flujos principales](#5-flujos-principales)
6. [Seguridad](#6-seguridad)
7. [Modelo de datos](#7-modelo-de-datos)
8. [Despliegue](#8-despliegue)

---

## 1. Vista de contexto

<div align="center">
  <img src="./assets/diagrams/system-context.png" alt="Vista de contexto del Simulador de Credito UPB" width="940" />
  <br />
  <em>Usuarios, SPA React, API Node.js, base de datos, LDAP y SMTP.</em>
</div>

### Responsabilidades por capa

| Capa | Componentes | Responsabilidad |
|---|---|---|
| Presentacion | React 19, Vite 8, TypeScript, Tailwind | Captura de datos, rutas por rol, formularios, resultados, historial y administracion. |
| Aplicacion | Express 5, use cases, servicios, DTO | Exponer API REST, validar entradas, ejecutar reglas y responder en JSON/PDF/CSV. |
| Dominio | `SimulationEngine`, estrategias financieras | Calcular cuotas, intereses, amortizacion y resumen financiero. |
| Datos | MySQL 8 Aiven, MariaDB/MySQL CTIC, Sequelize | Persistir usuarios, simulaciones, parametros, auditoria y exportaciones. |
| Integracion | LDAP/AD, SMTP/Brevo o servicio institucional | Autenticar administradores y enviar correos transaccionales. |

---

## 2. Componentes de aplicacion

<div align="center">
  <img src="./assets/diagrams/component-diagram.png" alt="Diagrama de componentes del backend y sus integraciones" width="940" />
  <br />
  <em>Componentes internos del backend, servicios de dominio, repositorios e integraciones externas.</em>
</div>

### Componentes clave

| Componente | Proposito |
|---|---|
| `BackendAPI` | Punto de entrada HTTP; agrupa rutas, middlewares y controladores. |
| `SecurityMiddleware` | Helmet, CORS, rate limit, autenticacion y autorizacion por rol. |
| `ValidationMiddleware` | Validacion de payloads con esquemas y reglas de negocio. |
| `ApplicationUseCases` | Orquestacion de autenticacion, simulacion, perfil, administracion y exportaciones. |
| `SimulationEngine` | Motor financiero con estrategias intercambiables. |
| `SequelizeRepositories` | Acceso relacional a usuarios, simulaciones, parametros y auditoria. |
| `EmailService` | Correos transaccionales y recuperacion de contrasena. |
| `LdapAuthService` | Autenticacion institucional de administradores. |

---

## 3. Cliente React

<div align="center">
  <img src="./assets/diagrams/react-web-client.png" alt="Diagrama del cliente React" width="940" />
  <br />
  <em>Rutas, proveedores, paginas y DTO usados por la SPA.</em>
</div>

### Flujos de interfaz

| Flujo | Pantallas / componentes |
|---|---|
| Invitado | Landing, acceso invitado, formulario de simulacion y resultados sin guardado. |
| Estudiante | Login, panel principal, simulacion, historial, detalle, exportacion y perfil. |
| Administrador | Login administrativo, estudiantes, parametros financieros y simulaciones. |
| Compartido | `AuthProvider`, `ProtectedRoute`, `PublicRoute`, `ApiService`, validaciones y componentes UI. |

---

## 4. Servidor de aplicacion

<div align="center">
  <img src="./assets/diagrams/application-server.png" alt="Diagrama del servidor de aplicacion" width="940" />
  <br />
  <em>Casos de uso, repositorios, servicios de aplicacion y entidades principales.</em>
</div>

### Capas backend

| Capa | Ejemplos | Regla |
|---|---|---|
| `Core` | Entidades, interfaces de repositorio, errores | No depende de frameworks. |
| `Application` | Casos de uso, servicios, DTO, estrategias | Coordina reglas de negocio. |
| `Infrastructure` | Express, Sequelize, JWT, LDAP, SMTP, Swagger | Implementa detalles tecnicos. |

---

## 5. Flujos principales

### Simulacion de credito

1. El usuario completa el formulario en la SPA.
2. El cliente valida estructura basica y envia `POST /api/simulator/preview`.
3. El backend aplica seguridad, sanitizacion y validacion.
4. El caso de uso consulta la version activa de parametros.
5. `SimulationService` valida reglas de negocio.
6. `SimulationEngine` selecciona estrategia financiera.
7. La API devuelve resumen, tabla de amortizacion y datos para graficas.
8. Si el usuario autenticado decide guardar, se persiste la simulacion y sus filas.

### Exportacion

1. El usuario solicita PDF o CSV desde historial o detalle.
2. La API valida propiedad de la simulacion o permiso administrador.
3. El backend consulta simulacion, filas y parametros.
4. El builder genera el archivo.
5. Se registra `export_logs` para auditoria.

### Administracion de parametros

1. El administrador consulta versiones financieras.
2. Modifica reglas de cuota inicial, tasas o configuracion por nivel.
3. La API valida consistencia temporal y numerica.
4. La nueva configuracion queda disponible para simulaciones posteriores.

---

## 6. Seguridad

| Control | Aplicacion |
|---|---|
| Autenticacion local | bcrypt + JWT para usuarios internos. |
| Autenticacion institucional | LDAP/Active Directory para administradores cuando aplique. |
| Autorizacion | Guards por rol `STUDENT` y `ADMIN`. |
| Seguridad HTTP | Helmet, CORS y rate limiting. |
| Sanitizacion | Limpieza de entradas para reducir riesgo XSS. |
| Secretos | `.env` y `ctic-rhel10.deploy.env` fuera de Git; solo plantillas versionadas. |
| Auditoria | `audit_logs` y `export_logs` para operaciones relevantes. |

---

## 7. Modelo de datos

<div align="center">
  <img src="../database/relational-model.png" alt="Modelo relacional del Simulador de Credito UPB" width="940" />
  <br />
  <em>Modelo relacional final usado por la aplicacion.</em>
</div>

Tablas principales:

- `users`
- `simulations`
- `amortization_rows`
- `parameter_versions`
- `level_configs`
- `level_rate_rules`
- `initial_payment_rules`
- `audit_logs`
- `export_logs`
- `password_reset_tokens`

---

## 8. Despliegue

### CTIC

<div align="center">
  <img src="../deployment/assets/ctic-deployment.png" alt="Diagrama de despliegue CTIC" width="940" />
</div>

### Preproduccion

<div align="center">
  <img src="../deployment/assets/preprod-deployment.png" alt="Diagrama de preproduccion" width="940" />
</div>

Puertos relevantes:

| Servicio | Puerto |
|---|---:|
| HTTP | `80` |
| HTTPS | `443` |
| Backend Express local | `3000` |
| MariaDB/MySQL | `3306` |
| LDAP | `389` |
| SMTP | `587` |
