# Política de Seguridad

## Versiones Soportadas

| Versión | Soportada |
|---|---|
| rama `main` (última) | ✅ |
| ramas anteriores | ❌ |

## Reportar una Vulnerabilidad

Si descubres una vulnerabilidad de seguridad en este proyecto, te pedimos que la reportes de forma **responsable**.

### Proceso de Reporte

1. **NO** abras un issue público en GitHub para reportar vulnerabilidades de seguridad.
2. Envía un correo electrónico a: **simulador-credito-upb@upb.edu.co** (o contacta directamente a los mantenedores del repositorio).
3. Incluye en tu reporte:
   - Descripción detallada de la vulnerabilidad.
   - Pasos para reproducir el problema.
   - Impacto potencial de la vulnerabilidad.
   - (Opcional) Sugerencia de corrección o mitigación.

### Qué Esperar

- **Confirmación**: Recibirás una confirmación de recepción dentro de **48 horas hábiles**.
- **Evaluación**: El equipo evaluará la severidad y el impacto de la vulnerabilidad dentro de **5 días hábiles**.
- **Resolución**: Trabajaremos para resolver la vulnerabilidad lo antes posible y te mantendremos informado del progreso.
- **Reconocimiento**: Si lo deseas, te daremos crédito público por el descubrimiento una vez que se publique la corrección.

### Alcance

Esta política aplica a:

- Código fuente del repositorio (`client/` y `server/`).
- Configuraciones de infraestructura expuestas en el repositorio.
- Dependencias directas del proyecto.

### Buenas Prácticas de Seguridad del Proyecto

Este proyecto implementa las siguientes medidas de seguridad:

- **Helmet** — Headers HTTP de seguridad.
- **CORS** — Restricción de orígenes cruzados.
- **XSS Sanitization** — Sanitización de entrada contra inyección XSS.
- **Rate Limiting** — Limitación de peticiones por endpoint (`/api/auth`, `/api/simulator`).
- **JWT** — Autenticación stateless con tokens firmados.
- **bcrypt** — Hashing seguro de contraseñas (nunca se almacenan en texto plano).
- **Zod Validation** — Validación estricta de entrada en cliente y servidor.
- **Soft-delete** — Los datos de simulaciones no se eliminan permanentemente.
- **Audit Log** — Registro de auditoría de todas las acciones sensibles.

## Dependencias

Utilizamos [Dependabot](https://github.com/dependabot) para mantener las dependencias actualizadas y mitigar vulnerabilidades conocidas. La configuración se encuentra en [`.github/dependabot.yml`](./.github/dependabot.yml).

---

Gracias por ayudarnos a mantener este proyecto seguro.
