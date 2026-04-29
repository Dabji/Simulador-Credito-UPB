#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
TEMPLATE_FILE="${SERVER_DIR}/ctic.production.env.example"
OUTPUT_FILE="${SERVER_DIR}/.env"

log() {
  printf '\n[render-env] %s\n' "$1"
}

fail() {
  printf '\n[render-env][error] %s\n' "$1" >&2
  exit 1
}

require_var() {
  local var_name="$1"
  if [ -z "${!var_name:-}" ]; then
    fail "La variable ${var_name} es obligatoria para generar ${OUTPUT_FILE}."
  fi
}

replace_token() {
  local token="$1"
  local value="$2"
  local escaped_value
  escaped_value="$(printf '%s' "${value}" | sed -e 's/[\\/&]/\\&/g')"
  sed -i "s|__${token}__|${escaped_value}|g" "${OUTPUT_FILE}"
}

[ -f "${TEMPLATE_FILE}" ] || fail "No existe la plantilla ${TEMPLATE_FILE}."

required_vars=(
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

cp "${TEMPLATE_FILE}" "${OUTPUT_FILE}"

replace_token "APP_DOMAIN" "${APP_DOMAIN}"
replace_token "DB_HOST" "${DB_HOST}"
replace_token "DB_PORT" "${DB_PORT}"
replace_token "DB_NAME" "${DB_NAME}"
replace_token "DB_USER" "${DB_USER}"
replace_token "DB_PASSWORD" "${DB_PASSWORD}"
replace_token "DB_SSL" "${DB_SSL}"
replace_token "LDAP_URL" "${LDAP_URL}"
replace_token "LDAP_DOMAIN" "${LDAP_DOMAIN}"
replace_token "LDAP_BASE_DN" "${LDAP_BASE_DN}"
replace_token "LDAP_TIMEOUT_MS" "${LDAP_TIMEOUT_MS}"
replace_token "JWT_SECRET" "${JWT_SECRET}"
replace_token "JWT_EXPIRES_IN" "${JWT_EXPIRES_IN}"
replace_token "ADMIN_DEFAULT_PASSWORD" "${ADMIN_DEFAULT_PASSWORD:-}"
replace_token "SMTP_HOST" "${SMTP_HOST}"
replace_token "SMTP_PORT" "${SMTP_PORT}"
replace_token "SMTP_USER" "${SMTP_USER}"
replace_token "SMTP_PASS" "${SMTP_PASS}"
replace_token "SMTP_FROM_EMAIL" "${SMTP_FROM_EMAIL}"
replace_token "RETENTION_DAYS" "${RETENTION_DAYS}"
replace_token "PURGE_INTERVAL_HOURS" "${PURGE_INTERVAL_HOURS}"
replace_token "PURGE_BATCH_SIZE" "${PURGE_BATCH_SIZE}"
replace_token "TOKEN_PURGE_RETENTION_DAYS" "${TOKEN_PURGE_RETENTION_DAYS}"
replace_token "TOKEN_PURGE_INTERVAL_HOURS" "${TOKEN_PURGE_INTERVAL_HOURS}"
replace_token "TOKEN_PURGE_BATCH_SIZE" "${TOKEN_PURGE_BATCH_SIZE}"

chmod 600 "${OUTPUT_FILE}" 2>/dev/null || true

log "Archivo ${OUTPUT_FILE} generado correctamente desde la plantilla CTIC."
