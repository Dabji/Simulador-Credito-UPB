#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
SOURCE_CONF="${REPO_ROOT}/infrastructure/nginx/simulador-upb.conf"
TARGET_CONF="/etc/nginx/conf.d/simulador-upb.conf"
APP_DOMAIN="${APP_DOMAIN:-simuladorfinanciaciondirecta.bucaramanga.upb.edu.co}"
TMP_CONF_FILE=""

log() {
  printf '\n[nginx-config] %s\n' "$1"
}

fail() {
  printf '\n[nginx-config][error] %s\n' "$1" >&2
  exit 1
}

cleanup() {
  if [ -n "${TMP_CONF_FILE}" ] && [ -f "${TMP_CONF_FILE}" ]; then
    rm -f "${TMP_CONF_FILE}"
  fi
}

trap cleanup EXIT

run_privileged() {
  if [ "${EUID}" -eq 0 ]; then
    "$@"
  else
    sudo "$@"
  fi
}

command -v nginx >/dev/null 2>&1 || fail "nginx no esta instalado."

[ -f "${SOURCE_CONF}" ] || fail "No existe el archivo fuente ${SOURCE_CONF}."

TMP_CONF_FILE="$(mktemp)"
sed "s/server_name simuladorfinanciaciondirecta.bucaramanga.upb.edu.co;/server_name ${APP_DOMAIN};/" \
  "${SOURCE_CONF}" > "${TMP_CONF_FILE}"

if run_privileged test -f "${TARGET_CONF}"; then
  timestamp="$(date +%Y%m%d%H%M%S)"
  log "Respaldando configuracion previa en ${TARGET_CONF}.bak.${timestamp}"
  run_privileged cp "${TARGET_CONF}" "${TARGET_CONF}.bak.${timestamp}"
fi

log "Copiando configuracion Nginx a ${TARGET_CONF}"
run_privileged cp "${TMP_CONF_FILE}" "${TARGET_CONF}"

log "Validando sintaxis de Nginx"
run_privileged nginx -t

log "Habilitando Nginx al arranque"
run_privileged systemctl enable nginx

if run_privileged systemctl is-active --quiet nginx; then
  log "Recargando Nginx"
  run_privileged systemctl reload nginx
else
  log "Iniciando Nginx"
  run_privileged systemctl start nginx
fi

log "Configuracion Nginx aplicada correctamente"
