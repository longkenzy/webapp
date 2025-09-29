import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string  }> }
) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id  } = await params;

    const deploymentCase = await db.deploymentCase.findUnique({
      where: { id },
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
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        worklogs: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!deploymentCase) {
      return NextResponse.json({ error: "Deployment case not found" }, { status: 404 });
    }

    return NextResponse.json({ data: deploymentCase });

  } catch (error) {
    console.error("Error fetching deployment case:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string  }> }
) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id  } = await params;
    const body = await request.json();
    
    const {
      title,
      description,
      handlerId,
      caseType,
      form,
      startDate,
      endDate,
      status,
      notes,
      crmReferenceCode, // Thêm trường Mã CRM
      // Admin assessment fields
      adminDifficultyLevel,
      adminEstimatedTime,
      adminImpactLevel,
      adminUrgencyLevel,
      adminFormScore
    } = body;

    // Get current case to validate dates
    const currentCase = await db.deploymentCase.findUnique({
      where: { id },
      select: { startDate: true }
    });

    if (!currentCase) {
      return NextResponse.json({ error: "Deployment case not found" }, { status: 404 });
    }

    // Validate end date
    if (endDate && endDate !== null && endDate !== '') {
      const startDateObj = new Date(startDate || currentCase.startDate);
      const endDateObj = new Date(endDate);
      
      if (endDateObj <= startDateObj) {
        return NextResponse.json({ 
          error: "Ngày kết thúc phải lớn hơn ngày bắt đầu" 
        }, { status: 400 });
      }
    }

    // Validate handler exists if provided
    if (handlerId) {
      const handler = await db.employee.findUnique({
        where: { id: handlerId }
      });

      if (!handler) {
        return NextResponse.json(
          { error: "Handler not found" },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};
    
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (handlerId !== undefined) updateData.handlerId = handlerId;
    if (caseType !== undefined) updateData.caseType = caseType;
    if (form !== undefined) updateData.form = form;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) {
      if (endDate === null || endDate === '') {
        updateData.endDate = null;
      } else {
        updateData.endDate = new Date(endDate);
      }
    }
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (crmReferenceCode !== undefined) updateData.crmReferenceCode = crmReferenceCode;
    
    // Admin assessment fields
    if (adminDifficultyLevel !== undefined) updateData.adminDifficultyLevel = adminDifficultyLevel ? parseInt(adminDifficultyLevel) : null;
    if (adminEstimatedTime !== undefined) updateData.adminEstimatedTime = adminEstimatedTime ? parseInt(adminEstimatedTime) : null;
    if (adminImpactLevel !== undefined) updateData.adminImpactLevel = adminImpactLevel ? parseInt(adminImpactLevel) : null;
    if (adminUrgencyLevel !== undefined) updateData.adminUrgencyLevel = adminUrgencyLevel ? parseInt(adminUrgencyLevel) : null;
    if (adminFormScore !== undefined) updateData.adminFormScore = adminFormScore ? parseInt(adminFormScore) : null;
    
    // Set admin assessment date if any admin field is being updated
    if (Object.keys(updateData).some(key => key.startsWith('admin'))) {
      updateData.adminAssessmentDate = new Date();
    }

    // Always update the updatedAt timestamp
    updateData.updatedAt = new Date();

    const deploymentCase = await db.deploymentCase.update({
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
      message: "Deployment case updated successfully",
      data: deploymentCase
    });

  } catch (error) {
    console.error("Error updating deployment case:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string  }> }
) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id  } = await params;

    await db.deploymentCase.delete({
      where: { id }
    });

    return NextResponse.json({
      message: "Deployment case deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting deployment case:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
