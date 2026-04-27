#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
SERVER_DIR="${REPO_ROOT}/server"
FRONTEND_DIST="${REPO_ROOT}/client/dist"
NGINX_ROOT="${NGINX_ROOT:-/usr/share/nginx/html/simulador}"
ECOSYSTEM_FILE="${SERVER_DIR}/ecosystem.config.js"
SERVER_ENV_FILE="${SERVER_DIR}/.env"
PM2_USER="${PM2_USER:-$(id -un)}"
PM2_HOME_DIR="${PM2_HOME_DIR:-$(getent passwd "${PM2_USER}" | cut -d: -f6)}"

log() {
  printf '\n[deploy] %s\n' "$1"
}

fail() {
  printf '\n[deploy][error] %s\n' "$1" >&2
  exit 1
}

require_command() {
  local command_name="$1"
  local install_hint="$2"

  if ! command -v "${command_name}" >/dev/null 2>&1; then
    fail "${command_name} no esta instalado. ${install_hint}"
  fi
}

run_privileged() {
  if [ "${EUID}" -eq 0 ]; then
    "$@"
  else
    sudo "$@"
  fi
}

log "Validando prerequisitos"
require_command node "Instalar Node.js 20+ LTS antes del despliegue."
require_command npm "Instalar npm junto con Node.js."
require_command pm2 "Instalar PM2 globalmente: npm install -g pm2."
if [ "${EUID}" -ne 0 ]; then
  require_command sudo "El usuario de despliegue requiere sudo para publicar Nginx y registrar PM2 en systemd."
fi

NODE_MAJOR="$(node -p "Number(process.versions.node.split('.')[0])")"
if [ "${NODE_MAJOR}" -lt 20 ]; then
  fail "Se requiere Node.js 20+ LTS. Version actual: $(node --version)"
fi

[ -f "${SERVER_ENV_FILE}" ] || fail "No existe ${SERVER_ENV_FILE}. CTIC debe crear el archivo .env del backend antes de desplegar."
[ -f "${ECOSYSTEM_FILE}" ] || fail "No existe ${ECOSYSTEM_FILE}."
[ -n "${PM2_HOME_DIR}" ] || fail "No se pudo resolver el home del usuario PM2 (${PM2_USER})."

log "Instalando dependencias del monorepo"
cd "${REPO_ROOT}"
npm ci

log "Cargando variables de entorno del backend"
set -a
# shellcheck disable=SC1090
source "${SERVER_ENV_FILE}"
set +a

log "Compilando frontend y backend"
npm run build --workspace=client
npm run build --workspace=server

[ -d "${FRONTEND_DIST}" ] || fail "No se encontro ${FRONTEND_DIST}. La compilacion del frontend no genero dist."

log "Publicando frontend en ${NGINX_ROOT}"
run_privileged mkdir -p "${NGINX_ROOT}"
run_privileged find "${NGINX_ROOT}" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
run_privileged cp -a "${FRONTEND_DIST}/." "${NGINX_ROOT}/"
run_privileged find "${NGINX_ROOT}" -type d -exec chmod 755 {} +
run_privileged find "${NGINX_ROOT}" -type f -exec chmod 644 {} +
run_privileged chown -R nginx:nginx "${NGINX_ROOT}" 2>/dev/null || true

log "Reiniciando backend con PM2"
cd "${SERVER_DIR}"
pm2 reload "${ECOSYSTEM_FILE}" --env production --update-env \
  || pm2 start "${ECOSYSTEM_FILE}" --env production --update-env

log "Registrando PM2 en systemd y guardando estado"
run_privileged env PATH="${PATH}" pm2 startup systemd -u "${PM2_USER}" --hp "${PM2_HOME_DIR}"
pm2 save

if command -v curl >/dev/null 2>&1; then
  log "Ejecutando health check local"
  sleep 10
  curl --fail --silent --max-time 10 "http://localhost:${PORT:-3000}/api/health" >/dev/null \
    || fail "Health check fallo. Revisar logs con: pm2 logs simulador-backend"
else
  log "curl no esta instalado; se omite health check automatico"
fi

log "Despliegue completado correctamente"
