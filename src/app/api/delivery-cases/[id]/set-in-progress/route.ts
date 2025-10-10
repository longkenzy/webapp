import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { db } from '@/lib/db';

import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);


export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if delivery case exists
    const existingCase = await db.deliveryCase.findUnique({
      where: { id },
      select: { id: true, status: true }
    });

    if (!existingCase) {
      return NextResponse.json({ error: 'Delivery case not found' }, { status: 404 });
    }

    // Update delivery case to IN_PROGRESS with current timestamp
    const updatedCase = await db.deliveryCase.update({
      where: { id },
      data: {
        status: 'IN_PROGRESS',
        inProgressAt: dayjs().tz('Asia/Ho_Chi_Minh').toDate(),
        updatedAt: dayjs().tz('Asia/Ho_Chi_Minh').toDate(),
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

    return NextResponse.json({
      message: 'Delivery case set to in progress successfully',
      data: updatedCase
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
