## 📦 Pull Request

### 🔗 Related Issue / Issue Relacionada
Closes # <!-- HU-79 -->

---

### 📝 Description / Descripción

Configuración técnica del **servidor web** que aloja la landing page del Track 2 sobre la VM del laboratorio. Esta historia (HU-79) deja la **base operativa** sobre la que luego se publica el contenido (HU-78) y se habilita la capa de seguridad TLS (HU-70).

Se utiliza **Nginx** como servidor web. Se define un *site* dedicado para `ruta7rios.page`, se establecen las rutas, parámetros mínimos de operación, comportamiento básico del servicio (start, reload, restart, logs) y se documentan los archivos y comandos clave para mantenimiento y recuperación.

La configuración se aplica de forma **trazable**: archivos versionables, copias de respaldo (`.bak`), validación con `nginx -t` antes de aplicar cambios y recargas en caliente con `systemctl reload nginx`. No se realizan montajes manuales sin respaldo documental.

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
- [ ] CI/CD / Workflows <!-- Web Server / Infrastructure / Security -->

---

### ✅ Checklist Before Review / Lista de Verificación Antes de Revisión
- [x] My code follows the project style guidelines / Mi código sigue las guías de estilo del proyecto
- [x] I have performed a self-review / He realizado una auto-revisión
- [ ] I have added/updated tests / He agregado/actualizado tests
- [x] All tests pass locally / Todos los tests pasan localmente <!-- nginx -t OK + reload + curl 200 -->
- [x] I have updated la documentación si es necesario
- [x] No new warnings or errors are introduced / No se introducen nuevos warnings o errores

---

### 🖼️ Screenshots / Capturas de Pantalla
<!-- Adjuntar evidencias:
1) Salida de `sudo nginx -t` con "syntax is ok / test is successful"
2) Salida de `systemctl status nginx --no-pager`
3) `sudo ss -tlnp | grep -E ':80|:443'`
4) Contenido de `/etc/nginx/conf.d/cali.conf`
5) `ls -lah /var/www/ruta7rios`
6) `curl -kI https://ruta7rios.page/` mostrando HTTP/2 200
7) `curl -I http://ruta7rios.page/` mostrando 301 a HTTPS
8) Últimas líneas de `/var/log/nginx/access.log` y `/var/log/nginx/error.log`
-->

---

### 📎 Additional Notes / Notas Adicionales

**Sprint:** Sprint 3 (UI & Reports / Interfaz & Reportes)
**Épica:** EP-22
**Prioridad:** Alta
**Backlog:** HU-79 (HU-79.01 – HU-79.03)
**Dependencias:** HU-62, HU-76
**Orden sugerido:** HU-79 → HU-78 → HU-70 → HU-80
**Rol:** Administrator

---

## 1. Servidor web elegido y justificación

- **Servidor web:** Nginx, versión `nginx/1.26.3`.
- **Sistema operativo:** Linux (kernel `6.12.0-x86_64`) sobre la VM del laboratorio.
- **Gestión del servicio:** `systemd` (`nginx.service`).
- **Topología de procesos:** 1 master + 4 workers.

Por qué Nginx:

- Servidor maduro y ligero, ideal para servir **contenido estático** (la landing es un build estático generado con Vite).
- Soporte directo para aplicaciones **SPA** (`try_files`), evitando 404 en rutas internas del frontend.
- Soporte nativo de **proxy inverso** hacia el backend Node.js que expone `/api`.
- Compatible con la habilitación posterior de **TLS** (HU-70) y con redirección `HTTP → HTTPS`.
- Bajo consumo de memoria/CPU, suficiente para el alcance de laboratorio.
- Configuración declarativa por archivos planos, fácil de versionar y respaldar.

---

## 2. Topología funcional

```
Cliente (navegador / curl)
        │
        ▼
[ Nginx :80 ]  ──► 301 HTTPS  ──► [ Nginx :443 (TLS HU-70) ]
                                             │
                          ┌──────────────────┴───────────────────┐
                          ▼                                      ▼
                 Estático SPA                          Proxy /api
              /var/www/ruta7rios                http://127.0.0.1:3001
              (HU-78: contenido)                (Backend Node.js / PM2)
```

La separación clara entre **estático** y **API** permite aislar fallos y mantener el servidor estable aunque el backend se reinicie.

---

## 3. Archivos clave de configuración

| Ruta | Función | Pertenece a |
|---|---|---|
| `/etc/nginx/nginx.conf` | Configuración global de Nginx (workers, eventos, includes) | HU-79 |
| `/etc/nginx/conf.d/cali.conf` | **Site dedicado** a `ruta7rios.page` (HTTP→HTTPS, root, SPA, proxy) | HU-79 |
| `/etc/nginx/conf.d/*.bak.*` | Backups automáticos del site antes de cambios | HU-79 |
| `/var/www/ruta7rios/` | Directorio público con el build de la landing | HU-78 |
| `/var/log/nginx/access.log` | Log de accesos | HU-79 |
| `/var/log/nginx/error.log` | Log de errores | HU-79 |
| `/etc/nginx/ssl/ruta7rios.crt` | Certificado TLS | HU-70 |
| `/etc/nginx/ssl/ruta7rios.key` | Llave privada TLS (permisos `600`) | HU-70 |
| `/etc/systemd/system/multi-user.target.wants/nginx.service` | Habilitación al arranque (systemd) | HU-79 |

