# Despliegue CTIC en RHEL

Guia operativa para desplegar el Simulador de Credito UPB en una VM RHEL con MariaDB ya provisionada por CTIC.

## Datos que debes pedir a CTIC antes de ejecutar

- Dominio final en ASCII.
- Confirmacion de DNS apuntando a la VM.
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM_EMAIL`
- Confirmacion de si TLS termina en la VM o en infraestructura CTIC.

Si TLS termina en la VM, pedir tambien:

- Certificado del dominio.
- Llave privada del certificado.
- Confirmacion de si el `.crt` ya incluye la cadena completa o si debes usar tambien el `ca-bundle`.
- Confirmacion de apertura de puertos `80` y `443`.

## Flujo recomendado

1. Copiar el script maestro y su archivo de variables a la VM.
2. Llenar el archivo `ctic-rhel10.deploy.env`.
3. Ejecutar un solo `.sh`.

## Ejecucion recomendada con un solo script

Copiar estos dos archivos a la VM:

- `docs/deployment/ctic-rhel10-bootstrap.sh`
- `docs/deployment/ctic-rhel10.deploy.env.example`

Renombrar el archivo de variables:

```bash
mv ctic-rhel10.deploy.env.example ctic-rhel10.deploy.env
```

Llenar `ctic-rhel10.deploy.env` con los datos reales y luego ejecutar:

```bash
chmod +x ctic-rhel10-bootstrap.sh
./ctic-rhel10-bootstrap.sh
```

## Lecciones validadas en la prueba de VirtualBox

1. Firewall:
   El bootstrap intenta abrir `http` en `firewalld` y tambien `https` si `PUBLIC_URL_SCHEME=https`.

2. Sintaxis del archivo de despliegue:
   No dejes espacios alrededor de `=`.

   Correcto:
   ```env
   APP_DOMAIN=simulador.upb.edu.co
   ```

   Incorrecto:
   ```env
   APP_DOMAIN = simulador.upb.edu.co
   ```

   El bootstrap ahora valida este error antes de hacer `source`.

3. Repositorios con validacion GPG estricta:
   Por defecto se usa:
   ```env
   DNF_INSTALL_FLAGS="-y"
   ```

   Si la VM de CTIC falla por firmas GPG y ellos autorizan continuar, puedes usar:
   ```env
   DNF_INSTALL_FLAGS="-y --nogpgcheck"
   ```

4. GitHub:
   Verifica antes del despliegue que `GITHUB_TOKEN`, `REPO_SLUG` y `GIT_REF` apunten exactamente al repo y rama aprobados. No publiques el archivo `ctic-rhel10.deploy.env`: debe existir solo en la VM o en un canal seguro de entrega.

5. Preparacion previa:
   Crea y llena `ctic-rhel10.deploy.env` con calma antes de conectarte al servidor.

6. Certificados HTTPS:
   Si CTIC te entrega rutas como:
   - `/etc/pki/tls/certs/STAR_bucaramanga_upb_edu_co.crt`
   - `/etc/pki/tls/private/web14.key`
   - `/etc/pki/tls/certs/STAR_bucaramanga_upb_edu_co.ca-bundle`

   entonces en `ctic-rhel10.deploy.env` define:

   ```env
   PUBLIC_URL_SCHEME=https
   SSL_CERT_PATH=/etc/pki/tls/certs/STAR_bucaramanga_upb_edu_co.crt
   SSL_KEY_PATH=/etc/pki/tls/private/web14.key
   SSL_CA_BUNDLE_PATH=/etc/pki/tls/certs/STAR_bucaramanga_upb_edu_co.ca-bundle
   ```

   El script de Nginx generara automaticamente:
   - redireccion `80 -> 443`
   - servidor `443 ssl http2`
   - proxy `/api` hacia `localhost:3000`
   - un `fullchain` local a partir de `SSL_CERT_PATH + SSL_CA_BUNDLE_PATH` cuando entregues ambos archivos

   Si CTIC termina TLS antes de llegar a la VM, deja `PUBLIC_URL_SCHEME=http`.

## Flujo manual

## 1. Instalar prerequisitos en la VM

```bash
sudo dnf install -y git nginx curl gcc-c++ make python3
node -v
npm -v
```

Si `node -v` es menor a 20, pedir a CTIC que instale Node.js 20+ LTS antes de continuar.

## 2. Clonar el repositorio

```bash
sudo mkdir -p /opt/simulador
sudo chown -R "$USER:$USER" /opt/simulador
cd /opt/simulador
git clone <URL_DEL_REPOSITORIO> app
cd app
```

Si el despliegue se hara desde Git, cambia a la rama aprobada por el equipo o a la rama estable publicada:

```bash
git checkout <RAMA_APROBADA>
```

Si no vas a usar Git en la VM, copia directamente esta carpeta del proyecto ya ajustada a `/opt/simulador/app`.

## 3. Exportar variables de despliegue

```bash
export APP_DOMAIN="<DOMINIO_PUBLICO_CTIC>"

