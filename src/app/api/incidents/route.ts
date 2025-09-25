import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { IncidentStatus } from "@prisma/client";
import { createCaseCreatedNotification, getAdminUsers } from "@/lib/notifications";
import { sendCaseCreatedTelegram } from "@/lib/telegram";

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
    console.log("Incident type received:", body.incidentType);
    
    const {
      title,
      description,
      customerName,
      handlerId,
      incidentType,
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
    if (!title || !description || !customerName || !handlerId || !incidentType) {
      console.log("Missing required fields:", { title, description, customerName, handlerId, incidentType });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Find or create incident type
    let incidentTypeId;
    try {
      // First, try to find existing incident type by name
      let incidentTypeRecord = await db.incidentType.findUnique({
        where: { name: incidentType }
      });

      // If not found, create new incident type
      if (!incidentTypeRecord) {
        incidentTypeRecord = await db.incidentType.create({
          data: {
            name: incidentType,
            description: null,
            isActive: true
          }
        });
      }

      incidentTypeId = incidentTypeRecord.id;
    } catch (error) {
      console.error("Error handling incident type:", error);
      return NextResponse.json(
        { error: "Error processing incident type" },
        { status: 500 }
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

    // Validate handler exists

    console.log("Checking handler:", handlerId);
    const handler = await db.employee.findUnique({
      where: { id: handlerId }
    });
    console.log("Handler found:", handler);

    if (!handler) {
      console.log("Handler not found");
      return NextResponse.json(
        { error: "Handler not found" },
        { status: 400 }
      );
    }

    // Create incident
    console.log("Creating incident with data:", {
      title,
      description,
      customerName,
      handlerId,
      incidentTypeId,
      customerId,
      startDate,
      endDate,
      status,
      notes
    });

    const incident = await db.incident.create({
      data: {
        title,
        description,
        customerName,
        reporterId: null,
        handlerId,
        incidentTypeId,
        customerId: customerId || null,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        status: status || IncidentStatus.RECEIVED,
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
        },
        customer: {
          select: {
            id: true,
            fullCompanyName: true,
            shortName: true,
            contactPerson: true,
            contactPhone: true
          }
        },
        incidentType: {
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      }
    });

    console.log("Incident created successfully:", incident);

    // Create notifications for admin users
    try {
      const adminUsers = await getAdminUsers();
      const requesterName = handler.fullName; // Using handler as reporter for incidents
      
      for (const admin of adminUsers) {
        await createCaseCreatedNotification(
          'incident',
          incident.id,
          incident.title,
          requesterName,
          admin.id
        );
      }
      console.log(`Notifications sent to ${adminUsers.length} admin users`);
    } catch (notificationError) {
      console.error('Error creating notifications:', notificationError);
      // Don't fail the case creation if notifications fail
    }

    // Send Telegram notification to admin
    try {
      await sendCaseCreatedTelegram({
        caseId: incident.id,
        caseType: 'Case sự cố',
        caseTitle: incident.title,
        caseDescription: incident.description,
        requesterName: handler.fullName,
        requesterEmail: handler.companyEmail,
        handlerName: incident.handler.fullName,
        createdAt: new Date().toLocaleString('vi-VN')
      });
      console.log('✅ Telegram notification sent successfully');
    } catch (telegramError) {
      console.error('❌ Error sending Telegram notification:', telegramError);
      // Don't fail the case creation if Telegram fails
    }

    // Transform the created incident to match frontend interface
    console.log("Transforming created incident...");
    let transformedIncident;
    try {
      if (!incident.incidentType || !incident.incidentType.name) {
        console.error("Created incident missing incidentType:", incident.id);
        throw new Error(`Created incident ${incident.id} is missing incidentType`);
      }
      
      transformedIncident = {
        ...incident,
        incidentType: incident.incidentType.name, // Convert incidentType object to string
        startDate: incident.startDate.toISOString(),
        endDate: incident.endDate?.toISOString() || null,
        createdAt: incident.createdAt.toISOString(),
        updatedAt: incident.updatedAt.toISOString(),
        userAssessmentDate: incident.userAssessmentDate?.toISOString() || null,
        adminAssessmentDate: incident.adminAssessmentDate?.toISOString() || null
      };
      console.log("Created incident transformation successful");
    } catch (transformError) {
      console.error("Created incident transformation error:", transformError);
      throw transformError;
    }

    return NextResponse.json({
      message: "Incident created successfully",
      data: transformedIncident
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
    console.log("=== GET Incidents API Called ===");
    console.log("Request headers:", Object.fromEntries(request.headers.entries()));
    
    // Temporarily disable authentication for testing in production
    // const session = await getSession();
    // console.log("Session found:", session ? "Yes" : "No");
    // console.log("Session details:", session);
    
    // if (!session) {
    //   console.log("No session found, returning 401");
    //   return NextResponse.json({ 
    //     error: "Unauthorized",
    //     debug: "No session found. Please ensure you are logged in."
    //   }, { status: 401 });
    // }
    
    // console.log("User role:", session.user?.role);
    // console.log("User ID:", session.user?.id);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");
    const incidentType = searchParams.get("incidentType");
    const customerId = searchParams.get("customerId");

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (incidentType) {
      // Find incident type by name and use its ID
      try {
        const incidentTypeRecord = await db.incidentType.findUnique({
          where: { name: incidentType }
        });
        if (incidentTypeRecord) {
          where.incidentTypeId = incidentTypeRecord.id;
        }
      } catch (error) {
        console.error("Error finding incident type:", error);
        // Fallback to old incidentType field if IncidentType table doesn't exist
        where.incidentType = incidentType;
      }
    }
    if (customerId) where.customerId = customerId;

    console.log("Query parameters:", { page, limit, status, incidentType, customerId });
    console.log("Where clause:", where);

    // Get incidents with pagination
    console.log("Fetching incidents from database...");
    let incidents, total;
    try {
      [incidents, total] = await Promise.all([
        db.incident.findMany({
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
            },
            customer: {
              select: {
                id: true,
                fullCompanyName: true,
                shortName: true,
                contactPerson: true,
                contactPhone: true
              }
            },
            incidentType: {
              select: {
                id: true,
                name: true,
                description: true
              }
            }
          }
        }),
        db.incident.count({ where })
      ]);
      console.log("Database query successful");
    } catch (dbError) {
      console.error("Database query error:", dbError);
      throw dbError;
    }
    
    // Transform incidents to match frontend interface
    console.log("Transforming incidents data...");
    let transformedIncidents;
    try {
      transformedIncidents = incidents.map(incident => {
        if (!incident.incidentType || !incident.incidentType.name) {
          console.error("Incident missing incidentType:", incident.id);
          throw new Error(`Incident ${incident.id} is missing incidentType`);
        }
        return {
          ...incident,
          incidentType: incident.incidentType.name, // Convert incidentType object to string
          startDate: incident.startDate.toISOString(),
          endDate: incident.endDate?.toISOString() || null,
          createdAt: incident.createdAt.toISOString(),
          updatedAt: incident.updatedAt.toISOString(),
          userAssessmentDate: incident.userAssessmentDate?.toISOString() || null,
          adminAssessmentDate: incident.adminAssessmentDate?.toISOString() || null
        };
      });
      console.log("Data transformation successful");
    } catch (transformError) {
      console.error("Data transformation error:", transformError);
      throw transformError;
    }
    
    console.log("Incidents fetched:", incidents.length);
    console.log("Total count:", total);

    const response = NextResponse.json({
      data: transformedIncidents,
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
    console.error("=== ERROR in GET Incidents API ===");
    console.error("Error type:", typeof error);
    console.error("Error message:", error instanceof Error ? error.message : String(error));
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack");
    console.error("Full error object:", error);
    
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
