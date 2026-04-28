# HU-70 — Habilitación de HTTPS/TLS sobre el servicio web publicado

**Sprint:** Sprint 3 (UI & Reports / Interfaz & Reportes)
**Épica:** EP-18
**Prioridad:** Alta
**Backlog:** HU-70 (HU-70.01 – HU-70.04)
**Dependencias:** HU-62, HU-64, HU-78, HU-79, HU-80

---

## 1. Objetivo

Habilitar HTTPS/TLS sobre el servicio web publicado del Track 2, asegurando cifrado en tránsito, acceso seguro y dejando evidencia técnica de una publicación responsable dentro del entorno del laboratorio.

La historia exige:

- Definir una estrategia clara de gestión de certificados para el entorno.
- Configurar el servidor web para responder por HTTPS y redirigir HTTP cuando aplique.
- Validar el canal cifrado desde un cliente real, no solo abrir el puerto 443.
- Documentar el comportamiento del certificado respecto a vigencia, confianza y advertencias del entorno.

---

## 2. Estrategia de certificados elegida

Se decidió usar **certificados autofirmados generados con OpenSSL**, gestionados directamente sobre la VM que publica el servicio.

Justificación:

- El entorno corresponde a un **laboratorio académico**, sin necesidad de cadena de confianza pública para terceros externos.
- El servicio se publica para acceso controlado por la red interna del laboratorio.
- Permite tener TLS funcional, control total del ciclo de vida del certificado y evidencia técnica clara, sin depender de una CA externa.
- Es coherente con el alcance de la HU-70 dentro del contexto del laboratorio.

Parámetros del certificado emitido:

- Algoritmo: RSA 2048
- Hash: SHA-256
- Vigencia: 10 años (3650 días)
- Subject (CN): `ruta7rios.page`
- Subject Alternative Name (SAN):
  - DNS: `ruta7rios.page`
  - DNS: `www.ruta7rios.page`
  - IP: `100.121.33.80`
- Emisor: autofirmado (mismo Subject que Issuer)

Ubicación en la VM:

- Certificado: `/etc/nginx/ssl/ruta7rios.crt`
- Llave privada: `/etc/nginx/ssl/ruta7rios.key` (permisos `600`)

---

## 3. Configuración del servidor web

El servidor web utilizado es **Nginx**, instalado y operando sobre la VM del laboratorio.

Archivo de configuración: `/etc/nginx/conf.d/cali.conf`

Comportamiento implementado:

- Redirección de **HTTP → HTTPS** para `ruta7rios.page` y `www.ruta7rios.page`.
- Servidor HTTPS en el puerto 443 con TLS 1.2 y TLS 1.3.
- Cifrados restringidos: `HIGH:!aNULL:!MD5`.
- Servido del frontend estático desde `/var/www/ruta7rios`.
- Soporte de SPA con `try_files $uri $uri/ /index.html;`.
- Proxy inverso de `/api` hacia el backend en `http://127.0.0.1:3001`.

Configuración aplicada:

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

    ssl_certificate     /etc/nginx/ssl/ruta7rios.crt;
    ssl_certificate_key /etc/nginx/ssl/ruta7rios.key;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    root /var/www/ruta7rios;
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

---

## 4. Procedimiento ejecutado en la VM

1. Creación del directorio de certificados:

   ```bash
   sudo mkdir -p /etc/nginx/ssl
   ```

2. Generación del certificado autofirmado con OpenSSL:

   ```bash
   sudo openssl req -x509 -nodes -newkey rsa:2048 -sha256 -days 3650 \
     -keyout /etc/nginx/ssl/ruta7rios.key \
     -out /etc/nginx/ssl/ruta7rios.crt \
     -subj "/C=CO/ST=Santander/L=Bucaramanga/O=Cali/CN=ruta7rios.page" \
     -addext "subjectAltName=DNS:ruta7rios.page,DNS:www.ruta7rios.page,IP:100.121.33.80"
   sudo chmod 600 /etc/nginx/ssl/ruta7rios.key
   ```

3. Configuración del sitio en `/etc/nginx/conf.d/cali.conf` con HTTPS, redirección HTTP→HTTPS y proxy `/api`.

4. Validación de sintaxis y recarga de Nginx:

   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

---

## 5. Relación con DNS y publicación del sitio

- El dominio `ruta7rios.page` está gestionado en **Name.com**.
- Se configuraron registros DNS tipo `A` apuntando a la IP del servicio dentro de la red privada (Tailscale): `100.121.33.80`.
  - `ruta7rios.page` → `100.121.33.80`
  - `www.ruta7rios.page` → `100.121.33.80`
