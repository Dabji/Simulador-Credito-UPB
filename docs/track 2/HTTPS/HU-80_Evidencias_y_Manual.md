## 📦 Pull Request

### 🔗 Related Issue / Issue Relacionada
Closes # <!-- HU-80 -->

---

### 📝 Description / Descripción

Cierre técnico del bloque de publicación de la landing del Track 2. Esta historia recopila las **evidencias** del despliegue, la configuración del servidor web y la habilitación de HTTPS/TLS, y entrega además un **manual técnico breve y accionable** que permite comprender, validar o repetir el montaje sin depender de explicaciones improvisadas del equipo.

Cubre la trazabilidad final de las HU previas:

- **HU-79** (configuración del servidor web Nginx)
- **HU-78** (despliegue de la landing publicada)
- **HU-70** (habilitación HTTPS/TLS con certificado autofirmado OpenSSL)

El entregable está organizado de forma consistente con la documentación general del proyecto y se acompaña de un manual `.docx` con pasos concretos y verificables, no narrativos.

---

### 🔄 Type of Change / Tipo de Cambio
- [ ] ✨ New feature / Nueva funcionalidad
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
- [ ] API / Integration
- [ ] CI/CD / Workflows <!-- Documentation / Web Server / Infrastructure / Security -->

---

### ✅ Checklist Before Review / Lista de Verificación Antes de Revisión
- [x] My code follows the project style guidelines / Mi código sigue las guías de estilo del proyecto
- [x] I have performed a self-review / He realizado una auto-revisión
- [ ] I have added/updated tests / He agregado/actualizado tests
- [x] All tests pass locally / Todos los tests pasan localmente <!-- nginx -t OK + curl 200 + cert válido -->
- [x] I have updated the documentation if needed / He actualizado la documentación si es necesario
- [x] No new warnings or errors are introduced / No se introducen nuevos warnings o errores

---

### 🖼️ Screenshots / Capturas de Pantalla
<!-- Adjuntar evidencias del estado final real:
1) Navegador cargando la landing en https://ruta7rios.page (o https://100.121.33.80 desde la red interna).
2) Salida de `sudo nginx -t` (syntax is ok / test is successful).
3) Salida de `systemctl status nginx --no-pager` (active running).
4) `sudo ss -tlnp | grep -E ':80|:443'` (puertos en escucha).
5) `ls -lah /var/www/ruta7rios` (build publicado).
6) `cat /etc/nginx/conf.d/cali.conf` (configuración aplicada).
7) `curl -kI https://ruta7rios.page/` (HTTP/2 200).
8) `curl -k https://ruta7rios.page/api/health` (status ok).
9) `curl -I http://ruta7rios.page/` (301 a HTTPS).
10) `openssl x509 -in /etc/nginx/ssl/ruta7rios.crt -noout -subject -issuer -dates -ext subjectAltName`.
11) Últimas líneas de `/var/log/nginx/access.log` y `/var/log/nginx/error.log`.
12) `pm2 list` mostrando el backend `cali-backend` online.
-->

---

### 📎 Additional Notes / Notas Adicionales

**Sprint:** Sprint 3 (UI & Reports / Interfaz & Reportes)
**Épica:** EP-22
**Prioridad:** Alta
**Backlog:** HU-80 (HU-80.01 – HU-80.03)
**Dependencias:** HU-78, HU-79, HU-70
**Relación:** HU-83 (consolidación documental del repositorio)
**Rol:** Student

---

**1. Entregable de la HU-80**

- `HU-80_Evidencias_y_Manual.md` (este PR) con resumen y trazabilidad.
- `Manual_Despliegue_Landing.docx` con el **manual técnico breve y accionable**.
- Conjunto de evidencias del estado final real del servidor y la publicación, generadas durante la ejecución del manual.

**2. Estado final real del entorno**

- **URL pública:** `https://ruta7rios.page` (DNS A → `100.121.33.80`).
- **Acceso interno por red privada Tailscale:** `https://100.121.33.80`.
- **Servidor web:** Nginx `1.26.3`, activo bajo `systemd`, master + 4 workers.
- **Build publicado:** `/var/www/ruta7rios/index.html` + `assets/`.
- **Backend:** `cali-backend` corriendo bajo PM2 en `127.0.0.1:3001`.
- **TLS:** certificado autofirmado emitido con OpenSSL en `/etc/nginx/ssl/ruta7rios.crt` (CN `ruta7rios.page`, SAN para `www.ruta7rios.page` e IP `100.121.33.80`, vigencia 10 años).
- **Redirección:** HTTP `:80` → HTTPS `:443` con `301`.
- **Proxy:** `/api` → `http://127.0.0.1:3001`.

**3. Estructura del manual entregado (`.docx`)**

El manual no replica la plantilla de PR. Está pensado como guía mínima ejecutable:

1. Objetivo y alcance
2. Arquitectura final desplegada
3. Requisitos previos
4. Estructura de archivos clave en la VM
5. Despliegue de la landing (paso a paso)
6. Configuración del servidor web Nginx (paso a paso)
7. Habilitación HTTPS/TLS con OpenSSL autofirmado (paso a paso)
8. Validación end-to-end (comandos exactos)
9. Operación diaria (start / stop / reload / logs)
10. Recuperación rápida ante fallos
11. Recolección de evidencias (script reproducible)
12. Checklist final del bloque de landing

Cada sección incluye **comandos concretos copiables**, no descripciones genéricas.

**4. Checklist final del bloque de landing**

| Ítem | Estado |
|---|---|
| Servidor web Nginx instalado y activo | ✅ |
| Site dedicado en `/etc/nginx/conf.d/cali.conf` | ✅ |
| Build de la landing publicado en `/var/www/ruta7rios` | ✅ |
| `nginx -t` sin errores | ✅ |
| `systemctl reload nginx` ejecutado y validado (sin downtime) | ✅ |
| Redirección HTTP → HTTPS (301) | ✅ |
| HTTPS con TLS 1.2/1.3 y certificado autofirmado válido | ✅ |
| `curl -kI https://ruta7rios.page/` → `HTTP/2 200` | ✅ |
| `curl -k https://ruta7rios.page/api/health` → `{"status":"ok"}` | ✅ |
| Logs `access.log` y `error.log` revisados, sin `[error]/[crit]` | ✅ |
| Backend `cali-backend` online en PM2 | ✅ |
| Manual técnico `.docx` entregado | ✅ |
| Evidencias finales recopiladas | ✅ |

**5. Cumplimiento de criterios HU-80**

| Criterio | Estado | Evidencia |
|---|---|---|
| 1. Evidencias suficientes del despliegue, configuración y verificación | ✅ | Capturas + manual + checklist técnico arriba |
| 2. Manual técnico breve, claro y útil | ✅ | `Manual_Despliegue_Landing.docx` con 12 secciones accionables |
| 3. Revisión final del entregable y checklist sin pendientes | ✅ | Checklist del bloque de landing aprobado |
| 4. (Opcional) Evidencias y manual organizados con la documentación general | ✅ | Estructura coherente con HU-78/79/70 y referenciable desde HU-83 |
