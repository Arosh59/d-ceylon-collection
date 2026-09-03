FROM node:24.11.0-alpine3.22 AS build
WORKDIR /workspace

COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/admin/package.json frontend/admin/package.json
COPY frontend/web/package.json frontend/web/package.json
COPY packages/sdk/package.json packages/sdk/package.json
RUN npm ci --ignore-scripts

COPY backend backend
COPY packages/sdk/openapi/v1.json packages/sdk/openapi/v1.json
RUN npm run prisma:generate --workspace=@dceylon/backend \
    && npm run build:backend \
    && npm prune --omit=dev

FROM node:24.11.0-alpine3.22 AS runtime
ENV NODE_ENV=production
WORKDIR /workspace
USER node
COPY --from=build --chown=node:node /workspace/node_modules node_modules
COPY --from=build --chown=node:node /workspace/backend/dist backend/dist
COPY --from=build --chown=node:node /workspace/backend/package.json backend/package.json
COPY --from=build --chown=node:node /workspace/packages/sdk/openapi/v1.json packages/sdk/openapi/v1.json
EXPOSE 8080
CMD ["node", "backend/dist/main.js"]
