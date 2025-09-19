import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { db } from '@/lib/db';

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

    // Check if case exists
    const existingCase = await db.deliveryCase.findUnique({
      where: { id: caseId },
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
        }
      }
    });

    if (!existingCase) {
      return NextResponse.json({ error: 'Delivery case not found' }, { status: 404 });
    }

    // Check if case is already completed
    if (existingCase.status === 'COMPLETED') {
      return NextResponse.json({ error: 'Case is already completed' }, { status: 400 });
    }

    // Update case status to COMPLETED
    const updatedCase = await db.deliveryCase.update({
      where: { id: caseId },
      data: {
        status: 'COMPLETED',
        endDate: new Date(),
        updatedAt: new Date()
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
        }
      }
    });

    return NextResponse.json({
      message: 'Delivery case closed successfully',
      data: updatedCase
    });

  } catch (error) {
    console.error('Error closing delivery case:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
