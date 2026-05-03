FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/api/package*.json ./apps/api/

RUN npm ci --workspace=packages/shared --workspace=apps/api

COPY packages/shared ./packages/shared
RUN npm run build --workspace=packages/shared

COPY apps/api ./apps/api
RUN npm run build --workspace=apps/api

EXPOSE 3000
CMD ["node", "apps/api/dist/index.js"]
