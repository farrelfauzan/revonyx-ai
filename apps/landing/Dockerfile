# Build context: monorepo root
# Usage: docker build -f apps/landing/Dockerfile .

# ─── Stage 1: Install dependencies ───
FROM node:22-alpine AS deps
WORKDIR /app

COPY package.json ./
COPY apps/landing/package.json ./apps/landing/
COPY prisma/schema.prisma ./prisma/schema.prisma
COPY prisma.config.ts ./prisma.config.ts

RUN npm install --ignore-scripts

# ─── Stage 2: Build ───
FROM deps AS builder

COPY . .
COPY --from=deps /app/node_modules ./node_modules

ENV NEXT_TELEMETRY_DISABLED=1

RUN cd apps/landing && npx next build

# ─── Stage 3: Production ───
FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/apps/landing/.next/standalone ./
COPY --from=builder /app/apps/landing/.next/static ./apps/landing/.next/static
COPY --from=builder /app/apps/landing/public ./apps/landing/public

EXPOSE 3001

CMD ["node", "apps/landing/server.js"]
