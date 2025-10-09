import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { InternalCaseStatus } from "@prisma/client";
import { withAuth, withErrorHandling, successResponse, setNoCacheHeaders } from "@/lib/api-middleware";
import { commonCaseIncludes } from "@/lib/case-helpers";

export const GET = withErrorHandling(
  withAuth(async (request: NextRequest) => {
    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const cases = await db.internalCase.findMany({
      where: {
        OR: [
          {
            createdAt: {
              gte: startOfDay,
              lt: endOfDay
            }
          },
          {
            status: {
              notIn: [InternalCaseStatus.RECEIVED, InternalCaseStatus.IN_PROGRESS]
            }
          }
        ]
      },
      include: commonCaseIncludes,
      orderBy: {
        createdAt: 'desc'
      }
    });

    const response = successResponse(cases);
    return setNoCacheHeaders(response);
  })
);