- El nombre que aparece en el certificado (CN/SAN) es coherente con el nombre publicado en DNS y con el `server_name` configurado en Nginx.

---

## 6. Validación del canal seguro desde cliente

Se realizaron pruebas para validar que el canal TLS responde de forma real, y no solamente que el puerto 443 esté abierto.

### 6.1 Validación local en la VM

```bash
curl -kI --resolve ruta7rios.page:443:127.0.0.1 https://ruta7rios.page/
curl -k  --resolve ruta7rios.page:443:127.0.0.1 https://ruta7rios.page/api/health
```

Resultados:

- `HTTP/2 200` desde Nginx en el endpoint raíz, sirviendo el frontend.
- Respuesta JSON `{"status":"ok",...}` desde el backend a través del proxy `/api/health`.

### 6.2 Validación del certificado emitido

```bash
openssl x509 -in /etc/nginx/ssl/ruta7rios.crt -noout -subject -issuer -ext subjectAltName
```

Resultado:

```
subject=C=CO, ST=Santander, L=Bucaramanga, O=Cali, CN=ruta7rios.page
issuer =C=CO, ST=Santander, L=Bucaramanga, O=Cali, CN=ruta7rios.page
X509v3 Subject Alternative Name:
    DNS:ruta7rios.page, DNS:www.ruta7rios.page, IP Address:100.121.33.80
```

### 6.3 Validación desde cliente en la red privada

- Acceso por IP privada: `https://100.121.33.80` responde con la web sobre HTTPS.
- El navegador muestra la advertencia esperada de certificado autofirmado y permite continuar.
- En clientes que importan el certificado raíz como “confiable”, la advertencia desaparece y el navegador muestra el sitio como seguro.

---

## 7. Comportamiento del certificado: vigencia, confianza y advertencias

| Aspecto | Resultado |
|---|---|
| Vigencia | 10 años desde la emisión |
| Algoritmo | RSA 2048 + SHA-256 |
| Confianza pública | No (certificado autofirmado, sin CA pública) |
| Confianza interna | Sí, si se importa el certificado como raíz de confianza en los equipos del laboratorio |
| Coincidencia de nombre | Sí, CN y SAN cubren `ruta7rios.page`, `www.ruta7rios.page` y la IP `100.121.33.80` |
| Cifrado en tránsito | Sí, TLS 1.2 / TLS 1.3, cifrados HIGH |
| Redirección HTTP→HTTPS | Sí, configurada en Nginx |

Advertencias propias del entorno de laboratorio:

- Por ser autofirmado, el navegador muestra el aviso `NET::ERR_CERT_AUTHORITY_INVALID` en clientes que no han importado el certificado como CA confiable.
- El TLD `.page` aparece en la lista **HSTS preload** de los navegadores principales, lo que impide saltarse la advertencia al acceder por el nombre del dominio en navegadores que respeten esa lista. Para esos casos, dentro del laboratorio se accede por la IP del servicio o se importa el certificado en los equipos del laboratorio que necesiten usar el dominio.
- Estas advertencias son consistentes con el contexto académico y forman parte de la documentación del entorno.

---

## 8. Cumplimiento de criterios de aceptación

| Criterio | Cumplimiento | Evidencia |
|---|---|---|
| 1. Estrategia clara de gestión de certificados | Cumplido | Sección 2: definición de uso de OpenSSL autofirmado para entorno de laboratorio |
| 2. HTTPS habilitado y redirección HTTP→HTTPS | Cumplido | Sección 3: bloque Nginx con `listen 443 ssl` y `return 301` desde el puerto 80 |
| 3. Validación de acceso seguro desde cliente | Cumplido | Sección 6: pruebas con `curl`, validación del certificado y acceso desde la red privada |
| 4. Comportamiento del certificado documentado | Cumplido | Sección 7: vigencia, confianza, advertencias y limitaciones del entorno |

---

## 9. Conclusión

Sobre la VM del laboratorio se habilitó correctamente HTTPS/TLS para el servicio web publicado:

- Se definió y aplicó una estrategia de certificados basada en OpenSSL autofirmado, alineada al alcance de laboratorio.
- Nginx quedó configurado para forzar HTTPS y servir el sitio bajo TLS 1.2/1.3, manteniendo coherencia entre DNS, nombre del sitio y certificado.
- Se validó el canal cifrado desde cliente real, no únicamente la apertura del puerto 443.
- Se documentaron explícitamente las advertencias de confianza propias del entorno, cumpliendo con la trazabilidad esperada por la HU-70.
