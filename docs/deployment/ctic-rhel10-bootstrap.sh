#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_ENV_FILE="${DEPLOY_ENV_FILE:-${SCRIPT_DIR}/ctic-rhel10.deploy.env}"

GITHUB_USERNAME_DEFAULT="josemora090525"
REPO_SLUG_DEFAULT="Dabji/Simulador-Credito-UPB"
GIT_REF_DEFAULT="feat/ctic-rhel-deploy"
APP_BASE_DIR_DEFAULT="/opt/simulador"
PUBLIC_URL_SCHEME_DEFAULT="http"

log() {
  printf '\n[ctic-bootstrap] %s\n' "$1"
}

fail() {
  printf '\n[ctic-bootstrap][error] %s\n' "$1" >&2
  exit 1
}

run_privileged() {
  if [ "${EUID}" -eq 0 ]; then
    "$@"
  else
    sudo "$@"
  fi
}

require_command() {
  local command_name="$1"
  if ! command -v "${command_name}" >/dev/null 2>&1; then
    fail "No se encontro el comando ${command_name}."
  fi
}

require_var() {
  local var_name="$1"
  if [ -z "${!var_name:-}" ]; then
    fail "La variable ${var_name} es obligatoria. Revisa ${DEPLOY_ENV_FILE}."
  fi
}

node_major() {
  node -p "Number(process.versions.node.split('.')[0])"
}

install_nodejs_if_needed() {
  if command -v node >/dev/null 2>&1 && [ "$(node_major)" -ge 20 ]; then
    log "Node.js $(node --version) ya cumple el requisito"
    return
  fi

  log "Instalando Node.js 20.x desde NodeSource"
  curl -fsSL https://rpm.nodesource.com/setup_20.x | run_privileged bash -
  run_privileged dnf install -y nodejs

  command -v node >/dev/null 2>&1 || fail "Node.js no quedo instalado."
  [ "$(node_major)" -ge 20 ] || fail "Node.js sigue siendo menor a 20 despues de instalarlo."
}

build_auth_header() {
  printf '%s' "${GITHUB_USERNAME}:${GITHUB_TOKEN}" | base64 -w0
}

clone_or_update_repo() {
  local repo_url="https://github.com/${REPO_SLUG}.git"
  local auth_header
  auth_header="$(build_auth_header)"

  if ! git -c "http.extraHeader=Authorization: Basic ${auth_header}" \
    ls-remote --exit-code --heads "${repo_url}" "${GIT_REF}" >/dev/null 2>&1; then
    fail "La rama ${GIT_REF} no existe en GitHub. Debes hacer push de la rama antes de usar este script."
  fi

  run_privileged mkdir -p "${APP_BASE_DIR}"
  run_privileged chown -R "${DEPLOY_USER}:${DEPLOY_GROUP}" "${APP_BASE_DIR}"

  if [ -d "${APP_DIR}/.git" ]; then
    log "Repositorio ya existe en ${APP_DIR}; actualizando rama ${GIT_REF}"
    git -C "${APP_DIR}" -c "http.extraHeader=Authorization: Basic ${auth_header}" fetch --prune origin
    git -C "${APP_DIR}" checkout -B "${GIT_REF}" "origin/${GIT_REF}"
  else
    log "Clonando repositorio ${REPO_SLUG} en ${APP_DIR}"
    git -c "http.extraHeader=Authorization: Basic ${auth_header}" \
      clone --branch "${GIT_REF}" "${repo_url}" "${APP_DIR}"
  fi
}

if [ "${EUID}" -eq 0 ]; then
  fail "Ejecuta este script con un usuario normal que tenga sudo, no directamente como root."
fi

[ -f "${DEPLOY_ENV_FILE}" ] || fail "No existe ${DEPLOY_ENV_FILE}. Crea ese archivo primero."

set -a
# shellcheck disable=SC1090
source "${DEPLOY_ENV_FILE}"
set +a

GITHUB_USERNAME="${GITHUB_USERNAME:-${GITHUB_USERNAME_DEFAULT}}"
REPO_SLUG="${REPO_SLUG:-${REPO_SLUG_DEFAULT}}"
GIT_REF="${GIT_REF:-${GIT_REF_DEFAULT}}"
APP_BASE_DIR="${APP_BASE_DIR:-${APP_BASE_DIR_DEFAULT}}"
PUBLIC_URL_SCHEME="${PUBLIC_URL_SCHEME:-${PUBLIC_URL_SCHEME_DEFAULT}}"
APP_DIR="${APP_BASE_DIR}/app"
DEPLOY_USER="$(id -un)"
DEPLOY_GROUP="$(id -gn)"

required_vars=(
  GITHUB_TOKEN
  APP_DOMAIN
  DB_HOST
  DB_PORT
  DB_NAME
  DB_USER
  DB_PASSWORD
  DB_SSL
  LDAP_URL
  LDAP_DOMAIN
  LDAP_BASE_DN
  LDAP_TIMEOUT_MS
  JWT_SECRET
  JWT_EXPIRES_IN
  SMTP_HOST
  SMTP_PORT
  SMTP_USER
  SMTP_PASS
  SMTP_FROM_EMAIL
  RETENTION_DAYS
  PURGE_INTERVAL_HOURS
  PURGE_BATCH_SIZE
  TOKEN_PURGE_RETENTION_DAYS
  TOKEN_PURGE_INTERVAL_HOURS
  TOKEN_PURGE_BATCH_SIZE
)

for var_name in "${required_vars[@]}"; do
  require_var "${var_name}"
done

log "Instalando prerequisitos base de RHEL 10"
run_privileged dnf install -y git nginx curl gcc-c++ make python3 ca-certificates

install_nodejs_if_needed

log "Instalando PM2 global"
run_privileged npm install -g pm2

require_command git
require_command curl
require_command base64
require_command nginx
require_command node
require_command npm
require_command pm2

clone_or_update_repo

cd "${APP_DIR}"

log "Generando server/.env"
chmod +x server/scripts/render-ctic-env.sh
./server/scripts/render-ctic-env.sh

log "Aplicando configuracion de Nginx"
chmod +x server/scripts/configure-nginx-rhel.sh
APP_DOMAIN="${APP_DOMAIN}" ./server/scripts/configure-nginx-rhel.sh

log "Ejecutando despliegue del monorepo"
chmod +x server/scripts/deploy-rhel.sh
./server/scripts/deploy-rhel.sh

log "Validando servicios locales"
pm2 status
curl --fail --silent --max-time 10 "http://localhost:3000/api/health" >/dev/null
curl --fail --silent --max-time 10 "http://localhost/api/health" >/dev/null
sudo nginx -t >/dev/null

log "Validando URL publica con esquema ${PUBLIC_URL_SCHEME}"
curl -I "${PUBLIC_URL_SCHEME}://${APP_DOMAIN}" || true
curl --fail --silent --max-time 10 "${PUBLIC_URL_SCHEME}://${APP_DOMAIN}/api/health" || true

log "Bootstrap completo. Aplicacion desplegada en ${APP_DIR}"