export DB_HOST="<DB_HOST_CTIC>"
export DB_PORT="3306"
export DB_NAME="simulador_credito_upb"
export DB_USER="<DB_USER_CTIC>"
export DB_PASSWORD="<DB_PASSWORD_CTIC>"
export DB_SSL="false"

export LDAP_URL="<LDAP_URL_CTIC>"
export LDAP_DOMAIN="<LDAP_DOMAIN_CTIC>"
export LDAP_BASE_DN="<LDAP_BASE_DN_CTIC>"
export LDAP_TIMEOUT_MS="5000"

export JWT_SECRET="<JWT_SECRET>"
export JWT_EXPIRES_IN="8h"
export ADMIN_DEFAULT_PASSWORD="<ADMIN_DEFAULT_PASSWORD>"

export SMTP_HOST="<SMTP_HOST_CTIC>"
export SMTP_PORT="<SMTP_PORT_CTIC>"
export SMTP_USER="<SMTP_USER_CTIC>"
export SMTP_PASS="<SMTP_PASS_CTIC>"
export SMTP_FROM_EMAIL="<SMTP_FROM_EMAIL_CTIC>"

export RETENTION_DAYS="90"
export PURGE_INTERVAL_HOURS="24"
export PURGE_BATCH_SIZE="500"
export TOKEN_PURGE_RETENTION_DAYS="30"
export TOKEN_PURGE_INTERVAL_HOURS="24"
export TOKEN_PURGE_BATCH_SIZE="1000"
```

## 4. Generar `server/.env`

```bash
chmod +x server/scripts/render-ctic-env.sh
./server/scripts/render-ctic-env.sh
cat server/.env
```

## 5. Aplicar configuracion de Nginx

```bash
chmod +x server/scripts/configure-nginx-rhel.sh
./server/scripts/configure-nginx-rhel.sh
```

## 6. Desplegar la aplicacion

```bash
sudo npm install -g pm2
chmod +x server/scripts/deploy-rhel.sh
./server/scripts/deploy-rhel.sh
```

## 7. Validaciones posteriores

```bash
pm2 status
pm2 logs simulador-backend --lines 100
curl --fail http://localhost:3000/api/health
curl --fail http://localhost/api/health
sudo nginx -t
sudo systemctl status nginx --no-pager
```

## 8. Validacion por dominio

```bash
curl -I "http://${APP_DOMAIN}"
curl --fail "http://${APP_DOMAIN}/api/health"
```

Si CTIC termina TLS en la VM o en un balanceador, repetir la validacion con `https://`.

## Validacion especifica de HTTPS en CTIC

Si `PUBLIC_URL_SCHEME=https` y TLS termina en la VM:

```bash
curl -vkI "https://${APP_DOMAIN}"
curl -vk --fail "https://${APP_DOMAIN}/api/health"
sudo nginx -t
sudo systemctl status nginx --no-pager
sudo ss -tlnp | grep -E ':80|:443'
```