Política de cambios:

1. Antes de modificar `cali.conf`, se crea un backup `cali.conf.bak.YYYYMMDDHHMMSS`.
2. Se edita el archivo, se valida con `nginx -t`.
3. Solo si pasa la validación se ejecuta `systemctl reload nginx`.

---

## 4. Configuración aplicada al *site*

Archivo: `/etc/nginx/conf.d/cali.conf`

```nginx
# Redireccion HTTP -> HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name ruta7rios.page www.ruta7rios.page;
    return 301 https://$host$request_uri;
}

# Servidor HTTPS principal
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    http2 on;
    server_name ruta7rios.page www.ruta7rios.page;

    ssl_certificate     /etc/nginx/ssl/ruta7rios.crt;   # HU-70
    ssl_certificate_key /etc/nginx/ssl/ruta7rios.key;   # HU-70
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    root /var/www/ruta7rios;   # HU-78
    index index.html;

    location /api {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Decisiones de configuración:

- **`server_name` explícito** con dominio principal y `www`, para evitar matches accidentales con otros sites.
- **Redirección 301** desde `:80` para forzar HTTPS y mantener SEO.
- **`http2 on`** para mejor rendimiento sobre TLS.
- **`try_files $uri $uri/ /index.html;`** para que las rutas internas del SPA (React Router) no devuelvan 404 al refrescar la página.
- **`proxy_pass http://127.0.0.1:3001`** mantiene el backend ligado a `localhost`, no expuesto directamente.
- **Headers de proxy** (`X-Real-IP`, `X-Forwarded-For`, `X-Forwarded-Proto`) para que el backend reciba la información real del cliente y del esquema HTTPS.

---

## 5. Parámetros mínimos de operación

| Parámetro | Valor |
|---|---|
| Versión Nginx | `1.26.3` |
| Puertos en escucha | `:80` y `:443` (IPv4 + IPv6) |
| Workers | 4 procesos hijo |
| Master process | activo bajo `systemd` |
| Usuario propietario del contenido | `nginx:nginx` en `/var/www/ruta7rios` |
| TLS habilitado | TLS 1.2 / TLS 1.3 (HU-70) |
| HTTP/2 | habilitado |
| Logging | `access.log` y `error.log` en `/var/log/nginx/` |
| Inicio automático | `nginx.service` enabled en systemd |

---

## 6. Comandos operativos clave

### 6.1 Validación y recarga

| Acción | Comando |
|---|---|
| Validar sintaxis | `sudo nginx -t` |
| Recargar sin downtime | `sudo systemctl reload nginx` |
| Reiniciar el servicio | `sudo systemctl restart nginx` |
| Detener el servicio | `sudo systemctl stop nginx` |
| Iniciar el servicio | `sudo systemctl start nginx` |

### 6.2 Estado e inspección

| Acción | Comando |
|---|---|
| Estado del servicio | `systemctl status nginx --no-pager` |
| Habilitar al arranque | `sudo systemctl enable nginx` |
| Puertos en escucha | `sudo ss -tlnp \| grep -E ':80\|:443'` |
| Versión instalada | `nginx -v` |
| Listado de configs cargadas | `nginx -T 2>/dev/null \| less` |

### 6.3 Logs y monitoreo

| Acción | Comando |
|---|---|
| Logs en vivo | `sudo tail -f /var/log/nginx/access.log /var/log/nginx/error.log` |
| Últimos 50 accesos | `sudo tail -n 50 /var/log/nginx/access.log` |
| Últimos errores | `sudo tail -n 50 /var/log/nginx/error.log` |
| Filtrar por código | `sudo grep ' 500 ' /var/log/nginx/access.log` |

### 6.4 Mantenimiento de contenido y configuración

| Acción | Comando |
|---|---|
| Listar contenido publicado | `ls -lah /var/www/ruta7rios` |
| Permisos del directorio | `sudo chown -R nginx:nginx /var/www/ruta7rios && sudo chmod -R 755 /var/www/ruta7rios` |
| Backup del site antes de editar | `sudo cp /etc/nginx/conf.d/cali.conf /etc/nginx/conf.d/cali.conf.bak.$(date +%Y%m%d%H%M%S)` |
| Restaurar última versión | `sudo cp /etc/nginx/conf.d/cali.conf.bak.<timestamp> /etc/nginx/conf.d/cali.conf && sudo nginx -t && sudo systemctl reload nginx` |

### 6.5 Verificación funcional desde la VM

```bash
# Forzar resolución local para pruebas internas
curl -kI --resolve ruta7rios.page:443:127.0.0.1 https://ruta7rios.page/
curl -k  --resolve ruta7rios.page:443:127.0.0.1 https://ruta7rios.page/api/health
curl -I  --resolve ruta7rios.page:80:127.0.0.1 http://ruta7rios.page/
```

