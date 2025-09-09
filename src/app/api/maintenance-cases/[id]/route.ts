import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Temporarily disable authentication for testing
    // const session = await getServerSession(authOptions);
    
    // if (!session?.user?.id) {
    //   return NextResponse.json(
    //     { error: 'Unauthorized' },
    //     { status: 401 }
    //   );
    // }

    const { id } = params;

    const maintenanceCase = await prisma.maintenanceCase.findUnique({
      where: { id },
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
        equipment: {
          select: {
            id: true,
            name: true,
            model: true,
            serialNumber: true,
            location: true
          }
        }
      }
    });

    if (!maintenanceCase) {
      return NextResponse.json(
        { error: 'Maintenance case not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: maintenanceCase
    });
  } catch (error) {
    console.error('Error fetching maintenance case:', error);
    return NextResponse.json(
      { error: 'Failed to fetch maintenance case' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Temporarily disable authentication for testing
    // const session = await getServerSession(authOptions);
    
    // if (!session?.user?.id) {
    //   return NextResponse.json(
    //     { error: 'Unauthorized' },
    //     { status: 401 }
    //   );
    // }

    const { id } = params;
    const body = await request.json();
    const { title, description, maintenanceType, equipmentId, startDate, endDate, status, notes } = body;

    // Validate required fields
    if (!title || !description || !maintenanceType || !equipmentId || !startDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const updatedMaintenanceCase = await prisma.maintenanceCase.update({
      where: { id },
      data: {
        title,
        description,
        maintenanceType: maintenanceType.toUpperCase(),
        equipmentId,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        status: status ? status.toUpperCase() : 'RECEIVED',
        notes: notes || ''
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
        equipment: {
          select: {
            id: true,
            name: true,
            model: true,
            serialNumber: true,
            location: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedMaintenanceCase
    });
  } catch (error) {
    console.error('Error updating maintenance case:', error);
    return NextResponse.json(
      { error: 'Failed to update maintenance case' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Temporarily disable authentication for testing
    // const session = await getServerSession(authOptions);
    
    // if (!session?.user?.id) {
    //   return NextResponse.json(
    //     { error: 'Unauthorized' },
    //     { status: 401 }
    //   );
    // }

    const { id } = params;

    await prisma.maintenanceCase.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Maintenance case deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting maintenance case:', error);
    return NextResponse.json(
      { error: 'Failed to delete maintenance case' },
      { status: 500 }
    );
  }
}
