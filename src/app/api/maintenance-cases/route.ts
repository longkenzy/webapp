import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Temporarily disable authentication for testing
    // const session = await getServerSession(authOptions);
    
    // if (!session?.user?.id) {
    //   return NextResponse.json(
    //     { error: 'Unauthorized' },
    //     { status: 401 }
    //   );
    // }

    const maintenanceCases = await prisma.maintenanceCase.findMany({
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      data: maintenanceCases
    });
  } catch (error) {
    console.error('Error fetching maintenance cases:', error);
    return NextResponse.json(
      { error: 'Failed to fetch maintenance cases' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Temporarily disable authentication for testing
    // const session = await getServerSession(authOptions);
    
    // if (!session?.user?.id) {
    //   return NextResponse.json(
    //     { error: 'Unauthorized' },
    //     { status: 401 }
    //   );
    // }

    const body = await request.json();
    const { title, description, maintenanceType, equipmentId, startDate, notes } = body;

    // Validate required fields
    if (!title || !description || !maintenanceType || !equipmentId || !startDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get first employee as default reporter and handler (for now)
    const defaultEmployee = await prisma.employee.findFirst();
    if (!defaultEmployee) {
      return NextResponse.json(
        { error: 'No employees found' },
        { status: 400 }
      );
    }

    const newMaintenanceCase = await prisma.maintenanceCase.create({
      data: {
        title,
        description,
        reporterId: defaultEmployee.id,
        handlerId: defaultEmployee.id,
        equipmentId,
        maintenanceType: maintenanceType.toUpperCase(),
        startDate: new Date(startDate),
        notes: notes || '',
        status: 'RECEIVED'
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
      data: newMaintenanceCase
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating maintenance case:', error);
    return NextResponse.json(
      { error: 'Failed to create maintenance case' },
      { status: 500 }
    );
  }
}
