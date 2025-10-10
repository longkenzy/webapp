import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth/session';

import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);


export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existingCase = await db.warranty.findUnique({
      where: { id },
    });

    if (!existingCase) {
      return NextResponse.json({ error: "Warranty case not found" }, { status: 404 });
    }

    if (existingCase.status === 'COMPLETED') {
      return NextResponse.json({ error: "Warranty case is already completed" }, { status: 400 });
    }

    const updatedCase = await db.warranty.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        endDate: dayjs().tz('Asia/Ho_Chi_Minh').toDate(),
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

    return NextResponse.json({
      success: true,
      message: 'Warranty case closed successfully',
      data: updatedCase,
    });
  } catch (error) {
    console.error('Error closing warranty case:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to close warranty case',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
