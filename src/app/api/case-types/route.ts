import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

// GET - Lấy danh sách loại case
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const caseTypes = await db.caseType.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const response = NextResponse.json({
      success: true,
      data: caseTypes
    });

    // Check if client requests no-cache
    const clientCacheControl = request.headers.get('cache-control');
    if (clientCacheControl?.includes('no-cache')) {
      response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    } else {
      // Add caching headers for case types (they don't change often)
      response.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
      response.headers.set('ETag', `"${Date.now()}"`);
    }
    
    return response;

  } catch (error) {
    console.error("Error fetching case types:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// POST - Tạo loại case mới
export async function POST(request: NextRequest) {
  try {
    console.log("=== Create Case Type API Called ===");
    
    const session = await getSession();
    if (!session) {
      console.log("No session found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log("Session found:", session.user?.email);

    const body = await request.json();
    console.log("Request body:", body);
    
    const {
      name,
      isActive = true
    } = body;

    // Validate required fields
    if (!name) {
      console.log("Missing required fields:", { name });
      return NextResponse.json(
        { error: "Tên loại case là bắt buộc" },
        { status: 400 }
      );
    }

    // Check if case type name already exists
    const existingCaseType = await db.caseType.findFirst({
      where: { name }
    });

    if (existingCaseType) {
      console.log("Case type name already exists:", name);
      return NextResponse.json(
        { error: "Tên loại case đã tồn tại" },
        { status: 400 }
      );
    }

    // Create case type
    const caseType = await db.caseType.create({
      data: {
        name,
        isActive: Boolean(isActive)
      }
    });

    console.log("Case type created successfully:", caseType);

    return NextResponse.json({
      success: true,
      message: "Loại case đã được tạo thành công",
      data: caseType
    });

  } catch (error) {
    console.error("Error creating case type:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
