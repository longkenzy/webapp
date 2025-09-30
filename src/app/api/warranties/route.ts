import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { WarrantyStatus } from "@prisma/client";
import { createCaseCreatedNotification, getAdminUsers } from "@/lib/notifications";
import { sendCaseCreatedTelegram } from "@/lib/telegram";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    
    const {
      title,
      description,
      handlerId,
      warrantyType,
      warrantyTypeId,
      customerId,
      customerName,
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

    console.log('=== API Create Warranty ===');
    console.log('Body received:', body);

    console.log('WarrantyTypeId:', warrantyTypeId);
    console.log('WarrantyType:', warrantyType);

    // Validate required fields
    if (!title || !description || !handlerId || !customerName) {
      console.log('Missing required fields:', { title, description, handlerId, customerName });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate end date (only if both dates exist) - allow any past/future dates
    if (startDate && endDate) {
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      
      console.log("=== API Warranty Date Validation (Create) ===");
      console.log("Start Date:", startDateObj);
      console.log("End Date:", endDateObj);
      console.log("End <= Start?", endDateObj <= startDateObj);
      
      if (endDateObj <= startDateObj) {
        return NextResponse.json({ 
          error: "Ngày kết thúc phải lớn hơn ngày bắt đầu" 
        }, { status: 400 });
      }
    }

    // Find warranty type by ID or name
    let warrantyTypeRecord = null;
    if (warrantyTypeId) {
      // Try to find by ID first
      warrantyTypeRecord = await db.warrantyType.findUnique({ 
        where: { id: warrantyTypeId } 
      });
      console.log('Warranty type found by ID:', warrantyTypeRecord?.name);
    } else if (warrantyType) {
      // Fallback to finding by name
      warrantyTypeRecord = await db.warrantyType.findFirst({ 
        where: { name: warrantyType } 
      });
      console.log('Warranty type found by name:', warrantyTypeRecord?.name);
    }

    if (!warrantyTypeRecord) {
      console.log('Warranty type not found. WarrantyTypeId:', warrantyTypeId, 'WarrantyType:', warrantyType);
      return NextResponse.json(
        { error: "Invalid warranty type" },
        { status: 400 }
      );
    }

    // Get default employee for reporter
    const defaultEmployee = await db.employee.findFirst();

    if (!defaultEmployee) {
      return NextResponse.json(
        { error: 'No employees found' },
        { status: 400 }
      );
    }

    // Create new warranty in database
    const newWarranty = await db.warranty.create({
      data: {
        title,
        description,
        reporterId: defaultEmployee.id,
        handlerId,
        warrantyTypeId: warrantyTypeRecord.id,
        customerId: customerId || null,
        customerName,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        status: status || WarrantyStatus.RECEIVED,
        notes: notes || null,
        crmReferenceCode: crmReferenceCode || null, // Thêm Mã CRM
        // User assessment fields
        userDifficultyLevel: userDifficultyLevel ? parseInt(userDifficultyLevel) : null,
        userEstimatedTime: userEstimatedTime ? parseInt(userEstimatedTime) : null,
        userImpactLevel: userImpactLevel ? parseInt(userImpactLevel) : null,
        userUrgencyLevel: userUrgencyLevel ? parseInt(userUrgencyLevel) : null,
        userFormScore: userFormScore ? parseInt(userFormScore) : null,
        userAssessmentDate: new Date()
      },
      include: {
        reporter: { select: { id: true, fullName: true, position: true } },
        handler: { select: { id: true, fullName: true, position: true, avatar: true } },
        warrantyType: { select: { id: true, name: true } },
        customer: { select: { id: true, fullCompanyName: true, shortName: true } }
      }
    });

    // Send notifications in parallel (non-blocking)
    Promise.all([
      // Create notifications for admin users
      (async () => {
        try {
          const adminUsers = await getAdminUsers();
          const requesterName = defaultEmployee.fullName;
          
          // Create all notifications in parallel
          await Promise.all(
            adminUsers.map(admin =>
              createCaseCreatedNotification(
                'warranty',
                newWarranty.id,
                newWarranty.title,
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
            caseId: newWarranty.id,
            caseType: 'Case bảo hành',
            caseTitle: newWarranty.title,
            caseDescription: newWarranty.description,
            requesterName: defaultEmployee.fullName,
            requesterEmail: defaultEmployee.companyEmail,
            handlerName: newWarranty.handler.fullName,
            createdAt: new Date().toLocaleString('vi-VN')
          });
          console.log('✅ Telegram notification sent successfully');
        } catch (telegramError) {
          console.error('❌ Error sending Telegram notification:', telegramError);
        }
      })()
    ]).catch(err => console.error('Background notification error:', err));

    return NextResponse.json({
      message: "Warranty created successfully",
      data: newWarranty
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating warranty:", error);
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Get warranties with pagination
    const [warranties, total] = await Promise.all([
      db.warranty.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          reporter: { 
            select: { 
              id: true, 
              fullName: true, 
              position: true, 
              department: true,
              avatar: true
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
          },
          warrantyType: { 
            select: { 
              id: true, 
              name: true 
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
          }
        }
      }),
      db.warranty.count()
    ]);
    
    const response = NextResponse.json({
      data: warranties,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

    // Add caching headers for better performance
    response.headers.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
    return response;

  } catch (error) {
    console.error("Error fetching warranties:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}