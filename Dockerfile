# Multi-stage Dockerfile for Next.js 15 + Prisma on Dokploy

FROM node:20-bullseye-slim AS deps
WORKDIR /app

# Install dependencies (use npm install to avoid strict lockfile errors on CI)
COPY package*.json ./
RUN npm install --no-audit --no-fund

# Copy source and generate Prisma client before build
COPY . .
RUN npx prisma generate --schema src/prisma/schema.prisma

# Build Next.js in standalone mode
RUN npm run build
# Compile custom server.ts
RUN npx tsc server.ts --module CommonJS --moduleResolution node --target es2020 --esModuleInterop --skipLibCheck --outFile ./server-socket.js


FROM node:20-bullseye-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
ENV TZ=Asia/Ho_Chi_Minh

# You may uncomment if you see OpenSSL issues at runtime (Prisma)
# RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy standalone server output, static assets, and runtime necessities
COPY --from=deps /app/.next/standalone ./
COPY --from=deps /app/server-socket.js ./server-socket.js
COPY --from=deps /app/.next/static ./.next/static
COPY --from=deps /app/public ./public

# Prisma runtime and schema (needed if we run migrations on start)
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/src/prisma ./src/prisma

# Run migrations (if any) then start the server
CMD sh -c "npx prisma migrate deploy --schema src/prisma/schema.prisma || true; node server-socket.js"


