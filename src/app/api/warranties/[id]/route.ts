import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { convertToVietnamTime } from "@/lib/date-utils";

import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);


export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log("=== Update Warranty API Called ===");
    console.log("Warranty ID:", id);
    
    const session = await getSession();
    if (!session) {
      console.log("No session found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log("Session found:", session.user?.email);

    const body = await request.json();
    console.log("Request body:", body);
    
    const {
      endDate,
      status,
      notes,
      crmReferenceCode,
      // Admin can also update these fields
      title,
      description,
      customerName,
      customerId,
      handlerId,
      warrantyTypeId,
      startDate,
      // User assessment
      userDifficultyLevel,
      userEstimatedTime,
      userImpactLevel,
      userUrgencyLevel,
      userFormScore,
      // Admin assessment
      adminDifficultyLevel,
      adminEstimatedTime,
      adminImpactLevel,
      adminUrgencyLevel,
      adminAssessmentNotes
    } = body;

    // Check if warranty exists
    console.log("Checking if warranty exists with ID:", id);
    const existingWarranty = await db.warranty.findUnique({
      where: { id }
    });

    if (!existingWarranty) {
      console.log("Warranty not found with ID:", id);
      return NextResponse.json(
        { error: "Warranty not found" },
        { status: 404 }
      );
    }

    console.log("Found existing warranty:", existingWarranty.id);

    // Validate end date (only if both dates exist) - allow any past/future dates
    if (endDate && (startDate || existingWarranty.startDate)) {
      const startDateToCheck = startDate ? dayjs(startDate).tz('Asia/Ho_Chi_Minh').toDate() : dayjs(existingWarranty.startDate).tz('Asia/Ho_Chi_Minh').toDate();
      const endDateObj = dayjs(endDate).tz('Asia/Ho_Chi_Minh').toDate();
      
      console.log("=== API Warranty Date Validation ===");
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

    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (crmReferenceCode !== undefined) updateData.crmReferenceCode = crmReferenceCode;
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (customerName !== undefined) updateData.customerName = customerName;
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    
    // Handle relations with connect/disconnect
    if (customerId !== undefined) {
      if (customerId) {
        updateData.customer = { connect: { id: customerId } };
      } else {
        updateData.customer = { disconnect: true };
      }
    }
    if (handlerId !== undefined) {
      updateData.handler = { connect: { id: handlerId } };
    }
    if (warrantyTypeId !== undefined) {
      updateData.warrantyType = { connect: { id: warrantyTypeId } };
    }

    // User assessment
    if (userDifficultyLevel !== undefined) updateData.userDifficultyLevel = userDifficultyLevel !== null ? parseInt(userDifficultyLevel) : null;
    if (userEstimatedTime !== undefined) updateData.userEstimatedTime = userEstimatedTime !== null ? parseInt(userEstimatedTime) : null;
    if (userImpactLevel !== undefined) updateData.userImpactLevel = userImpactLevel !== null ? parseInt(userImpactLevel) : null;
    if (userUrgencyLevel !== undefined) updateData.userUrgencyLevel = userUrgencyLevel !== null ? parseInt(userUrgencyLevel) : null;
    if (userFormScore !== undefined) updateData.userFormScore = userFormScore !== null ? parseInt(userFormScore) : null;
    
    // Admin assessment
    if (adminDifficultyLevel !== undefined) updateData.adminDifficultyLevel = adminDifficultyLevel !== null ? parseInt(adminDifficultyLevel) : null;
    if (adminEstimatedTime !== undefined) updateData.adminEstimatedTime = adminEstimatedTime !== null ? parseInt(adminEstimatedTime) : null;
    if (adminImpactLevel !== undefined) updateData.adminImpactLevel = adminImpactLevel !== null ? parseInt(adminImpactLevel) : null;
    if (adminUrgencyLevel !== undefined) updateData.adminUrgencyLevel = adminUrgencyLevel !== null ? parseInt(adminUrgencyLevel) : null;
    if (adminAssessmentNotes !== undefined) updateData.adminAssessmentNotes = adminAssessmentNotes;
    
    if (adminDifficultyLevel !== undefined || adminEstimatedTime !== undefined || adminImpactLevel !== undefined || adminUrgencyLevel !== undefined) {
      updateData.adminAssessmentDate = dayjs().tz('Asia/Ho_Chi_Minh').toDate();
    }

    // Update the warranty in database
    console.log("Updating warranty with data:", updateData);
    const updatedWarranty = await db.warranty.update({
      where: { id },
      data: updateData,
      include: {
        reporter: true,
        handler: true,
        warrantyType: true,
        customer: true
      }
    }).catch(dbError => {
      console.error("Database error when updating warranty:", dbError);
      throw dbError;
    });

    console.log("Warranty updated successfully:", updatedWarranty);

    return NextResponse.json({
      message: "Warranty updated successfully",
      data: updatedWarranty
    });

  } catch (error) {
    console.error("Error updating warranty:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        error: "Internal server error", 
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log("=== Get Warranty API Called ===");
    console.log("Warranty ID:", id);
    
    const session = await getSession();
    if (!session) {
      console.log("No session found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log("Session found:", session.user?.email);

    // Find the warranty in database
    const warranty = await db.warranty.findUnique({
      where: { id },
      include: {
        reporter: true,
        handler: true,
        warrantyType: true,
        customer: true
      }
    });

    if (!warranty) {
      return NextResponse.json(
        { error: "Warranty not found" },
        { status: 404 }
      );
    }

    console.log("Warranty found:", warranty);

    return NextResponse.json({
      data: warranty
    });

  } catch (error) {
    console.error("Error fetching warranty:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log("=== Delete Warranty API Called ===");
    console.log("Warranty ID:", id);
    
    const session = await getSession();
    if (!session) {
      console.log("No session found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log("Session found:", session.user?.email);

    // Check if warranty exists
    const existingWarranty = await db.warranty.findUnique({
      where: { id },
      include: {
        reporter: true,
        handler: true,
        warrantyType: true,
        customer: true
      }
    });

    if (!existingWarranty) {
      console.log("Warranty not found with ID:", id);
      return NextResponse.json(
        { error: "Warranty not found" },
        { status: 404 }
      );
    }

    console.log("Found warranty to delete:", existingWarranty.id);

    // Delete related records first (comments and worklogs)
    await db.warrantyComment.deleteMany({
      where: { warrantyId: id }
    });

    await db.warrantyWorklog.deleteMany({
      where: { warrantyId: id }
    });

    // Delete the warranty
    await db.warranty.delete({
      where: { id }
    });

    console.log("Warranty deleted successfully");

    return NextResponse.json({
      message: "Warranty deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting warranty:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        error: "Internal server error", 
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
