import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { db } from '@/lib/db';
import { ReceivingCaseStatus } from '@prisma/client';
import { createCaseCreatedNotification, getAdminUsers } from '@/lib/notifications';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
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
            serialNumber: true
          }
        },
        _count: {
          select: {
            comments: true,
            worklogs: true,
            products: true
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
        ...where,
        form: 'Giao hàng'
      }
    });

    // Map customer -> supplier to preserve existing frontend expectations
    const mappedCases = deliveryCases.map((c: any) => ({
      ...c,
      supplier: c.customer,
    }));

    return NextResponse.json({
      deliveryCases: mappedCases,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

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
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
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
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        status: status || ReceivingCaseStatus.RECEIVED,
        notes,
        requesterId,
        handlerId,
        customerId: customerId,
        userDifficultyLevel: userDifficultyLevel ? parseInt(userDifficultyLevel) : null,
        userEstimatedTime: userEstimatedTime ? parseInt(userEstimatedTime) : null,
        userImpactLevel: userImpactLevel ? parseInt(userImpactLevel) : null,
        userUrgencyLevel: userUrgencyLevel ? parseInt(userUrgencyLevel) : null,
        userFormScore: userFormScore ? parseInt(userFormScore) : null,
        userAssessmentDate: userAssessmentDate ? new Date(userAssessmentDate) : null,
        products: {
          create: products?.map((product: any) => ({
            name: product.name,
            code: product.code,
            quantity: typeof product.quantity === 'string' ? parseInt(product.quantity) : product.quantity,
            serialNumber: product.serialNumber
          })) || []
        }
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
            serialNumber: true
          }
        },
        _count: {
          select: {
            comments: true,
            worklogs: true,
            products: true
          }
        }
      }
    });

    // Create notifications for admin users
    try {
      const adminUsers = await getAdminUsers();
      const requesterName = employee.fullName;
      
      for (const admin of adminUsers) {
        await createCaseCreatedNotification(
          'delivery',
          deliveryCase.id,
          deliveryCase.title,
          requesterName,
          admin.id
        );
      }
      console.log(`Notifications sent to ${adminUsers.length} admin users`);
    } catch (notificationError) {
      console.error('Error creating notifications:', notificationError);
      // Don't fail the case creation if notifications fail
    }

    return NextResponse.json(deliveryCase, { status: 201 });

  } catch (error) {
    console.error('Error creating delivery case:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
