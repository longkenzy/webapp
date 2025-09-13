import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const maintenanceType = await prisma.maintenanceCaseType.findUnique({
      where: { id },
    });

    if (!maintenanceType) {
      return NextResponse.json(
        {
          success: false,
          message: 'Maintenance case type not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: maintenanceType,
    }, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Error fetching maintenance type:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch maintenance case type',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, isActive } = body;

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: 'Name is required',
        },
        { status: 400 }
      );
    }

    const maintenanceType = await prisma.maintenanceCaseType.update({
      where: { id },
      data: {
        name,
        description: null,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Maintenance case type updated successfully',
      data: maintenanceType,
    }, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Error updating maintenance type:', error);
    
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        {
          success: false,
          message: 'A maintenance case type with this name already exists',
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update maintenance case type',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if there are any maintenance cases using this type
    const maintenanceCasesCount = await prisma.maintenanceCase.count({
      where: { maintenanceTypeId: id },
    });

    if (maintenanceCasesCount > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot delete maintenance case type. It is being used by ${maintenanceCasesCount} maintenance case(s).`,
        },
        { status: 400 }
      );
    }

    await prisma.maintenanceCaseType.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Maintenance case type deleted successfully',
    }, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Error deleting maintenance type:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete maintenance case type',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
