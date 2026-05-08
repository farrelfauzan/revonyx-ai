# Build context: monorepo root
# Usage: docker build -f apps/dashboard/Dockerfile .

# ─── Stage 1: Install dependencies ───
FROM node:22-alpine AS deps
WORKDIR /app

COPY package.json ./
COPY apps/dashboard/package.json ./apps/dashboard/
COPY prisma/schema.prisma ./prisma/schema.prisma
COPY prisma.config.ts ./prisma.config.ts

RUN npm install --ignore-scripts

# ─── Stage 2: Build ───
FROM deps AS builder

COPY . .
COPY --from=deps /app/node_modules ./node_modules

ENV NEXT_TELEMETRY_DISABLED=1

RUN cd apps/dashboard && npx next build

# ─── Stage 3: Production ───
FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/apps/dashboard/.next/standalone ./
COPY --from=builder /app/apps/dashboard/.next/static ./apps/dashboard/.next/static
COPY --from=builder /app/apps/dashboard/public ./apps/dashboard/public

EXPOSE 4200

CMD ["node", "apps/dashboard/server.js"]
