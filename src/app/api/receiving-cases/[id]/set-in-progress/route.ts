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

    const { id: caseId } = await params;

    // Find the receiving case
    const receivingCase = await db.receivingCase.findUnique({
      where: { id: caseId },
      include: {
        requester: true,
        handler: true,
        supplier: true,
        products: true,
      },
    });

    if (!receivingCase) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    // Check if case is already completed
    if (receivingCase.status === 'COMPLETED') {
      return NextResponse.json({ error: 'Cannot change status of completed case' }, { status: 400 });
    }

    // Update the case status to IN_PROGRESS with current timestamp
    const updatedCase = await db.receivingCase.update({
      where: { id: caseId },
      data: {
        status: 'IN_PROGRESS',
        inProgressAt: dayjs().tz('Asia/Ho_Chi_Minh').toDate(),
        updatedAt: dayjs().tz('Asia/Ho_Chi_Minh').toDate(),
      },
      include: {
        requester: true,
        handler: true,
        supplier: true,
        products: true,
        _count: {
          select: {
            comments: true,
            worklogs: true,
            products: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedCase,
      message: 'Case status updated to in progress successfully',
    });

  } catch (error) {
    console.error('Error setting receiving case in progress:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
