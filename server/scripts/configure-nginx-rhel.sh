#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_CONF="/etc/nginx/conf.d/simulador-upb.conf"
APP_DOMAIN="${APP_DOMAIN:-simulador.example.edu.co}"
PUBLIC_URL_SCHEME="${PUBLIC_URL_SCHEME:-http}"
SSL_CERT_PATH="${SSL_CERT_PATH:-}"
SSL_KEY_PATH="${SSL_KEY_PATH:-}"
SSL_CA_BUNDLE_PATH="${SSL_CA_BUNDLE_PATH:-}"
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

render_http_config() {
  cat > "${TMP_CONF_FILE}" <<EOF
server {
    listen 80;
    server_name ${APP_DOMAIN};

    root /usr/share/nginx/html/simulador;
    index index.html;

    access_log /var/log/nginx/simulador-upb.access.log;
    error_log /var/log/nginx/simulador-upb.error.log warn;

    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 60s;
        proxy_connect_timeout 10s;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF
}

render_https_config() {
  [ -n "${SSL_CERT_PATH}" ] || fail "SSL_CERT_PATH es obligatorio cuando PUBLIC_URL_SCHEME=https."
  [ -n "${SSL_KEY_PATH}" ] || fail "SSL_KEY_PATH es obligatorio cuando PUBLIC_URL_SCHEME=https."

  run_privileged test -f "${SSL_CERT_PATH}" || fail "No existe el certificado ${SSL_CERT_PATH}."
  run_privileged test -f "${SSL_KEY_PATH}" || fail "No existe la llave privada ${SSL_KEY_PATH}."

  local ssl_certificate_effective="${SSL_CERT_PATH}"
  local ssl_trusted_certificate_block=""

  if [ -n "${SSL_CA_BUNDLE_PATH}" ]; then
    run_privileged test -f "${SSL_CA_BUNDLE_PATH}" || fail "No existe el CA bundle ${SSL_CA_BUNDLE_PATH}."
    local fullchain_tmp
    local fullchain_target
    fullchain_tmp="$(mktemp)"
    fullchain_target="/etc/pki/tls/certs/${APP_DOMAIN}.fullchain.crt"

    cat "${SSL_CERT_PATH}" > "${fullchain_tmp}"
    printf '\n' >> "${fullchain_tmp}"
    cat "${SSL_CA_BUNDLE_PATH}" >> "${fullchain_tmp}"

    log "Generando fullchain en ${fullchain_target}"
    run_privileged install -m 644 "${fullchain_tmp}" "${fullchain_target}"
    rm -f "${fullchain_tmp}"

    ssl_certificate_effective="${fullchain_target}"
    ssl_trusted_certificate_block="    ssl_trusted_certificate ${SSL_CA_BUNDLE_PATH};"
  fi

  cat > "${TMP_CONF_FILE}" <<EOF
server {
    listen 80;
    server_name ${APP_DOMAIN};
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${APP_DOMAIN};

    root /usr/share/nginx/html/simulador;
    index index.html;

    ssl_certificate ${ssl_certificate_effective};
    ssl_certificate_key ${SSL_KEY_PATH};
${ssl_trusted_certificate_block}
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;

    access_log /var/log/nginx/simulador-upb.access.log;
    error_log /var/log/nginx/simulador-upb.error.log warn;

    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 60s;
        proxy_connect_timeout 10s;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF
}

command -v nginx >/dev/null 2>&1 || fail "nginx no esta instalado."

TMP_CONF_FILE="$(mktemp)"

case "${PUBLIC_URL_SCHEME}" in
  http)
    render_http_config
    ;;
  https)
    render_https_config
    ;;
  *)
    fail "PUBLIC_URL_SCHEME debe ser http o https. Valor recibido: ${PUBLIC_URL_SCHEME}"
    ;;
esac

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
