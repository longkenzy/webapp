import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { convertToVietnamTime } from "@/lib/date-utils";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log("=== Update Incident API Called ===");
    
    const session = await getSession();
    if (!session) {
      console.log("No session found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log("Session found:", session.user?.email);

    const { id } = await params;
    console.log("Incident ID:", id);

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
      incidentType,
      customerName,
      customerId,
      handlerId,
      startDate,
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

    // Validate end date (only if both dates exist) - allow any past/future dates
    if (endDate && (startDate || existingIncident.startDate)) {
      const startDateToCheck = startDate ? new Date(startDate) : new Date(existingIncident.startDate);
      const endDateObj = new Date(endDate);
      
      console.log("=== API Incident Date Validation ===");
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
      updatedAt: new Date()
    };
    
    if (endDate !== undefined) updateData.endDate = endDate ? convertToVietnamTime(endDate) : null;
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (crmReferenceCode !== undefined) updateData.crmReferenceCode = crmReferenceCode;
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (customerName !== undefined) updateData.customerName = customerName;
    if (customerId !== undefined) updateData.customerId = customerId;
    if (handlerId !== undefined) updateData.handlerId = handlerId;
    if (startDate !== undefined) updateData.startDate = convertToVietnamTime(startDate);
    
    // Handle incidentType - need to find incidentTypeId by name
    if (incidentType !== undefined && incidentType) {
      const incidentTypeRecord = await db.incidentType.findFirst({
        where: { name: incidentType }
      });
      if (incidentTypeRecord) {
        updateData.incidentTypeId = incidentTypeRecord.id;
      }
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
        customer: {
          select: {
            id: true,
            fullCompanyName: true,
            shortName: true,
            contactPerson: true,
            contactPhone: true
          }
        },
        incidentType: {
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      }
    });

    console.log("Incident updated successfully:", updatedIncident);

    // Transform the updated incident to match frontend interface
    const transformedIncident = {
      ...updatedIncident,
      incidentType: updatedIncident.incidentType.name, // Convert incidentType object to string
      startDate: updatedIncident.startDate.toISOString(),
      endDate: updatedIncident.endDate?.toISOString() || null,
      createdAt: updatedIncident.createdAt.toISOString(),
      updatedAt: updatedIncident.updatedAt.toISOString(),
      userAssessmentDate: updatedIncident.userAssessmentDate?.toISOString() || null,
      adminAssessmentDate: updatedIncident.adminAssessmentDate?.toISOString() || null
    };

    return NextResponse.json({
      message: "Incident updated successfully",
      data: transformedIncident
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    console.log("Getting incident:", id);

    const incident = await db.incident.findUnique({
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
        customer: {
          select: {
            id: true,
            fullCompanyName: true,
            shortName: true,
            contactPerson: true,
            contactPhone: true
          }
        },
        incidentType: {
          select: {
            id: true,
            name: true,
            description: true
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
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
