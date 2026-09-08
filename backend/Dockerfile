FROM node:24.11.0-alpine3.22 AS dependencies
WORKDIR /workspace

COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/admin/package.json frontend/admin/package.json
COPY frontend/web/package.json frontend/web/package.json
COPY packages/sdk/package.json packages/sdk/package.json
RUN npm ci --ignore-scripts --no-audit --no-fund

FROM dependencies AS build
COPY backend backend
COPY packages/sdk/openapi/v1.json packages/sdk/openapi/v1.json
RUN npm run prisma:generate --workspace=@dceylon/backend \
    && npm run build:backend

FROM build AS migration
ENV NODE_ENV=production
USER node
CMD ["./node_modules/.bin/prisma", "migrate", "deploy", "--schema", "backend/prisma/schema.prisma"]

FROM build AS production-dependencies
RUN npm prune --omit=dev --ignore-scripts

FROM node:24.11.0-alpine3.22 AS runtime
ENV NODE_ENV=production \
    API_PORT=8080
WORKDIR /workspace
USER node
COPY --from=production-dependencies --chown=node:node /workspace/node_modules node_modules
COPY --from=build --chown=node:node /workspace/backend/dist backend/dist
COPY --from=build --chown=node:node /workspace/backend/package.json backend/package.json
COPY --from=build --chown=node:node /workspace/packages/sdk/openapi/v1.json packages/sdk/openapi/v1.json
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:'+(process.env.API_PORT||8080)+'/health/ready').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"]
CMD ["node", "backend/dist/main.js"]
