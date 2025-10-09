import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { withAuth, withErrorHandling, successResponse, setCacheHeaders } from "@/lib/api-middleware";

export const GET = withErrorHandling(
  withAuth(async (request: NextRequest) => {
    const employees = await db.employee.findMany({
      where: {
        status: "active"
      },
      select: {
        id: true,
        fullName: true,
        position: true,
        department: true,
        companyEmail: true
      },
      orderBy: {
        fullName: 'asc'
      }
    });

    const response = successResponse(employees);
    return setCacheHeaders(response, 300);
  })
);
