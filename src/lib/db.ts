import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const db: PrismaClient = globalThis.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error'] : [],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Optimize connection pool for better performance
  __internal: {
    engine: {
      connectTimeout: 10000, // 10 seconds
      queryTimeout: 30000,   // 30 seconds
    },
  },
});

if (process.env.NODE_ENV !== "production") globalThis.prisma = db;


