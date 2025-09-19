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

    // Find the deployment case
    const deploymentCase = await db.deploymentCase.findUnique({
      where: { id: caseId },
      include: {
        reporter: true,
        handler: true,
        deploymentType: true,
        customer: true
      }
    });

    if (!deploymentCase) {
      return NextResponse.json({ error: 'Deployment case not found' }, { status: 404 });
    }

    // Update the case status to COMPLETED and set endDate
    const updatedCase = await db.deploymentCase.update({
      where: { id: caseId },
      data: {
        status: 'COMPLETED',
        endDate: new Date(),
        updatedAt: new Date()
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
        deploymentType: {
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
    console.error('Error closing deployment case:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
