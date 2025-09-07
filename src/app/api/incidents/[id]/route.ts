import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log("=== Update Incident API Called ===");
    
    const session = await getSession();
    if (!session) {
      console.log("No session found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log("Session found:", session.user?.email);

    const { id } = params;
    console.log("Incident ID:", id);

    const body = await request.json();
    console.log("Request body:", body);
    
    const {
      endDate,
      status,
      priority,
      notes,
      // Admin assessment fields
      adminDifficultyLevel,
      adminEstimatedTime,
      adminImpactLevel,
      adminUrgencyLevel,
      adminAssessmentNotes
    } = body;

    // Check if incident exists
    const existingIncident = await db.incident.findUnique({
      where: { id }
    });

    if (!existingIncident) {
      console.log("Incident not found:", id);
      return NextResponse.json(
        { error: "Incident not found" },
        { status: 404 }
      );
    }

    // Validate end date
    if (endDate) {
      const startDate = new Date(existingIncident.startDate);
      const endDateObj = new Date(endDate);
      
      if (endDateObj <= startDate) {
        console.log("Invalid end date:", { startDate: existingIncident.startDate, endDate });
        return NextResponse.json({ 
          error: "Ngày kết thúc phải lớn hơn ngày bắt đầu" 
        }, { status: 400 });
      }
    }

    // Prepare update data
    const updateData: any = {};
    
    if (endDate !== undefined) {
      updateData.endDate = endDate ? new Date(endDate) : null;
    }
    if (status !== undefined) {
      updateData.status = status;
    }
    if (priority !== undefined) {
      updateData.priority = priority;
    }
    if (notes !== undefined) {
      updateData.notes = notes;
    }

    // Admin assessment fields
    if (adminDifficultyLevel !== undefined) {
      updateData.adminDifficultyLevel = adminDifficultyLevel !== null ? parseInt(adminDifficultyLevel) : null;
    }
    if (adminEstimatedTime !== undefined) {
      updateData.adminEstimatedTime = adminEstimatedTime !== null ? parseInt(adminEstimatedTime) : null;
    }
    if (adminImpactLevel !== undefined) {
      updateData.adminImpactLevel = adminImpactLevel !== null ? parseInt(adminImpactLevel) : null;
    }
    if (adminUrgencyLevel !== undefined) {
      updateData.adminUrgencyLevel = adminUrgencyLevel !== null ? parseInt(adminUrgencyLevel) : null;
    }
    if (adminAssessmentNotes !== undefined) {
      updateData.adminAssessmentNotes = adminAssessmentNotes;
    }

    // Set admin assessment date if any admin field is being updated
    const hasAdminAssessment = adminDifficultyLevel !== undefined || 
                              adminEstimatedTime !== undefined || 
                              adminImpactLevel !== undefined || 
                              adminUrgencyLevel !== undefined || 
                              adminAssessmentNotes !== undefined;
    
    if (hasAdminAssessment) {
      updateData.adminAssessmentDate = new Date();
    }

    console.log("Updating incident with data:", updateData);

    // Update incident
    const updatedIncident = await db.incident.update({
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
        }
      }
    });

    console.log("Incident updated successfully:", updatedIncident);

    return NextResponse.json({
      message: "Incident updated successfully",
      data: updatedIncident
    });

  } catch (error) {
    console.error("Error updating incident:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    console.log("Getting incident:", id);

    const incident = await db.incident.findUnique({
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
        }
      }
    });

    if (!incident) {
      return NextResponse.json(
        { error: "Incident not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: incident
    });

  } catch (error) {
    console.error("Error fetching incident:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    console.log("Deleting incident:", id);

    // Check if incident exists
    const existingIncident = await db.incident.findUnique({
      where: { id }
    });

    if (!existingIncident) {
      return NextResponse.json(
        { error: "Incident not found" },
        { status: 404 }
      );
    }

    // Delete incident
    await db.incident.delete({
      where: { id }
    });

    console.log("Incident deleted successfully:", id);

    return NextResponse.json({
      message: "Incident deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting incident:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
