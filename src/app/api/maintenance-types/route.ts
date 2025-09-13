import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');

    const whereClause = isActive !== null ? { isActive: isActive === 'true' } : {};

    const maintenanceTypes = await prisma.maintenanceCaseType.findMany({
      where: whereClause,
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: maintenanceTypes,
    }, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Error fetching maintenance types:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch maintenance types',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: 'Name is required',
        },
        { status: 400 }
      );
    }

    const maintenanceType = await prisma.maintenanceCaseType.create({
      data: {
        name,
        description: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Maintenance case type created successfully',
      data: maintenanceType,
    }, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Error creating maintenance type:', error);
    
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
        message: 'Failed to create maintenance case type',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
