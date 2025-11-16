import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { withAuth, withErrorHandling, successResponse } from "@/lib/api-middleware";
import { createOptimizedResponse, SELECT_FIELDS } from "@/lib/api-optimization";

export const GET = withErrorHandling(
  withAuth(async (request: NextRequest) => {
    // Lấy danh sách partners cho user (không cần quyền admin)
    const partners = await db.partner.findMany({ 
      select: {
        ...SELECT_FIELDS.partner,
        address: true
      },
      orderBy: { shortName: "asc" } 
    });

    return createOptimizedResponse(partners, {
      cache: 'DYNAMIC', // Thay đổi từ STATIC sang DYNAMIC để tránh cache lâu khi có thay đổi
      status: 200
    });
  })
);
