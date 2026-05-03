FROM node:20-alpine
WORKDIR /app

# Copy workspace manifests
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/api/package*.json ./apps/api/

RUN npm ci --workspace=packages/shared --workspace=apps/api

# Build shared types
COPY packages/shared ./packages/shared
RUN npm run build --workspace=packages/shared

# Build API
COPY apps/api ./apps/api
RUN npm run build --workspace=apps/api

EXPOSE 3000
CMD ["node", "apps/api/dist/index.js"]
