# HU-52 — Matriz de Permisos de la API

> Documento de referencia para la autorización por roles en el backend del Simulador de Crédito UPB.

## Matriz Endpoint → Rol

| Método | Endpoint                     | Acceso          | Roles permitidos   |
| ------ | ---------------------------- | --------------- | ------------------ |
| POST   | `/api/auth/login`            | PÚBLICO         | —                  |
| POST   | `/api/auth/register`         | PÚBLICO         | —                  |
| POST   | `/api/auth/forgot-password`  | PÚBLICO         | —                  |
| POST   | `/api/auth/reset-password`   | PÚBLICO         | —                  |
| POST   | `/api/simulator/preview`     | PÚBLICO         | —                  |
| GET    | `/api/auth/me`               | PROTEGIDO       | STUDENT, ADMIN     |
| POST   | `/api/simulator/save`        | PROTEGIDO       | STUDENT, ADMIN     |
| GET    | `/api/simulator/history`     | PROTEGIDO       | STUDENT, ADMIN     |
| GET    | `/api/admin/stats`           | PROTEGIDO       | ADMIN              |
| GET    | `/api/admin/parameters`      | PROTEGIDO       | ADMIN              |
| PUT    | `/api/admin/parameters/:id`  | PROTEGIDO       | ADMIN              |

## Códigos de error de autorización

### 401 Unauthorized — No autenticado

Se retorna cuando:

- No se envía el header `Authorization: Bearer <token>`.
- El token JWT es inválido o ha expirado.
- El usuario asociado al token no existe en la base de datos.
- La cuenta del usuario está **desactivada** (`is_active = false`).

Indica que el servidor no puede verificar la identidad del solicitante.

### 403 Forbidden — Prohibido

Se retorna cuando:

- El usuario **está autenticado** correctamente, pero su rol no tiene permiso para acceder al recurso solicitado.
- Ejemplo: un usuario con rol `STUDENT` intenta acceder a `GET /api/admin/stats`.

Indica que la identidad es conocida pero los privilegios son insuficientes.

## Cadena de middlewares

```
Endpoints públicos  →  sin middleware de auth
Endpoints protegidos →  authGuard  →  [roleGuard(...roles)]  →  handler
```

- **`authGuard`**: Verifica el JWT y adjunta `req.user`.
- **`roleGuard(...roles)`**: Consulta el usuario en BD, verifica `is_active` y valida que el rol esté en la lista permitida.
