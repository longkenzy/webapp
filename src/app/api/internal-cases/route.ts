import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    console.log("=== Internal Case API Called ===");
    
    const session = await getSession();
    if (!session) {
      console.log("No session found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log("Session found:", session.user?.email);

    const body = await request.json();
    console.log("Request body:", body);
    
    const {
      title,
      description,
      requesterId,
      handlerId,
      caseType,
      form,
      startDate,
      endDate,
      status,
      notes,
      // User assessment fields
      userDifficultyLevel,
      userEstimatedTime,
      userImpactLevel,
      userUrgencyLevel,
      userFormScore
    } = body;

    // Validate required fields
    if (!title || !description || !requesterId || !handlerId || !caseType) {
      console.log("Missing required fields:", { title, description, requesterId, handlerId, caseType });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate end date
    if (endDate) {
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      
      if (endDateObj <= startDateObj) {
        console.log("Invalid end date:", { startDate, endDate });
        return NextResponse.json({ 
          error: "Ngày kết thúc phải lớn hơn ngày bắt đầu" 
        }, { status: 400 });
      }
    }

    // Validate requester and handler exist
    console.log("Checking requester:", requesterId);
    const requester = await db.employee.findUnique({
      where: { id: requesterId }
    });
    console.log("Requester found:", requester);

    console.log("Checking handler:", handlerId);
    const handler = await db.employee.findUnique({
      where: { id: handlerId }
    });
    console.log("Handler found:", handler);

    if (!requester || !handler) {
      console.log("Requester or handler not found");
      return NextResponse.json(
        { error: "Requester or handler not found" },
        { status: 400 }
      );
    }

    // Create internal case
    console.log("Creating internal case with data:", {
      title,
      description,
      requesterId,
      handlerId,
      caseType,
      form,
      startDate,
      endDate,
      status,
      notes
    });

    const internalCase = await db.internalCase.create({
      data: {
        title,
        description,
        requesterId,
        handlerId,
        caseType,
        form: form || "Onsite",
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        status: status || "RECEIVED",
        notes: notes || null,
        // User assessment fields
        userDifficultyLevel: userDifficultyLevel !== undefined && userDifficultyLevel !== null ? parseInt(userDifficultyLevel) : null,
        userEstimatedTime: userEstimatedTime !== undefined && userEstimatedTime !== null ? parseInt(userEstimatedTime) : null,
        userImpactLevel: userImpactLevel !== undefined && userImpactLevel !== null ? parseInt(userImpactLevel) : null,
        userUrgencyLevel: userUrgencyLevel !== undefined && userUrgencyLevel !== null ? parseInt(userUrgencyLevel) : null,
        userFormScore: userFormScore !== undefined && userFormScore !== null ? parseInt(userFormScore) : null,
        userAssessmentDate: new Date()
      },
      include: {
        requester: {
          select: {
            id: true,
            fullName: true,
            position: true,
            department: true
          }
        },
        handler: {
          select: {
            id: true,
            fullName: true,
            position: true,
            department: true
          }
        }
      }
    });

    console.log("Internal case created successfully:", internalCase);

    return NextResponse.json({
      message: "Internal case created successfully",
      data: internalCase
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating internal case:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    // Get internal cases with pagination
    const [internalCases, total] = await Promise.all([
      db.internalCase.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "asc" },
        include: {
          requester: {
            select: {
              id: true,
              fullName: true,
              position: true,
              department: true
            }
          },
          handler: {
            select: {
              id: true,
              fullName: true,
              position: true,
              department: true
            }
          }
        }
      }),
      db.internalCase.count({ where })
    ]);

    const response = NextResponse.json({
      data: internalCases,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

    // Add caching headers
    response.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    response.headers.set('ETag', `"${Date.now()}"`);
    
    return response;

  } catch (error) {
    console.error("Error fetching internal cases:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
