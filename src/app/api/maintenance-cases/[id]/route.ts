import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;

    const maintenanceCase = await prisma.maintenanceCase.findUnique({
      where: { id },
      include: {
        reporter: {
          select: {
            id: true,
            fullName: true,
            position: true,
            department: true,
            avatar: true
          }
        },
        handler: {
          select: {
            id: true,
            fullName: true,
            position: true,
            department: true,
            avatar: true
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
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;
    const body = await request.json();
    
    console.log('=== API Update Maintenance ===');
    console.log('ID:', id);
    console.log('Body received:', body);

    // Build update data object dynamically
    const updateData: any = {};

    // Only update fields that are provided and not undefined
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.maintenanceType !== undefined) updateData.maintenanceType = body.maintenanceType.toUpperCase();
    if (body.equipmentId !== undefined) updateData.equipmentId = body.equipmentId;
    if (body.startDate !== undefined) updateData.startDate = new Date(body.startDate);
    if (body.endDate !== undefined) updateData.endDate = body.endDate ? new Date(body.endDate) : null;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.crmReferenceCode !== undefined) updateData.crmReferenceCode = body.crmReferenceCode; // Thêm Mã CRM

    // Admin evaluation fields
    if (body.adminDifficultyLevel !== undefined) updateData.adminDifficultyLevel = parseInt(body.adminDifficultyLevel);
    if (body.adminEstimatedTime !== undefined) updateData.adminEstimatedTime = parseInt(body.adminEstimatedTime);
    if (body.adminImpactLevel !== undefined) updateData.adminImpactLevel = parseInt(body.adminImpactLevel);
    if (body.adminUrgencyLevel !== undefined) updateData.adminUrgencyLevel = parseInt(body.adminUrgencyLevel);
    if (body.adminAssessmentDate !== undefined) updateData.adminAssessmentDate = new Date(body.adminAssessmentDate);
    if (body.adminAssessmentNotes !== undefined) updateData.adminAssessmentNotes = body.adminAssessmentNotes;

    // User evaluation fields
    if (body.userDifficultyLevel !== undefined) updateData.userDifficultyLevel = parseInt(body.userDifficultyLevel);
    if (body.userEstimatedTime !== undefined) updateData.userEstimatedTime = parseInt(body.userEstimatedTime);
    if (body.userImpactLevel !== undefined) updateData.userImpactLevel = parseInt(body.userImpactLevel);
    if (body.userUrgencyLevel !== undefined) updateData.userUrgencyLevel = parseInt(body.userUrgencyLevel);
    if (body.userFormScore !== undefined) updateData.userFormScore = parseInt(body.userFormScore);

    console.log('Update data to be sent to Prisma:', updateData);

    // Check if maintenance case exists first
    const existingCase = await prisma.maintenanceCase.findUnique({
      where: { id }
    });

    if (!existingCase) {
      console.error('Maintenance case not found:', id);
      return NextResponse.json(
        { error: 'Maintenance case not found' },
        { status: 404 }
      );
    }

    console.log('Existing case found:', existingCase);

    const updatedMaintenanceCase = await prisma.maintenanceCase.update({
      where: { id },
      data: updateData,
      include: {
        reporter: {
          select: {
            id: true,
            fullName: true,
            position: true,
            department: true,
            avatar: true
          }
        },
        handler: {
          select: {
            id: true,
            fullName: true,
            position: true,
            department: true,
            avatar: true
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

    console.log('Successfully updated maintenance case:', updatedMaintenanceCase);

    return NextResponse.json({
      success: true,
      data: updatedMaintenanceCase
    });
  } catch (error) {
    console.error('Error updating maintenance case:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to update maintenance case',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;

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
