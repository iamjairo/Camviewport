#!/bin/sh
# Auto-generate a self-signed TLS certificate if one doesn't already exist.
# Placed in /docker-entrypoint.d/ so nginx runs it before starting.

set -e

CERT_DIR=/etc/nginx/certs
CN="${SSL_COMMON_NAME:-camviewport.local}"

if [ ! -f "${CERT_DIR}/self.crt" ] || [ ! -f "${CERT_DIR}/self.key" ]; then
  echo "[entrypoint] Generating self-signed certificate for CN=${CN}"
  mkdir -p "${CERT_DIR}"
  openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
    -keyout "${CERT_DIR}/self.key" \
    -out    "${CERT_DIR}/self.crt" \
    -subj   "/C=US/ST=Local/L=Local/O=CamViewport/CN=${CN}" \
    -addext "subjectAltName=DNS:${CN},DNS:localhost,IP:127.0.0.1"
  echo "[entrypoint] Certificate generated."
else
  echo "[entrypoint] Certificate already exists, skipping generation."
fi
