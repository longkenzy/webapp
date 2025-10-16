import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { DeploymentCaseStatus } from "@prisma/client";
import { createCaseCreatedNotification, getAdminUsers } from "@/lib/notifications";
import { convertToVietnamTime } from "@/lib/date-utils";
import { validateCaseDates, processUserAssessment } from "@/lib/case-helpers";

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
      crmReferenceCode, // Thêm trường Mã CRM
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

    // Validate startDate is provided and valid
    if (!startDate) {
      console.log("Missing startDate");
      return NextResponse.json(
        { error: "Ngày bắt đầu là bắt buộc" },
        { status: 400 }
      );
    }

    // Validate end date using dayjs helper
    const dateValidationError = validateCaseDates(startDate, endDate);
    if (dateValidationError) {
      console.log("Invalid date:", dateValidationError);
      return NextResponse.json({ 
        error: dateValidationError 
      }, { status: 400 });
    }
    
    if (startDate && endDate) {
      console.log("=== API Deployment Date Validation (Create) ===");
      console.log("Start Date:", startDate);
      console.log("End Date:", endDate);
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
        startDate: new Date(startDate), // startDate is validated above, no fallback needed
        endDate: endDate ? new Date(endDate) : null,
        status: status || DeploymentCaseStatus.RECEIVED,
        notes: notes || null,
        crmReferenceCode: crmReferenceCode || null, // Thêm Mã CRM
        // User assessment fields
        ...processUserAssessment(body)
      },
      include: {
        reporter: {
          select: {
            id: true,
            fullName: true,
            position: true,
            department: true,
            companyEmail: true,
            avatar: true
          }
        },
        handler: {
          select: {
            id: true,
            fullName: true,
            position: true,
            department: true,
            companyEmail: true,
            avatar: true
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

    // Send notifications in parallel (non-blocking)
    Promise.all([
      // Create notifications for admin users
      (async () => {
        try {
          const adminUsers = await getAdminUsers();
          const reporterName = reporter.fullName;
          
          // Create all notifications in parallel
          await Promise.all(
            adminUsers.map(admin =>
              createCaseCreatedNotification(
                'deployment',
                deploymentCase.id,
                deploymentCase.title,
                reporterName,
                admin.id
              )
            )
          );
          console.log(`Notifications sent to ${adminUsers.length} admin users`);
        } catch (notificationError) {
          console.error('Error creating notifications:', notificationError);
        }
      })()
    ]).catch(err => console.error('Background notification error:', err));

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

    // Disable caching to ensure fresh data after updates
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;

  } catch (error) {
    console.error("Error fetching deployment cases:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
