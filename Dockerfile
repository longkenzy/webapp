# ==============================
# Stage 1: Base
# ==============================
FROM node:18-alpine AS base

# Cài đặt gói cần thiết cho Prisma
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# ==============================
# Stage 2: Dependencies
# ==============================
FROM base AS deps

# Copy file định nghĩa package
COPY package.json package-lock.json* ./

# ⚡ Dùng npm install thay vì npm ci để tránh lỗi lockfile mismatch
RUN npm install --omit=dev

# ==============================
# Stage 3: Builder
# ==============================
FROM base AS builder
WORKDIR /app

# Copy dependencies từ stage deps
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Tạo Prisma client
RUN npx prisma generate --schema src/prisma/schema.prisma

# Build ứng dụng Next.js
RUN npm run build

# ==============================
# Stage 4: Runner (production)
# ==============================
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Tạo user không phải root để bảo mật
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# Copy các file cần thiết từ builder
COPY --from=builder /app/public ./public
RUN mkdir .next && chown nextjs:nodejs .next

# Copy kết quả build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma schema + client đã generate
COPY --from=builder --chown=nextjs:nodejs /app/src/prisma ./src/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs

EXPOSE 3000

# Lệnh chạy ứng dụng
CMD ["node", "server.js"]
