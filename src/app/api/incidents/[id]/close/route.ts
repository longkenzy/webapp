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

    // Find the incident case
    const incident = await db.incident.findUnique({
      where: { id: caseId },
      include: {
        reporter: true,
        handler: true,
        incidentType: true,
        customer: true
      }
    });

    if (!incident) {
      return NextResponse.json({ error: 'Incident case not found' }, { status: 404 });
    }

    // Update the case status to COMPLETED and set endDate
    const updatedCase = await db.incident.update({
      where: { id: caseId },
      data: {
        status: 'COMPLETED',
        endDate: dayjs().tz('Asia/Ho_Chi_Minh').toDate(),
        updatedAt: dayjs().tz('Asia/Ho_Chi_Minh').toDate()
      },
      include: {
        reporter: {
          select: {
            id: true,
            fullName: true,
            position: true,
            department: true,
            companyEmail: true
          }
        },
        handler: {
          select: {
            id: true,
            fullName: true,
            position: true,
            department: true,
            companyEmail: true
          }
        },
        incidentType: {
          select: {
            id: true,
            name: true
          }
        },
        customer: {
          select: {
            id: true,
            shortName: true,
            fullCompanyName: true,
            contactPerson: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedCase
    });

  } catch (error) {
    console.error('Error closing incident case:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
