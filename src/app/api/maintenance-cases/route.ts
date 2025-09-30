import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { MaintenanceCaseStatus } from '@prisma/client';
import { createCaseCreatedNotification, getAdminUsers } from '@/lib/notifications';
import { sendCaseCreatedTelegram } from '@/lib/telegram';

export async function GET(request: NextRequest) {
  try {
    // Temporarily disable authentication for testing in production
    console.log('Maintenance cases API called');

    const maintenanceCases = await db.maintenanceCase.findMany({
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
        maintenanceCaseType: {
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      data: maintenanceCases
    }, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=60' // Cache for 1 minute
      }
    });
  } catch (error) {
    console.error('Error fetching maintenance cases:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch maintenance cases',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Temporarily disable authentication for testing
    // const session = await getServerSession(authOptions);
    
    // if (!session?.user?.id) {
    //   return NextResponse.json(
    //     { error: 'Unauthorized' },
    //     { status: 401 }
    //   );
    // }

    const body = await request.json();
    const { 
      title, 
      description, 
      maintenanceTypeId,
      handlerId, 
      customerName, 
      customerId, 
      startDate, 
      endDate, 
      status, 
      notes,
      crmReferenceCode, // Thêm trường Mã CRM
      userDifficultyLevel,
      userEstimatedTime,
      userImpactLevel,
      userUrgencyLevel,
      userFormScore
    } = body;

    // Validate required fields
    if (!title || !description || !handlerId || !customerName || !startDate || !maintenanceTypeId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get first employee as default reporter (for now)
    const defaultEmployee = await db.employee.findFirst();
    if (!defaultEmployee) {
      return NextResponse.json(
        { error: 'No employees found' },
        { status: 400 }
      );
    }

    const newMaintenanceCase = await db.maintenanceCase.create({
      data: {
        title,
        description,
        reporterId: defaultEmployee.id,
        handlerId,
        customerName,
        customerId: customerId || null,
        maintenanceType: 'PREVENTIVE', // Default enum value - this field should be set based on business logic
        maintenanceTypeId: maintenanceTypeId,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        notes: notes || '',
        status: status || MaintenanceCaseStatus.RECEIVED,
        crmReferenceCode: crmReferenceCode || null, // Thêm Mã CRM
        // User evaluation data - convert strings to integers
        userDifficultyLevel: userDifficultyLevel ? parseInt(userDifficultyLevel) : null,
        userEstimatedTime: userEstimatedTime ? parseInt(userEstimatedTime) : null,
        userImpactLevel: userImpactLevel ? parseInt(userImpactLevel) : null,
        userUrgencyLevel: userUrgencyLevel ? parseInt(userUrgencyLevel) : null,
        userFormScore: userFormScore ? parseInt(userFormScore) : null
      },
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
        maintenanceCaseType: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Create notifications for admin users
    try {
      const adminUsers = await getAdminUsers();
      const requesterName = defaultEmployee.fullName;
      
      for (const admin of adminUsers) {
        await createCaseCreatedNotification(
          'maintenance',
          newMaintenanceCase.id,
          newMaintenanceCase.title,
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
        caseId: newMaintenanceCase.id,
        caseType: 'Case bảo trì',
        caseTitle: newMaintenanceCase.title,
        caseDescription: newMaintenanceCase.description,
        requesterName: defaultEmployee.fullName,
        requesterEmail: defaultEmployee.companyEmail,
        handlerName: newMaintenanceCase.handler.fullName,
        createdAt: new Date().toLocaleString('vi-VN')
      });
      console.log('✅ Telegram notification sent successfully');
    } catch (telegramError) {
      console.error('❌ Error sending Telegram notification:', telegramError);
      // Don't fail the case creation if Telegram fails
    }

    return NextResponse.json({
      success: true,
      message: 'Maintenance case created successfully',
      data: newMaintenanceCase
    }, { 
      status: 201,
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      }
    });
  } catch (error) {
    console.error('Error creating maintenance case:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create maintenance case',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
