import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { InternalCaseStatus } from "@prisma/client";
import { createCaseCreatedNotification, getAdminUsers } from "@/lib/notifications";
import { sendCaseCreatedTelegram } from "@/lib/telegram";

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
        status: status || InternalCaseStatus.RECEIVED,
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
            department: true,
            avatar: true
          }
        }
      }
    });

    console.log("Internal case created successfully:", internalCase);

    // Send notifications in parallel (non-blocking)
    Promise.all([
      // Create notifications for admin users
      (async () => {
        try {
          const adminUsers = await getAdminUsers();
          const requesterName = requester.fullName;
          
          // Create all notifications in parallel
          await Promise.all(
            adminUsers.map(admin =>
              createCaseCreatedNotification(
                'internal',
                internalCase.id,
                internalCase.title,
                requesterName,
                admin.id
              )
            )
          );
          console.log(`Notifications sent to ${adminUsers.length} admin users`);
        } catch (notificationError) {
          console.error('Error creating notifications:', notificationError);
        }
      })(),
      
      // Send Telegram notification to admin
      (async () => {
        try {
          await sendCaseCreatedTelegram({
            caseId: internalCase.id,
            caseType: internalCase.caseType,
            caseTitle: internalCase.title,
            caseDescription: internalCase.description,
            requesterName: requester.fullName,
            requesterEmail: requester.companyEmail,
            handlerName: handler.fullName,
            createdAt: new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
          });
          console.log('✅ Telegram notification sent successfully');
        } catch (telegramError) {
          console.error('❌ Error sending Telegram notification:', telegramError);
        }
      })()
    ]).catch(err => console.error('Background notification error:', err));

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
    const limit = parseInt(searchParams.get("limit") || "50"); // Increased default limit
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const requesterId = searchParams.get("requesterId");
    const handlerId = searchParams.get("handlerId");
    const caseType = searchParams.get("caseType");

    const skip = (page - 1) * limit;

    // Build where clause with better filtering
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (requesterId) where.requesterId = requesterId;
    if (handlerId) where.handlerId = handlerId;
    if (caseType) where.caseType = caseType;
    
    // Add search functionality
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { requester: { fullName: { contains: search, mode: 'insensitive' } } },
        { handler: { fullName: { contains: search, mode: 'insensitive' } } }
      ];
    }

    // Get internal cases with pagination - optimized query
    const [internalCases, total] = await Promise.all([
      db.internalCase.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" }, // Show newest first
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

    // Disable caching to ensure fresh data after updates
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;

  } catch (error) {
    console.error("Error fetching internal cases:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
