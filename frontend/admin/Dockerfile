# syntax=docker/dockerfile:1

FROM node:24.11.0-alpine3.22 AS dependencies
WORKDIR /workspace

COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/admin/package.json frontend/admin/package.json
COPY frontend/web/package.json frontend/web/package.json
COPY packages/sdk/package.json packages/sdk/package.json
RUN npm ci --ignore-scripts --no-audit --no-fund

FROM dependencies AS builder
WORKDIR /workspace
ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_FIREBASE_API_KEY=$NEXT_PUBLIC_FIREBASE_API_KEY
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID=$NEXT_PUBLIC_FIREBASE_PROJECT_ID
ARG NEXT_PUBLIC_FIREBASE_APP_ID=$NEXT_PUBLIC_FIREBASE_APP_ID
ENV NEXT_PUBLIC_FIREBASE_API_KEY=$NEXT_PUBLIC_FIREBASE_API_KEY \
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN \
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=$NEXT_PUBLIC_FIREBASE_PROJECT_ID \
    NEXT_PUBLIC_FIREBASE_APP_ID=$NEXT_PUBLIC_FIREBASE_APP_ID

COPY --from=dependencies /workspace/node_modules ./node_modules
COPY --from=dependencies /workspace/backend/package.json backend/package.json
COPY --from=dependencies /workspace/frontend/admin/package.json frontend/admin/package.json
COPY --from=dependencies /workspace/frontend/web/package.json frontend/web/package.json
COPY --from=dependencies /workspace/packages/sdk/package.json packages/sdk/package.json
COPY package.json package-lock.json ./
COPY frontend/admin frontend/admin

RUN API_BASE_URL=http://127.0.0.1:8080 \
    APP_ENVIRONMENT=Production \
    npm run build:admin

FROM node:24.11.0-alpine3.22 AS runtime
WORKDIR /workspace

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3001

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 --ingroup nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /workspace/frontend/admin/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /workspace/frontend/admin/.next/static ./frontend/admin/.next/static

USER nextjs
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:'+(process.env.PORT||3001)+'/').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"]

CMD ["node", "frontend/admin/server.js"]
