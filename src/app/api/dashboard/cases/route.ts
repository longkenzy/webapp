import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { InternalCaseStatus } from "@prisma/client";
import { withAuth, withErrorHandling } from "@/lib/api-middleware";
import { createOptimizedResponse, INCLUDE_PATTERNS } from "@/lib/api-optimization";
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);

export const GET = withErrorHandling(
  withAuth(async (request: NextRequest) => {
    // Get today's date range
    const startOfDay = dayjs().tz('Asia/Ho_Chi_Minh').startOf('day').toDate();
    const endOfDay = dayjs().tz('Asia/Ho_Chi_Minh').endOf('day').toDate();

    const cases = await db.internalCase.findMany({
      where: {
        OR: [
          {
            createdAt: {
              gte: startOfDay,
              lte: endOfDay
            }
          },
          {
            status: {
              in: [InternalCaseStatus.COMPLETED, InternalCaseStatus.CANCELLED]
            },
            updatedAt: {
              gte: dayjs().tz('Asia/Ho_Chi_Minh').subtract(7, 'days').toDate()
            }
          }
        ]
      },
      include: INCLUDE_PATTERNS.caseWithBasicRelations,
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Limit results for better performance
    });

    return createOptimizedResponse(cases, {
      cache: 'REALTIME', // Fresh data for dashboard
      status: 200
    });
  })
);
