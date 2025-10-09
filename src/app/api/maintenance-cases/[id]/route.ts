import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { convertToVietnamTime } from '@/lib/date-utils';

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

    // Validate end date (only if both dates exist) - allow any past/future dates
    if (body.endDate && (body.startDate || existingCase.startDate)) {
      const startDateToCheck = body.startDate ? new Date(body.startDate) : new Date(existingCase.startDate);
      const endDateObj = new Date(body.endDate);
      
      console.log("=== API Maintenance Date Validation ===");
      console.log("Start Date to check:", startDateToCheck);
      console.log("End Date:", endDateObj);
      console.log("End <= Start?", endDateObj <= startDateToCheck);
      
      if (endDateObj <= startDateToCheck) {
        console.log("Invalid end date:", { startDate: body.startDate ? convertToVietnamTime(body.startDate) : startDateToCheck, endDate: endDateObj });
        return NextResponse.json({ 
          error: "Ngày kết thúc phải lớn hơn ngày bắt đầu" 
        }, { status: 400 });
      }
    }

    // Build update data object dynamically
    const updateData: any = {
      updatedAt: new Date()
    };

    // Only update fields that are provided and not undefined
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.customerName !== undefined) updateData.customerName = body.customerName;
    // Update handlerId using nested relation
    if (body.handlerId !== undefined) {
      updateData.handler = {
        connect: { id: body.handlerId }
      };
    }
    if (body.maintenanceTypeId !== undefined) {
      updateData.maintenanceCaseType = {
        connect: { id: body.maintenanceTypeId }
      };
    }
    if (body.customerId !== undefined) {
      if (body.customerId) {
        updateData.customer = {
          connect: { id: body.customerId }
        };
      } else {
        updateData.customer = {
          disconnect: true
        };
      }
    }
    if (body.equipmentId !== undefined) {
      if (body.equipmentId) {
        updateData.equipment = {
          connect: { id: body.equipmentId }
        };
      } else {
        updateData.equipment = {
          disconnect: true
        };
      }
    }
    if (body.startDate !== undefined) updateData.startDate = convertToVietnamTime(body.startDate);
    if (body.endDate !== undefined) updateData.endDate = body.endDate ? convertToVietnamTime(body.endDate) : null;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.crmReferenceCode !== undefined) updateData.crmReferenceCode = body.crmReferenceCode;

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
