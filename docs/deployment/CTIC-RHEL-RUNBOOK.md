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

Si publicas esta rama en remoto, luego ejecuta:

```bash
git checkout feat/ctic-rhel-deploy
```

Si no vas a usar Git en la VM, copia directamente esta carpeta del proyecto ya ajustada a `/opt/simulador/app`.

## 3. Exportar variables de despliegue

```bash
export APP_DOMAIN="simuladorfinanciaciondirecta.bucaramanga.upb.edu.co"

export DB_HOST="<DB_HOST_CTIC>"
export DB_PORT="3306"
export DB_NAME="simulador_credito_upb"
export DB_USER="<DB_USER_CTIC>"
export DB_PASSWORD="<DB_PASSWORD_CTIC>"
export DB_SSL="false"

export LDAP_URL="ldap://10.146.36.100:389"
export LDAP_DOMAIN="bga.upb"
export LDAP_BASE_DN="OU=OU Empleados,DC=bga,DC=upb"
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
