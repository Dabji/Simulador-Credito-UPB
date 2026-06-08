## 📦 Pull Request

### 🔗 Related Issue / Issue Relacionada
Closes # <!-- HU-78 -->

---

### 📝 Description / Descripción

Despliegue de la landing page del Track 2 en el servidor objetivo (VM del laboratorio), dejando una versión publicada, navegable y verificable. Se prepara el build estático del frontend, se publica en el servidor web (Nginx) y se valida que el sitio cargue correctamente desde una URL accesible.

Esta historia cubre únicamente la publicación funcional de la landing. La capa de TLS/HTTPS corresponde a la HU-70 y no se incluye en el alcance aquí.

---

### 🔄 Type of Change / Tipo de Cambio
- [x] ✨ New feature / Nueva funcionalidad
- [ ] 🐛 Bug fix / Corrección de error
- [ ] ♻️ Refactor / Refactorización
- [x] 📝 Documentation / Documentación
- [ ] 🧪 Tests
- [x] 🔧 Configuration / Configuración

---

### 🧩 Affected Components / Componentes Afectados
- [ ] Backend (Node.js)
- [x] Frontend (React)
- [ ] Database (MySQL)
- [x] API / Integration
- [ ] CI/CD / Workflows <!-- Web Server / Infrastructure / Deployment -->

---

### ✅ Checklist Before Review / Lista de Verificación Antes de Revisión
- [x] My code follows the project style guidelines / Mi código sigue las guías de estilo del proyecto
- [x] I have performed a self-review / He realizado una auto-revisión
- [ ] I have added/updated tests / He agregado/actualizado tests
- [x] All tests pass locally / Todos los tests pasan localmente <!-- nginx -t OK + curl 200 -->
- [x] I have updated the documentation if needed / He actualizado la documentación si es necesario
- [x] No new warnings or errors are introduced / No se introducen nuevos warnings o errores

---

### 🖼️ Screenshots / Capturas de Pantalla
<!-- Adjuntar evidencias: navegador cargando la landing, salida de curl -I con HTTP/2 200, listado del directorio publicado, salida de nginx -t -->

---

### 📎 Additional Notes / Notas Adicionales

**Sprint:** Sprint 3 (UI & Reports / Interfaz & Reportes)
**Épica:** EP-22
**Prioridad:** Alta
**Backlog:** HU-78 (HU-78.01 – HU-78.03)
**Dependencias:** HU-76, HU-79
**Orden sugerido:** HU-79 → HU-78 → HU-70 → HU-80

---

**1. Preparación del build / artefacto final**

- Proyecto: monorepo `Cali` (frontend React + Vite, backend Node/Express).
- Build de producción del frontend generado con Vite a partir de la versión aprobada del proyecto.
- Artefacto resultante: contenido estático listo para servir (HTML/CSS/JS/assets).
- Origen del build en la VM:
  - `/home/sistema_upb/Cali/frontend/dist`

**2. Publicación en el servidor objetivo**

- Servidor objetivo: VM del laboratorio.
- Servidor web: **Nginx**, ya configurado y operando.
- Directorio público de la landing publicada:
  - `/var/www/ruta7rios`
- Configuración del sitio: `/etc/nginx/conf.d/cali.conf`
  - `server_name`: `ruta7rios.page` y `www.ruta7rios.page`.
  - `root /var/www/ruta7rios;`
  - `index index.html;`
  - Soporte SPA: `try_files $uri $uri/ /index.html;`
  - Proxy API: `location /api { proxy_pass http://127.0.0.1:3001; }`
- Recarga del servidor:
  - `sudo nginx -t`
  - `sudo systemctl reload nginx`

**3. URL accesible**

- URL principal: `https://ruta7rios.page`
- URL alterna: `https://www.ruta7rios.page`
- Acceso interno por IP de la red privada Tailscale: `https://100.121.33.80`

**4. Validación del despliegue (funcionamiento básico)**

- `sudo nginx -t` → sintaxis OK.
- `sudo systemctl reload nginx` → recarga sin errores.
- `curl -kI --resolve ruta7rios.page:443:127.0.0.1 https://ruta7rios.page/` → `HTTP/2 200`, `content-type: text/html`.
- `curl -k --resolve ruta7rios.page:443:127.0.0.1 https://ruta7rios.page/api/health` → `{"status":"ok",...}` (verifica que la integración con backend a través del proxy `/api` está operativa desde la landing publicada).
- Navegación desde cliente: la landing carga correctamente, las rutas SPA responden gracias a `try_files`, y los assets estáticos se sirven desde `/var/www/ruta7rios`.

**5. Coherencia con la versión aprobada**

- El contenido publicado corresponde al build oficial del proyecto, generado a partir del código aprobado en `Cali/frontend`.
- El nombre de dominio publicado (`ruta7rios.page`) coincide con el `server_name` configurado en Nginx y con los registros DNS del proyecto.

**6. Evidencias del despliegue**

- Salida de `nginx -t` con `syntax is ok` / `test is successful`.
- Encabezados HTTP del sitio publicado (`HTTP/2 200`, `server: nginx`).
- Listado del directorio `/var/www/ruta7rios` con el `index.html` y los assets del build.
- Captura del navegador mostrando la landing servida desde la URL.

---

**Cumplimiento de criterios HU-78**

| Criterio | Estado | Evidencia |
|---|---|---|
| 1. Build / artefacto final preparado | ✅ | Build de Vite en `/home/sistema_upb/Cali/frontend/dist` publicado en `/var/www/ruta7rios` |
| 2. Landing publicada y cargando desde URL accesible | ✅ | `https://ruta7rios.page` responde `HTTP/2 200` con la landing |
| 3. Evidencia del despliegue y funcionamiento básico | ✅ | `nginx -t` OK, `curl -I` 200, `/api/health` respondiendo, navegación desde cliente verificada |

**Notas**

- La habilitación TLS/HTTPS se documenta en HU-70; aquí solo se referencia su existencia para mostrar que la landing está accesible.
- Las advertencias propias del entorno de laboratorio (certificado autofirmado, HSTS preload del TLD `.page`) están cubiertas en la HU-70 y no forman parte del alcance de esta HU.
