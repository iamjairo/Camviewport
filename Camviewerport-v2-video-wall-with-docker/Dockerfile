# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 — Build the Vite/React web frontend
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS web-builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 — Nginx serving the SPA + TLS via self-signed cert
# ─────────────────────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS web

RUN apk add --no-cache openssl

COPY --from=web-builder /app/dist /usr/share/nginx/html
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY nginx/entrypoint.sh /docker-entrypoint.d/00-gen-cert.sh

RUN chmod +x /docker-entrypoint.d/00-gen-cert.sh \
 && mkdir -p /etc/nginx/certs

EXPOSE 80 443
