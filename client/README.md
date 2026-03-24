<div align="center">

# ⚛️ Client — Simulador de Crédito UPB

Frontend SPA construido con **React 19**, **Vite 7** y **TypeScript 5.9**

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vite.dev/)
[![Tailwind](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

</div>

---

## 📁 Estructura

```
client/src/
├── modules/                    # Feature modules (vertical slicing)
│   ├── auth/                   # Autenticación
│   │   ├── context/            # AuthContext (JWT + estado global)
│   │   └── pages/              # Login, Register, ForgotPassword, ResetPassword
│   ├── admin/                  # Panel de administración
│   │   └── pages/              # Dashboard, Students, Parameters, Simulations
│   ├── simulator/              # Simulador de crédito
│   │   └── pages/
│   │       ├── user/           # Flujo autenticado (Student)
│   │       └── guest/          # Flujo invitado (sin registro)
│   └── landing/                # Landing page pública
│
├── shared/                     # Código compartido entre módulos
│   ├── components/             # UI reutilizable
│   │   ├── SimulationForm.tsx  # Formulario principal (~47KB)
│   │   ├── SimulationResultsPreview.tsx
│   │   ├── SimulationCharts.tsx
│   │   ├── UpbHeader.tsx       # Header institucional
│   │   ├── UpbFooter.tsx       # Footer institucional
│   │   ├── ProtectedRoute.tsx  # Guard por rol (STUDENT/ADMIN)
│   │   ├── PublicRoute.tsx     # Redirect si ya autenticado
│   │   ├── BackNavLink.tsx     # Navegación "volver" con hover
│   │   └── ...
│   ├── services/               # API client (fetch wrapper)
│   └── utils/                  # Helpers y constantes
│
├── App.tsx                     # Router principal
├── main.tsx                    # Punto de entrada
└── index.css                   # Tailwind directives
```

---

## 🧭 Mapa de Rutas

```mermaid
graph TD
    ROOT["/ (Landing)"] --> LOGIN["/login"]
    ROOT --> REGISTER["/register"]
    ROOT --> FORGOT["/forgot-password"]
    ROOT --> GUEST_MAIN["/guest/main"]

    GUEST_MAIN --> GUEST_SIM["/guest/simulator/create"]

    LOGIN --> |STUDENT| STU_MAIN["/student/main"]
    LOGIN --> |ADMIN| ADM_MAIN["/admin/main"]

    STU_MAIN --> SIM_CREATE["/simulator/create"]
    STU_MAIN --> STU_HIST["/student/history"]
    STU_MAIN --> STU_PROF["/student/profile"]
    STU_HIST --> STU_DET["/student/history/:id"]
    STU_DET --> STU_EXP["/student/history/:id/export"]

    ADM_MAIN --> ADM_STU["/admin/students"]
    ADM_MAIN --> ADM_PAR["/admin/parameters"]
    ADM_MAIN --> ADM_SIM["/admin/simulations"]
    ADM_STU --> ADM_STU_DET["/admin/students/:id"]
    ADM_SIM --> ADM_SIM_DET["/admin/simulations/:id"]

    style ROOT fill:#f0f9ff,stroke:#3b82f6,color:#000
    style LOGIN fill:#fef3c7,stroke:#f59e0b,color:#000
    style GUEST_MAIN fill:#f0fdf4,stroke:#22c55e,color:#000
    style GUEST_SIM fill:#f0fdf4,stroke:#22c55e,color:#000
    style STU_MAIN fill:#ede9fe,stroke:#8b5cf6,color:#000
    style ADM_MAIN fill:#fee2e2,stroke:#ef4444,color:#000
```

> Las rutas `/student/*` y `/admin/*` están protegidas por `ProtectedRoute` con validación de rol JWT.
> Las rutas `/guest/*` y auth son públicas, redirigen al dashboard si ya hay sesión activa.

---

## 🛠️ Stack

| Librería | Versión | Uso |
|---|---|---|
| **React** | 19 | UI con componentes funcionales |
| **Vite** | 7 | Dev server + bundler con HMR |
| **TypeScript** | 5.9 | Tipado estático |
| **Tailwind CSS** | v4 | Estilos utility-first |
| **React Router** | 7 | Enrutamiento SPA |
| **React Hook Form** | 7 | Formularios con validación |
| **Zod** | 4 | Esquemas de validación |
| **Lucide React** | — | Iconos SVG |
| **Vitest** | 4 | Testing unitario |
| **Testing Library** | — | Testing de componentes React |

---

## 🚀 Desarrollo

```bash
# Desde la raíz del monorepo
npm run dev:client

# O directamente
cd client && npm run dev
```

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo (Vite HMR) → `:5173` |
| `npm run build` | Build de producción (`tsc -b && vite build`) |
| `npm run preview` | Preview del build de producción |
| `npm run lint` | ESLint sobre todo el proyecto |
| `npm run test` | Vitest (run once) |
| `npm run test:watch` | Vitest en modo watch |

---

## 🔐 Autenticación

El flujo de auth está gestionado por `AuthContext`:

```mermaid
sequenceDiagram
    participant U as Usuario
    participant F as Frontend
    participant A as API /auth

    U->>F: Ingresa credenciales
    F->>A: POST /api/auth/login
    A-->>F: { token, user }
    F->>F: Guarda JWT en memoria
    F->>F: Redirige según rol

    Note over F: STUDENT → /student/main
    Note over F: ADMIN → /admin/main

    U->>F: Navega a ruta protegida
    F->>F: ProtectedRoute verifica JWT + rol
    F-->>U: Acceso permitido o redirect a /login
```

---

<div align="center">
  <sub>🔙 <a href="../README.md">Volver al README principal</a></sub>
</div>
