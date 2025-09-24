import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    console.log("Updating deployment type:", { id, name, description });

    // Check if deployment type exists
    const existingType = await db.deploymentType.findUnique({
      where: { id }
    });

    if (!existingType) {
      return NextResponse.json(
        { error: "Deployment type not found" },
        { status: 404 }
      );
    }

    // Update deployment type
    const deploymentType = await db.deploymentType.update({
      where: { id },
      data: {
        name,
        description: description || null
      }
    });

    console.log("Deployment type updated successfully:", deploymentType);

    return NextResponse.json({
      message: "Deployment type updated successfully",
      data: deploymentType
    });

  } catch (error) {
    console.error("Error updating deployment type:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    console.log("Deleting deployment type:", { id });

    // Check if deployment type exists
    const existingType = await db.deploymentType.findUnique({
      where: { id }
    });

    if (!existingType) {
      return NextResponse.json(
        { error: "Deployment type not found" },
        { status: 404 }
      );
    }

    // Check if deployment type is being used by any cases
    const casesUsingType = await db.deploymentCase.count({
      where: { deploymentTypeId: id }
    });

    if (casesUsingType > 0) {
      return NextResponse.json(
        { error: `Cannot delete deployment type. It is being used by ${casesUsingType} case(s). Please reassign or delete those cases first.` },
        { status: 400 }
      );
    }

    // Soft delete by setting isActive to false
    const deploymentType = await db.deploymentType.update({
      where: { id },
      data: {
        isActive: false
      }
    });

    console.log("Deployment type deleted successfully:", deploymentType);

    return NextResponse.json({
      message: "Deployment type deleted successfully",
      data: deploymentType
    });

  } catch (error) {
    console.error("Error deleting deployment type:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
