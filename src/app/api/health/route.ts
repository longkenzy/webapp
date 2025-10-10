import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { withAuth, successResponse, errorResponse } from "@/lib/api-middleware";
import { Role } from "@prisma/client";

import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);


async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await db.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

export const GET = withAuth(async (request: NextRequest) => {
  const dbHealthy = await checkDatabaseHealth();
  
  const healthData = {
    status: dbHealthy ? 'healthy' : 'unhealthy',
    timestamp: dayjs().tz('Asia/Ho_Chi_Minh').toDate(),
    database: {
      connected: dbHealthy
    },
    memory: {
      used: process.memoryUsage().heapUsed / 1024 / 1024, // MB
      total: process.memoryUsage().heapTotal / 1024 / 1024, // MB
    },
    uptime: process.uptime()
  };

  if (!dbHealthy) {
    return errorResponse("Database connection failed", 503);
  }

  return successResponse(healthData);
}, Role.ADMIN);