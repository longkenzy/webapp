import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    console.log("=== Incident API Called ===");
    
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
      reporterId,
      handlerId,
      incidentType,
      priority,
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
    if (!title || !description || !reporterId || !handlerId || !incidentType) {
      console.log("Missing required fields:", { title, description, reporterId, handlerId, incidentType });
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

    // Validate reporter and handler exist
    console.log("Checking reporter:", reporterId);
    const reporter = await db.employee.findUnique({
      where: { id: reporterId }
    });
    console.log("Reporter found:", reporter);

    console.log("Checking handler:", handlerId);
    const handler = await db.employee.findUnique({
      where: { id: handlerId }
    });
    console.log("Handler found:", handler);

    if (!reporter || !handler) {
      console.log("Reporter or handler not found");
      return NextResponse.json(
        { error: "Reporter or handler not found" },
        { status: 400 }
      );
    }

    // Create incident
    console.log("Creating incident with data:", {
      title,
      description,
      reporterId,
      handlerId,
      incidentType,
      priority,
      startDate,
      endDate,
      status,
      notes
    });

    const incident = await db.incident.create({
      data: {
        title,
        description,
        reporterId,
        handlerId,
        incidentType,
        priority: priority || "MEDIUM",
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        status: status || "REPORTED",
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
        reporter: {
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

    console.log("Incident created successfully:", incident);

    return NextResponse.json({
      message: "Incident created successfully",
      data: incident
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating incident:", error);
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
    const priority = searchParams.get("priority");
    const incidentType = searchParams.get("incidentType");

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (incidentType) where.incidentType = incidentType;

    // Get incidents with pagination
    const [incidents, total] = await Promise.all([
      db.incident.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "asc" },
        include: {
          reporter: {
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
      db.incident.count({ where })
    ]);

    const response = NextResponse.json({
      data: incidents,
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
    console.error("Error fetching incidents:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
