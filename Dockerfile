# ==============================
# Stage 1: Base image
# ==============================
FROM node:18-alpine AS base

# Install system dependencies
RUN apk add --no-cache libc6-compat
WORKDIR /app

# ==============================
# Stage 2: Dependencies
# ==============================
FROM base AS deps

# Copy package files and install dependencies
COPY package.json package-lock.json* ./

# ⚡ Sửa chỗ này: dùng npm install thay vì npm ci để tránh lỗi lockfile
RUN npm install --omit=dev

# ==============================
# Stage 3: Builder
# ==============================
FROM base AS builder
WORKDIR /app

# Copy node_modules từ stage deps
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate --schema src/prisma/schema.prisma

# Build Next.js app
RUN npm run build

# ==============================
# Stage 4: Runner (Production)
# ==============================
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Tạo user bảo mật (không chạy bằng root)
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# Copy các file cần thiết cho runtime
COPY --from=builder /app/public ./public
RUN mkdir .next && chown nextjs:nodejs .next

# Copy output build của Next.js
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma schema và client đã generate
COPY --from=builder --chown=nextjs:nodejs /app/src/prisma ./src/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs

EXPOSE 3000

# Chạy server Next.js production
CMD ["node", "server.js"]
