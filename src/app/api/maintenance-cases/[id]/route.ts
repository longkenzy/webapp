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
    const { 
      title, 
      description, 
      maintenanceType, 
      equipmentId, 
      startDate, 
      endDate, 
      status, 
      notes,
      // Admin evaluation fields
      adminDifficultyLevel,
      adminEstimatedTime,
      adminImpactLevel,
      adminUrgencyLevel,
      adminAssessmentDate,
      adminAssessmentNotes,
      // User evaluation fields (for updates)
      userDifficultyLevel,
      userEstimatedTime,
      userImpactLevel,
      userUrgencyLevel,
      userFormScore
    } = body;

    // Build update data object dynamically
    const updateData: any = {};

    // Only update fields that are provided
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (maintenanceType !== undefined) updateData.maintenanceType = maintenanceType.toUpperCase();
    if (equipmentId !== undefined) updateData.equipmentId = equipmentId;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
    if (status !== undefined) updateData.status = status.toUpperCase();
    if (notes !== undefined) updateData.notes = notes;

    // Admin evaluation fields
    if (adminDifficultyLevel !== undefined) updateData.adminDifficultyLevel = parseInt(adminDifficultyLevel);
    if (adminEstimatedTime !== undefined) updateData.adminEstimatedTime = parseInt(adminEstimatedTime);
    if (adminImpactLevel !== undefined) updateData.adminImpactLevel = parseInt(adminImpactLevel);
    if (adminUrgencyLevel !== undefined) updateData.adminUrgencyLevel = parseInt(adminUrgencyLevel);
    if (adminAssessmentDate !== undefined) updateData.adminAssessmentDate = new Date(adminAssessmentDate);
    if (adminAssessmentNotes !== undefined) updateData.adminAssessmentNotes = adminAssessmentNotes;

    // User evaluation fields
    if (userDifficultyLevel !== undefined) updateData.userDifficultyLevel = parseInt(userDifficultyLevel);
    if (userEstimatedTime !== undefined) updateData.userEstimatedTime = parseInt(userEstimatedTime);
    if (userImpactLevel !== undefined) updateData.userImpactLevel = parseInt(userImpactLevel);
    if (userUrgencyLevel !== undefined) updateData.userUrgencyLevel = parseInt(userUrgencyLevel);
    if (userFormScore !== undefined) updateData.userFormScore = parseInt(userFormScore);

    const updatedMaintenanceCase = await prisma.maintenanceCase.update({
      where: { id },
      data: updateData,
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
