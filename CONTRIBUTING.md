# Guía de Contribución

¡Gracias por tu interés en contribuir al **Simulador de Crédito UPB**! Este documento describe las convenciones y el proceso para contribuir al proyecto.

## Prerrequisitos

- **Node.js** ≥ 18
- **npm** ≥ 9
- Familiaridad con **TypeScript**, **React** y **Express**

## Configuración del Entorno

```bash
# 1. Fork y clona el repositorio
git clone https://github.com/TU-USUARIO/simulador-credito-upb.git
cd simulador-credito-upb

# 2. Instala dependencias (monorepo)
npm install

# 3. Configura variables de entorno
cp .env.example .env
# Edita .env con tus credenciales locales

# 4. Inicia en modo desarrollo
npm run dev
```

## Flujo de Trabajo

1. Crea una rama desde `main`:
   ```bash
   git checkout -b feature/hu-XX-descripcion-corta
   ```
2. Realiza tus cambios siguiendo las convenciones del proyecto.
3. Ejecuta los tests:
   ```bash
   npm run test --workspace=server
   npm run test --workspace=client
   ```
4. Haz commit siguiendo [Conventional Commits](#convención-de-commits).
5. Abre un Pull Request usando la [plantilla de PR](./.github/PULL_REQUEST_TEMPLATE.md).

## Convención de Commits

Utilizamos [Conventional Commits](https://www.conventionalcommits.org/es/):

```
<tipo>(alcance opcional): descripción corta

[cuerpo opcional]

[pie(s) opcional(es)]
```

### Tipos permitidos

| Tipo | Descripción |
|---|---|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de bug |
| `docs` | Cambios en documentación |
| `style` | Formato (sin cambio de lógica) |
| `refactor` | Refactorización de código |
| `test` | Agregar o corregir tests |
| `chore` | Tareas de mantenimiento |
| `perf` | Mejora de rendimiento |
| `ci` | Cambios en CI/CD |

### Ejemplos

```
feat(simulator): agregar exportación CSV de tabla de amortización
fix(auth): corregir redirección después de reset de contraseña
docs(readme): actualizar guía de inicio rápido
test(engine): agregar caso de prueba para modalidad sin interés
```

## Convenciones de Código

### General

- **Idioma del código**: Inglés para nombres de variables, funciones y clases.
- **Idioma de comentarios**: Español (el proyecto es institucional UPB).
- **Nombres de archivos**: `kebab-case` para archivos y carpetas.
- **TypeScript**: Tipado estricto, sin `any` salvo justificación.

### Frontend (`client/`)

- Componentes funcionales con hooks.
- Validación con **Zod** + **React Hook Form**.
- Estilos con **Tailwind CSS v4** (utility-first).
- Tests con **Vitest** + **Testing Library**.

### Backend (`server/`)

- **Clean Architecture**: respetar la separación de capas (`Core/` → `Application/` → `Infrastructure/`).
- DTOs validados con **Zod**.
- Tests con **Jest** + **Supertest**.
- Logging estructurado con **Winston**.

## Estructura de Ramas

| Rama | Propósito |
|---|---|
| `main` | Rama principal (producción) |
| `develop` | Integración de features |
| `feature/hu-XX-*` | Nuevas funcionalidades |
| `fix/hu-XX-*` | Corrección de bugs |
| `docs/*` | Cambios de documentación |

## Reporte de Bugs

Utiliza la [plantilla de issues](./.github/ISSUE_TEMPLATE/) para reportar bugs. Incluye:

- Descripción clara del problema.
- Pasos para reproducir.
- Comportamiento esperado vs. actual.
- Capturas de pantalla si aplica.

## Vulnerabilidades de Seguridad

**NO** reportes vulnerabilidades de seguridad como issues públicos. Consulta [SECURITY.md](./SECURITY.md) para el proceso correcto.

---

<div align="center">
  <sub>🔙 <a href="./README.md">Volver al README principal</a></sub>
</div>
