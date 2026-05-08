# Build context: monorepo root
# Usage: docker build -f apps/api/Dockerfile .

# ─── Stage 1: Install dependencies ───
FROM node:22-alpine AS deps
WORKDIR /app

COPY package.json ./
COPY apps/api/package.json ./apps/api/
COPY prisma/schema.prisma ./prisma/schema.prisma
COPY prisma.config.ts ./prisma.config.ts

RUN npm install --ignore-scripts

# ─── Stage 2: Generate Prisma client ───
FROM deps AS prisma

COPY prisma/ ./prisma/
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate

# ─── Stage 3: Build ───
FROM prisma AS builder

COPY . .

COPY --from=prisma /app/node_modules ./node_modules
COPY --from=prisma /app/apps/api/src/generated ./apps/api/src/generated

RUN cd apps/api && npx webpack-cli build --config webpack.docker.config.js

# ─── Stage 4: Production ───
FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/apps/api/dist ./dist
COPY --from=prisma /app/node_modules ./node_modules
COPY --from=prisma /app/prisma ./prisma
COPY --from=prisma /app/prisma.config.ts ./prisma.config.ts
COPY --from=prisma /app/package.json ./package.json

EXPOSE 3000

CMD ["node", "dist/main.js"]