---

## 7. Pruebas de reload / restart realizadas

1. **Validación previa:**
   ```
   sudo nginx -t
   nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
   nginx: configuration file /etc/nginx/nginx.conf test is successful
   ```
2. **Recarga en caliente:**
   ```
   sudo systemctl reload nginx
   ```
   - Sin downtime (los workers se reemplazan en caliente).
3. **Estado del servicio tras la recarga:**
   ```
   ● nginx.service - The nginx HTTP and reverse proxy server
        Active: active (running)
        Tasks: 5
        CGroup:
          ├─master
          ├─worker x4
   ```
4. **Verificación funcional inmediata:**
   - `curl -kI https://ruta7rios.page/` → `HTTP/2 200`.
   - `curl -k https://ruta7rios.page/api/health` → `{"status":"ok",...}`.
   - `curl -I http://ruta7rios.page/` → `HTTP/1.1 301` con `Location: https://ruta7rios.page/`.
5. **Logs revisados:**
   - `error.log` solo muestra `[notice]` de arranque/recarga, sin `[error]`/`[crit]`/`[alert]`.

Esto demuestra que el servicio puede recargarse y reiniciarse sin pérdida de disponibilidad.

---

## 8. Procedimiento de recuperación rápida

Si el servicio falla, secuencia recomendada:

1. **Diagnóstico rápido**
   ```bash
   systemctl status nginx --no-pager
   sudo tail -n 100 /var/log/nginx/error.log
   sudo nginx -t
   ```
2. **Si la sintaxis está mal**, revertir al último backup:
   ```bash
   sudo cp /etc/nginx/conf.d/cali.conf.bak.<timestamp> /etc/nginx/conf.d/cali.conf
   sudo nginx -t
   sudo systemctl reload nginx
   ```
3. **Si los puertos están ocupados** por otro proceso:
   ```bash
   sudo ss -tlnp | grep -E ':80|:443'
   ```
4. **Si el backend `:3001` no responde**, el sitio sigue cargando estáticos pero `/api` dará 502; reiniciar PM2:
   ```bash
   pm2 restart cali-backend
   ```
5. **Si el certificado TLS falla**, manejarlo desde HU-70 (`/etc/nginx/ssl/`).

---

## 9. Separación de responsabilidades entre HU-79, HU-78 y HU-70

| Capa | Responsable | Qué cubre |
|---|---|---|
| Servidor web (instalación, config base, `server_name`, SPA, proxy `/api`, parámetros, recarga/reinicio, logs, recuperación) | **HU-79 (esta historia)** | Estabilidad y operabilidad del servicio |
| Build / artefacto publicado (`/var/www/ruta7rios`) | HU-78 | Contenido y disponibilidad de la landing |
| TLS (certificado, redirección HTTPS, cifrados) | HU-70 | Seguridad en tránsito |

La configuración del servidor queda funcional **independientemente** del contenido y de TLS, lo que cumple el espíritu de la HU-79.

---

## 10. Trazabilidad y respaldo documental

- La configuración está en archivos planos versionables (`cali.conf`).
- Cada cambio se respalda con `cp` a `cali.conf.bak.YYYYMMDDHHMMSS`.
- Cada cambio se valida con `nginx -t` antes de aplicar.
- El servicio queda habilitado al arranque (`systemctl enable nginx`).
- Todos los archivos clave y comandos quedan listados en este documento, de modo que cualquier integrante del equipo pueda **repetir, corregir o reanudar** la publicación sin improvisación.

---

## 11. Cumplimiento de criterios HU-79

| Criterio | Estado | Evidencia principal |
|---|---|---|
| 1. Servidor web configurado para servir la landing | ✅ | `cali.conf` con `root /var/www/ruta7rios` y `index.html`; respuesta `HTTP/2 200` |
| 2. Rutas, comportamiento básico y parámetros mínimos ajustados | ✅ | `try_files` SPA, proxy `/api`, workers, puertos `:80/:443`, HTTP/2, logs |
| 3. Reinicios/recargas probados y configuración documentada | ✅ | `nginx -t` OK, `systemctl reload nginx` sin errores, status `active (running)` |
| 4. (Opcional) Archivos y comandos clave identificados | ✅ | Sección 3 (archivos clave) y sección 6 (comandos operativos) |

---

## 12. Conclusión

La configuración del servidor web Nginx para la landing del Track 2 quedó **estable, repetible y trazable**:

- Site dedicado, con redirección HTTP→HTTPS y soporte SPA + proxy `/api`.
- Parámetros mínimos de operación documentados y verificados.
- Procedimientos de validación, recarga, reinicio y recuperación claramente listados.
- Separación explícita con HU-78 (contenido) y HU-70 (TLS).

Esto deja la base operativa lista para soportar **HU-78** (despliegue de la landing) y, posteriormente, **HU-70** (habilitación segura por HTTPS).
