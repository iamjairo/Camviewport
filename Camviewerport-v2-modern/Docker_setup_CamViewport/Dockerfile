FROM node:20-alpine AS base
RUN apk add --no-cache ffmpeg

FROM base AS deps
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --only=production

FROM base AS builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npm run build

FROM base AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 appuser

COPY --from=deps --chown=appuser:nodejs /app/backend/node_modules ./node_modules
COPY --from=builder --chown=appuser:nodejs /app/backend/dist ./dist
COPY --from=builder --chown=appuser:nodejs /app/backend/package.json ./

USER appuser

EXPOSE 3000 8554

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]