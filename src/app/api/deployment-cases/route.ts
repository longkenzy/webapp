import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { createCaseCreatedNotification, getAdminUsers } from "@/lib/notifications";

export async function POST(request: NextRequest) {
  try {
    console.log("=== Deployment Case API Called ===");
    
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
      deploymentTypeId,
      customerName,
      customerId,
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
    if (!title || !description || !reporterId || !handlerId || !deploymentTypeId || !customerName) {
      console.log("Missing required fields:", { title, description, reporterId, handlerId, deploymentTypeId, customerName });
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
    let reporter = await db.employee.findUnique({
      where: { id: reporterId }
    });
    
    // If not found in employee, try to find user and create/find employee
    if (!reporter) {
      const user = await db.user.findUnique({
        where: { id: reporterId },
        include: { employee: true }
      });
      
      if (user?.employee) {
        reporter = user.employee;
      } else if (user) {
        // Use default employee if user doesn't have employee record
        reporter = await db.employee.findFirst();
        if (!reporter) {
          return NextResponse.json(
            { error: 'No employees found in database' },
            { status: 400 }
          );
        }
      }
    }
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

    // Create deployment case
    console.log("Creating deployment case with data:", {
      title,
      description,
      reporterId,
      handlerId,
      deploymentTypeId,
      customerName,
      customerId,
      startDate,
      endDate,
      status,
      notes
    });

    const deploymentCase = await db.deploymentCase.create({
      data: {
        title,
        description,
        reporterId: reporter.id,
        handlerId: handler.id,
        deploymentTypeId,
        customerName,
        customerId: customerId || null,
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
        reporter: {
          select: {
            id: true,
            fullName: true,
            position: true,
            department: true,
            companyEmail: true
          }
        },
        handler: {
          select: {
            id: true,
            fullName: true,
            position: true,
            department: true,
            companyEmail: true
          }
        },
        deploymentType: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    console.log("Deployment case created successfully:", deploymentCase);

    // Create notifications for admin users
    try {
      const adminUsers = await getAdminUsers();
      const reporterName = reporter.fullName;
      
      for (const admin of adminUsers) {
        await createCaseCreatedNotification(
          'deployment',
          deploymentCase.id,
          deploymentCase.title,
          reporterName,
          admin.id
        );
      }
      console.log(`Notifications sent to ${adminUsers.length} admin users`);
    } catch (notificationError) {
      console.error('Error creating notifications:', notificationError);
      // Don't fail the case creation if notifications fail
    }

    return NextResponse.json({
      message: "Deployment case created successfully",
      data: deploymentCase
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating deployment case:", error);
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

    // Get deployment cases with pagination
    const [deploymentCases, total] = await Promise.all([
      db.deploymentCase.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          reporter: {
            select: {
              id: true,
              fullName: true,
              position: true,
              department: true,
              companyEmail: true
            }
          },
          handler: {
            select: {
              id: true,
              fullName: true,
              position: true,
              department: true,
              companyEmail: true
            }
          },
          deploymentType: {
            select: {
              id: true,
              name: true
            }
          },
          customer: {
            select: {
              id: true,
              shortName: true,
              fullCompanyName: true,
              contactPerson: true
            }
          }
        }
      }),
      db.deploymentCase.count({ where })
    ]);

    const response = NextResponse.json({
      data: deploymentCases,
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
    console.error("Error fetching deployment cases:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
