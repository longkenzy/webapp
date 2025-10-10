import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { convertToVietnamTime } from "@/lib/date-utils";

import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);


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
    
    console.log('=== API PUT Deployment Case ===');
    console.log('Body received:', body);
    
    const {
      title,
      description,
      handlerId,
      deploymentTypeId,
      customerId,
      customerName,
      caseType,
      form,
      startDate,
      endDate,
      status,
      notes,
      crmReferenceCode,
      // User assessment fields
      userDifficultyLevel,
      userEstimatedTime,
      userImpactLevel,
      userUrgencyLevel,
      userFormScore,
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

    // Validate end date (only if both dates exist) - allow any past/future dates
    if (endDate && endDate !== null && endDate !== '') {
      const startDateToCheck = startDate ? dayjs(startDate).tz('Asia/Ho_Chi_Minh').toDate() : dayjs(currentCase.startDate).tz('Asia/Ho_Chi_Minh').toDate();
      const endDateObj = dayjs(endDate).tz('Asia/Ho_Chi_Minh').toDate();
      
      console.log("=== API Deployment Date Validation (Update) ===");
      console.log("Start Date:", startDateToCheck);
      console.log("End Date:", endDateObj);
      console.log("End <= Start?", endDateObj <= startDateToCheck);
      
      if (endDateObj <= startDateToCheck) {
        return NextResponse.json({ 
          error: "Ngày kết thúc phải lớn hơn ngày bắt đầu" 
        }, { status: 400 });
      }
    }

    // Build update data dynamically
    const updateData: any = {
      updatedAt: dayjs().tz('Asia/Ho_Chi_Minh').toDate()
    };
    
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (customerName !== undefined) updateData.customerName = customerName;
    if (caseType !== undefined) updateData.caseType = caseType;
    if (form !== undefined) updateData.form = form;
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
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
    
    // Handle Prisma relations using connect/disconnect syntax
    if (handlerId !== undefined) {
      updateData.handler = { connect: { id: handlerId } };
    }
    
    if (deploymentTypeId !== undefined) {
      updateData.deploymentType = { connect: { id: deploymentTypeId } };
    }
    
    if (customerId !== undefined) {
      if (customerId) {
        updateData.customer = { connect: { id: customerId } };
      } else {
        updateData.customer = { disconnect: true };
      }
    }
    
    // User assessment fields
    if (userDifficultyLevel !== undefined) updateData.userDifficultyLevel = userDifficultyLevel ? parseInt(userDifficultyLevel) : null;
    if (userEstimatedTime !== undefined) updateData.userEstimatedTime = userEstimatedTime ? parseInt(userEstimatedTime) : null;
    if (userImpactLevel !== undefined) updateData.userImpactLevel = userImpactLevel ? parseInt(userImpactLevel) : null;
    if (userUrgencyLevel !== undefined) updateData.userUrgencyLevel = userUrgencyLevel ? parseInt(userUrgencyLevel) : null;
    if (userFormScore !== undefined) updateData.userFormScore = userFormScore ? parseInt(userFormScore) : null;
    
    // Admin assessment fields
    if (adminDifficultyLevel !== undefined) updateData.adminDifficultyLevel = adminDifficultyLevel ? parseInt(adminDifficultyLevel) : null;
    if (adminEstimatedTime !== undefined) updateData.adminEstimatedTime = adminEstimatedTime ? parseInt(adminEstimatedTime) : null;
    if (adminImpactLevel !== undefined) updateData.adminImpactLevel = adminImpactLevel ? parseInt(adminImpactLevel) : null;
    if (adminUrgencyLevel !== undefined) updateData.adminUrgencyLevel = adminUrgencyLevel ? parseInt(adminUrgencyLevel) : null;
    if (adminFormScore !== undefined) updateData.adminFormScore = adminFormScore ? parseInt(adminFormScore) : null;
    
    // Set admin assessment date if any admin field is being updated
    if (Object.keys(updateData).some(key => key.startsWith('admin'))) {
      updateData.adminAssessmentDate = dayjs().tz('Asia/Ho_Chi_Minh').toDate();
    }
    
    console.log('Update data to be sent to Prisma:', updateData);

    const deploymentCase = await db.deploymentCase.update({
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
