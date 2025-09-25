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
      // User assessment fields
      userDifficultyLevel,
      userEstimatedTime,
      userImpactLevel,
      userUrgencyLevel,
      userFormScore
    } = body;

    console.log('=== API Create Warranty ===');
    console.log('Body received:', body);

    // Use warrantyTypeId if provided, otherwise use warrantyType
    const warrantyTypeToUse = warrantyTypeId || warrantyType;

    // Validate required fields
    if (!title || !description || !handlerId || !warrantyTypeToUse || !customerName) {
      console.log('Missing required fields:', { title, description, handlerId, warrantyTypeToUse, customerName });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate end date
    if (endDate && new Date(endDate) <= new Date(startDate)) {
      return NextResponse.json({ 
        error: "Ngày kết thúc phải lớn hơn ngày bắt đầu" 
      }, { status: 400 });
    }

    // Get warranty type and default employee in parallel
    const [warrantyTypeRecord, defaultEmployee] = await Promise.all([
      db.warrantyType.findFirst({ where: { name: warrantyTypeToUse } }),
      db.employee.findFirst()
    ]);

    if (!warrantyTypeRecord) {
      return NextResponse.json(
        { error: "Invalid warranty type" },
        { status: 400 }
      );
    }

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
        handler: { select: { id: true, fullName: true, position: true } },
        warrantyType: { select: { id: true, name: true } },
        customer: { select: { id: true, fullCompanyName: true, shortName: true } }
      }
    });

    // Create notifications for admin users
    try {
      const adminUsers = await getAdminUsers();
      const requesterName = defaultEmployee.fullName;
      
      for (const admin of adminUsers) {
        await createCaseCreatedNotification(
          'warranty',
          newWarranty.id,
          newWarranty.title,
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
      // Don't fail the case creation if Telegram fails
    }

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

    // Get all warranties from database (client-side pagination)
    const warranties = await db.warranty.findMany({
      orderBy: { createdAt: 'desc' },
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
    });
    
    const response = NextResponse.json({
      data: warranties
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