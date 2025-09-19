import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: maintenanceCaseId } = await params;

    if (!maintenanceCaseId) {
      return NextResponse.json(
        { error: 'ID case bảo trì không được cung cấp' },
        { status: 400 }
      );
    }

    // Check if maintenance case exists
    const existingCase = await db.maintenanceCase.findUnique({
      where: { id: maintenanceCaseId }
    });

    if (!existingCase) {
      return NextResponse.json(
        { error: 'Không tìm thấy case bảo trì' },
        { status: 404 }
      );
    }

    // Check if case is already completed
    if (existingCase.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Case bảo trì đã được đóng trước đó' },
        { status: 400 }
      );
    }

    // Update the maintenance case status to COMPLETED and set endDate
    const updatedCase = await db.maintenanceCase.update({
      where: { id: maintenanceCaseId },
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
        maintenanceCaseType: {
          select: {
            id: true,
            name: true
          }
        },
        equipment: {
          select: {
            id: true,
            name: true,
            model: true,
            serialNumber: true,
            location: true
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
      message: 'Case bảo trì đã được đóng thành công',
      data: updatedCase
    });

  } catch (error) {
    console.error('Error closing maintenance case:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Có lỗi xảy ra khi đóng case bảo trì',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
