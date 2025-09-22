import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

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

    const warrantyType = await db.warrantyType.findUnique({
      where: { id },
    });

    if (!warrantyType) {
      return NextResponse.json(
        { error: "Warranty type not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: warrantyType });

  } catch (error) {
    console.error("Error fetching warranty type:", error);
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

    // Check if warranty type with same name already exists (excluding current one)
    const existingType = await db.warrantyType.findFirst({
      where: {
        name: name.trim(),
        id: { not: id }
      }
    });

    if (existingType) {
      return NextResponse.json(
        { error: "Warranty type with this name already exists" },
        { status: 409 }
      );
    }

    const updatedWarrantyType = await db.warrantyType.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json({
      data: updatedWarrantyType
    });

  } catch (error) {
    console.error("Error updating warranty type:", error);
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

    // Check if there are any warranties using this type
    const warrantiesCount = await db.warranty.count({
      where: { warrantyTypeId: id },
    });

    if (warrantiesCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete warranty type. It is being used by ${warrantiesCount} warranty case(s).` },
        { status: 400 }
      );
    }

    await db.warrantyType.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Warranty type deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting warranty type:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
