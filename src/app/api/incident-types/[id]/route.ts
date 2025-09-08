import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description, isActive } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    // Check if incident type exists
    const existingType = await db.incidentType.findUnique({
      where: { id }
    });

    if (!existingType) {
      return NextResponse.json(
        { error: "Incident type not found" },
        { status: 404 }
      );
    }

    // Check if name is already taken by another incident type
    const nameExists = await db.incidentType.findFirst({
      where: {
        name: name.trim(),
        id: { not: id }
      }
    });

    if (nameExists) {
      return NextResponse.json(
        { error: "Incident type name already exists" },
        { status: 409 }
      );
    }

    // Update incident type
    const updatedType = await db.incidentType.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        isActive: isActive !== undefined ? isActive : true
      }
    });

    return NextResponse.json({
      data: updatedType
    });

  } catch (error) {
    console.error("Error updating incident type:", error);
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

    // Check if incident type exists
    const existingType = await db.incidentType.findUnique({
      where: { id },
      include: {
        incidents: true
      }
    });

    if (!existingType) {
      return NextResponse.json(
        { error: "Incident type not found" },
        { status: 404 }
      );
    }

    // Check if incident type is being used by any incidents
    if (existingType.incidents.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete incident type that is being used by incidents" },
        { status: 409 }
      );
    }

    // Delete incident type
    await db.incidentType.delete({
      where: { id }
    });

    return NextResponse.json({
      message: "Incident type deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting incident type:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
