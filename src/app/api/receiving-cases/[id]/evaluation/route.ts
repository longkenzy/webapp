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
    const body = await request.json();
    const {
      adminDifficultyLevel,
      adminEstimatedTime,
      adminImpactLevel,
      adminUrgencyLevel,
    } = body;

    // Update the receiving case with admin evaluation
    const updatedCase = await db.receivingCase.update({
      where: { id },
      data: {
        adminDifficultyLevel: adminDifficultyLevel ? parseInt(adminDifficultyLevel) : null,
        adminEstimatedTime: adminEstimatedTime ? parseInt(adminEstimatedTime) : null,
        adminImpactLevel: adminImpactLevel ? parseInt(adminImpactLevel) : null,
        adminUrgencyLevel: adminUrgencyLevel ? parseInt(adminUrgencyLevel) : null,
        adminAssessmentDate: dayjs().tz('Asia/Ho_Chi_Minh').toDate().toISOString(),
      },
      include: {
        requester: {
          select: {
            id: true,
            fullName: true,
            position: true,
          }
        },
        supplier: {
          select: {
            id: true,
            shortName: true,
            fullCompanyName: true,
          }
        },
        products: {
          select: {
            id: true,
            name: true,
            code: true,
            quantity: true,
            serialNumber: true,
          }
        },
        _count: {
          select: {
            products: true,
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedCase,
      message: 'Đánh giá admin đã được cập nhật thành công'
    });

  } catch (error) {
    console.error('Error updating admin evaluation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
