import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { convertToVietnamTime } from "@/lib/date-utils";
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Use transaction for faster and atomic deletion
    const result = await db.$transaction(async (tx) => {
      // Check if case exists and get basic info in one query
      const existingCase = await tx.internalCase.findUnique({
        where: { id },
        select: {
          id: true,
          title: true,
          requester: { select: { fullName: true } },
          handler: { select: { fullName: true } }
        }
      });

      if (!existingCase) {
        throw new Error("Internal case not found");
      }

      // Delete all related records in parallel for better performance
      await Promise.all([
        tx.internalCaseComment.deleteMany({
          where: { internalCaseId: id }
        }),
        tx.internalCaseWorklog.deleteMany({
          where: { internalCaseId: id }
        })
      ]);

      // Delete the main case
      await tx.internalCase.delete({
        where: { id }
      });

      return existingCase;
    });

    return NextResponse.json({
      success: true,
      message: "Internal case deleted successfully",
      deletedCase: {
        id: result.id,
        title: result.title,
        requester: result.requester.fullName,
        handler: result.handler.fullName
      }
    });

  } catch (error) {
    console.error("Error deleting internal case:", error);
    
    // Handle specific error cases
    if (error instanceof Error && error.message === "Internal case not found") {
      return NextResponse.json(
        { error: "Internal case not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log("=== Update Internal Case API Called ===");
    
    const session = await getSession();
    if (!session) {
      console.log("No session found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log("Session found:", session.user?.email);

    const { id } = await params;
    const body = await request.json();
    console.log("Request body:", body);
    
    // Destructure all possible fields from body
    const { 
      endDate, 
      status, 
      notes,
      // Admin can also update these fields
      requesterId,
      handlerId,
      caseType,
      form,
      title,
      description,
      startDate,
      userDifficultyLevel,
      userEstimatedTime,
      userImpactLevel,
      userUrgencyLevel,
      userFormScore,
      adminDifficultyLevel,
      adminEstimatedTime,
      adminImpactLevel,
      adminUrgencyLevel,
      adminAssessmentNotes
    } = body;

    // Check if internal case exists
    const existingCase = await db.internalCase.findUnique({
      where: { id },
    });

    if (!existingCase) {
      console.log("Case not found:", id);
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    // Validate end date (only if both dates exist) - allow any past/future dates
    if (endDate && (startDate || existingCase.startDate)) {
      const startDateToCheck = startDate ? dayjs(startDate).tz('Asia/Ho_Chi_Minh').toDate() : dayjs(existingCase.startDate).tz('Asia/Ho_Chi_Minh').toDate();
      const endDateObj = dayjs(endDate).tz('Asia/Ho_Chi_Minh').toDate();
      
      console.log("=== API Date Validation ===");
      console.log("Start Date to check:", startDateToCheck);
      console.log("End Date:", endDateObj);
      console.log("End <= Start?", endDateObj <= startDateToCheck);
      
      if (endDateObj <= startDateToCheck) {
        console.log("Invalid end date:", { startDate: startDate ? convertToVietnamTime(startDate) : startDateToCheck, endDate: endDateObj });
        return NextResponse.json({ 
          error: "Ngày kết thúc phải lớn hơn ngày bắt đầu" 
        }, { status: 400 });
      }
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: dayjs().tz('Asia/Ho_Chi_Minh').toDate()
    };

    // Only update fields that are provided
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (requesterId !== undefined) updateData.requesterId = requesterId;
    if (handlerId !== undefined) updateData.handlerId = handlerId;
    if (caseType !== undefined) updateData.caseType = caseType;
    if (form !== undefined) updateData.form = form;
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (userDifficultyLevel !== undefined) updateData.userDifficultyLevel = userDifficultyLevel !== null ? parseInt(userDifficultyLevel) : null;
    if (userEstimatedTime !== undefined) updateData.userEstimatedTime = userEstimatedTime !== null ? parseInt(userEstimatedTime) : null;
    if (userImpactLevel !== undefined) updateData.userImpactLevel = userImpactLevel !== null ? parseInt(userImpactLevel) : null;
    if (userUrgencyLevel !== undefined) updateData.userUrgencyLevel = userUrgencyLevel !== null ? parseInt(userUrgencyLevel) : null;
    if (userFormScore !== undefined) updateData.userFormScore = userFormScore !== null ? parseInt(userFormScore) : null;
    if (adminDifficultyLevel !== undefined) updateData.adminDifficultyLevel = adminDifficultyLevel !== null ? parseInt(adminDifficultyLevel) : null;
    if (adminEstimatedTime !== undefined) updateData.adminEstimatedTime = adminEstimatedTime !== null ? parseInt(adminEstimatedTime) : null;
    if (adminImpactLevel !== undefined) updateData.adminImpactLevel = adminImpactLevel !== null ? parseInt(adminImpactLevel) : null;
    if (adminUrgencyLevel !== undefined) updateData.adminUrgencyLevel = adminUrgencyLevel !== null ? parseInt(adminUrgencyLevel) : null;
    if (adminAssessmentNotes !== undefined) updateData.adminAssessmentNotes = adminAssessmentNotes;
    if (adminDifficultyLevel !== undefined || adminEstimatedTime !== undefined || adminImpactLevel !== undefined || adminUrgencyLevel !== undefined) {
      updateData.adminAssessmentDate = dayjs().tz('Asia/Ho_Chi_Minh').toDate();
    }

    // Update internal case
    const updatedCase = await db.internalCase.update({
      where: { id },
      data: updateData,
      include: {
        requester: {
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
        }
      }
    });

    console.log("Internal case updated successfully:", updatedCase);

    return NextResponse.json({
      message: "Internal case updated successfully",
      data: updatedCase
    });

  } catch (error) {
    console.error("Error updating internal case:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get internal case by ID
    const internalCase = await db.internalCase.findUnique({
      where: { id },
      include: {
        requester: {
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
          orderBy: { createdAt: "desc" }
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
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!internalCase) {
      return NextResponse.json(
        { error: "Internal case not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: internalCase
    });

  } catch (error) {
    console.error("Error fetching internal case:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
