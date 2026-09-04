# syntax=docker/dockerfile:1

FROM node:24.11.0-alpine3.22 AS dependencies
WORKDIR /workspace

COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/admin/package.json frontend/admin/package.json
COPY frontend/web/package.json frontend/web/package.json
COPY packages/sdk/package.json packages/sdk/package.json
RUN npm ci --no-audit --no-fund

FROM node:24.11.0-alpine3.22 AS builder
WORKDIR /workspace
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=dependencies /workspace/node_modules ./node_modules
COPY --from=dependencies /workspace/backend/package.json backend/package.json
COPY --from=dependencies /workspace/frontend/admin/package.json frontend/admin/package.json
COPY --from=dependencies /workspace/frontend/web/package.json frontend/web/package.json
COPY --from=dependencies /workspace/packages/sdk/package.json packages/sdk/package.json
COPY package.json package-lock.json ./
COPY frontend/web frontend/web
COPY packages/sdk packages/sdk

# Safe build-only values let Next.js analyse server routes without embedding deployment secrets.
# Dockploy runtime variables replace these when the standalone server starts.
RUN API_BASE_URL=http://127.0.0.1:8080 \
    SITE_URL=http://127.0.0.1:3000 \
    APP_ENVIRONMENT=Production \
    AUTH_MODE=oidc \
    AUTH_ISSUER=https://identity.invalid \
    AUTH_CLIENT_ID=build-only \
    AUTH_CLIENT_SECRET=build-only \
    AUTH_SCOPE="openid profile email" \
    AUTH_SECRET=build-only-secret-at-least-32-characters \
    npm run build:web

FROM node:24.11.0-alpine3.22 AS runtime
WORKDIR /workspace

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 --ingroup nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /workspace/frontend/web/public ./frontend/web/public
COPY --from=builder --chown=nextjs:nodejs /workspace/frontend/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /workspace/frontend/web/.next/static ./frontend/web/.next/static

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/robots.txt').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"]

CMD ["node", "frontend/web/server.js"]
