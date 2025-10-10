import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { Role } from "@prisma/client";
import { atLeast } from "@/lib/auth/rbac";

// Standard API response format
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Authentication middleware
export function withAuth(
  handler: (request: NextRequest, session: any) => Promise<NextResponse>,
  requiredRole?: Role
) {
  return async (request: NextRequest) => {
    try {
      const session = await getSession();
      
      if (!session) {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 }
        );
      }

      if (requiredRole && !atLeast(session.user.role, requiredRole)) {
        return NextResponse.json(
          { success: false, error: "Forbidden" },
          { status: 403 }
        );
      }

      return await handler(request, session);
    } catch (error) {
      console.error("Auth middleware error:", error);
      return NextResponse.json(
        { success: false, error: "Internal server error" },
        { status: 500 }
      );
    }
  };
}

// Error handling wrapper
export function withErrorHandling(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    try {
      return await handler(request);
    } catch (error) {
      console.error("API Error:", error);
      return NextResponse.json(
        { 
          success: false, 
          error: "Internal server error",
          message: error instanceof Error ? error.message : "Unknown error"
        },
        { status: 500 }
      );
    }
  };
}

// Standard success response
export function successResponse<T>(
  data: T,
  message?: string,
  pagination?: ApiResponse["pagination"]
): NextResponse {
  const response: ApiResponse<T> = {
    success: true,
    data,
    ...(message && { message }),
    ...(pagination && { pagination })
  };

  return NextResponse.json(response);
}

// Standard error response
export function errorResponse(
  error: string,
  status: number = 400
): NextResponse {
  return NextResponse.json(
    { success: false, error },
    { status }
  );
}

// Validation helper
export function validateRequiredFields(
  data: Record<string, any>,
  requiredFields: string[]
): string[] {
  return requiredFields.filter(field => 
    !data[field] || (typeof data[field] === 'string' && data[field].trim() === '')
  );
}

// Pagination helper
export function getPaginationParams(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10")));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

// Cache headers helper
export function setCacheHeaders(response: NextResponse, maxAge: number = 300) {
  response.headers.set('Cache-Control', `public, max-age=${maxAge}, stale-while-revalidate=${maxAge * 2}`);
  response.headers.set('ETag', `"${Date.now()}"`);
  return response;
}

// No cache headers helper
export function setNoCacheHeaders(response: NextResponse) {
  response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  return response;
}