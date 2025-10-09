import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { DeliveryCaseStatus } from '@prisma/client';
import { createCaseCreatedNotification, getAdminUsers } from '@/lib/notifications';
import { convertToVietnamTime } from "@/lib/date-utils";
import { validateCaseDates } from "@/lib/case-helpers";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);

interface Product {
  name: string;
  code?: string;
  quantity: number;
  serialNumber?: string;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');
    const receiverId = searchParams.get('receiverId');
    const customerId = searchParams.get('customerId');
    const status = searchParams.get('status');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { requester: { fullName: { contains: search, mode: 'insensitive' } } },
        { handler: { fullName: { contains: search, mode: 'insensitive' } } },
        { customer: { shortName: { contains: search, mode: 'insensitive' } } }
      ];
    }

    if (receiverId) {
      where.handlerId = receiverId;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (status) {
      where.status = status;
    }

    // Fetch delivery cases from new DeliveryCase model
    const deliveryCases = await db.deliveryCase.findMany({
      where: {
        ...where
      },
      include: {
        requester: {
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
        customer: {
          select: {
            id: true,
            shortName: true,
            fullCompanyName: true,
            contactPerson: true,
            contactPhone: true
          }
        },
        products: {
          select: {
            id: true,
            name: true,
            code: true,
            quantity: true,
            serialNumber: true,
            inProgressAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    });

    // Get total count for pagination
    const total = await db.deliveryCase.count({
      where: {
        ...where
      }
    });

    // Map customer -> supplier to preserve existing frontend expectations
    const mappedCases = deliveryCases.map((c: any) => ({
      ...c,
      supplier: c.customer,
    }));

    const response = NextResponse.json({
      deliveryCases: mappedCases,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
    // Disable caching to ensure fresh data after updates
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;

  } catch (error) {
    console.error('Error fetching delivery cases:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const {
      title,
      description,
      form,
      startDate,
      endDate,
      status,
      notes,
      crmReferenceCode,
      requesterId,
      handlerId,
      customerId,
      userDifficultyLevel,
      userEstimatedTime,
      userImpactLevel,
      userUrgencyLevel,
      userFormScore,
      userAssessmentDate,
      products
    } = body;

    // Validate required fields
    if (!title || !startDate || !requesterId || !handlerId || !customerId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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
      console.log("=== API Delivery Date Validation (Create) ===");
      console.log("Start Date:", startDate);
      console.log("End Date:", endDate);
    }

    // Validate employees and partner existence
    const [employee, partner] = await Promise.all([
      db.employee.findUnique({ where: { id: requesterId } }),
      db.partner.findUnique({ where: { id: customerId } })
    ]);

    if (!employee) {
      return NextResponse.json(
        { error: `Employee not found with ID: ${requesterId}` },
        { status: 400 }
      );
    }

    if (!partner) {
      return NextResponse.json(
        { error: `Customer not found with ID: ${customerId}` },
        { status: 400 }
      );
    }

    // Create delivery case
    const deliveryCase = await db.deliveryCase.create({
      data: {
        title,
        description,
        form: 'Giao hàng',
        startDate: convertToVietnamTime(startDate),
        endDate: endDate ? convertToVietnamTime(endDate) : null,
        status: status || DeliveryCaseStatus.RECEIVED,
        notes,
        crmReferenceCode: crmReferenceCode || null,
        requesterId,
        handlerId,
        customerId: customerId,
        userDifficultyLevel: userDifficultyLevel ? parseInt(userDifficultyLevel) : null,
        userEstimatedTime: userEstimatedTime ? parseInt(userEstimatedTime) : null,
        userImpactLevel: userImpactLevel ? parseInt(userImpactLevel) : null,
        userUrgencyLevel: userUrgencyLevel ? parseInt(userUrgencyLevel) : null,
        userFormScore: userFormScore ? parseInt(userFormScore) : null,
        userAssessmentDate: userAssessmentDate ? dayjs(userAssessmentDate).tz('Asia/Ho_Chi_Minh').toDate() : null,
        products: products && products.length > 0 ? {
          create: products.map((product: Product) => ({
            name: product.name,
            code: product.code || null,
            quantity: product.quantity,
            serialNumber: product.serialNumber || null
          }))
        } : undefined
      },
      include: {
        requester: {
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
        customer: {
          select: {
            id: true,
            shortName: true,
            fullCompanyName: true,
            contactPerson: true,
            contactPhone: true
          }
        },
        products: {
          select: {
            id: true,
            name: true,
            code: true,
            quantity: true,
            serialNumber: true,
            inProgressAt: true
          }
        }
      }
    });

    // Send notifications in parallel (non-blocking)
    Promise.all([
      // Create notifications for admin users
      (async () => {
        try {
          const adminUsers = await getAdminUsers();
          const requesterName = employee.fullName;
          
          // Create all notifications in parallel
          await Promise.all(
            adminUsers.map(admin =>
              createCaseCreatedNotification(
                'delivery',
                deliveryCase.id,
                deliveryCase.title,
                requesterName,
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

    return NextResponse.json(deliveryCase, { status: 201 });

  } catch (error) {
    console.error('Error creating delivery case:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
