import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

// GET - Lấy thông tin loại case theo ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log("=== Get Case Type by ID API Called ===");
    
    const session = await getSession();
    if (!session) {
      console.log("No session found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log("Session found:", session.user?.email);

    const { id } = await params;
    console.log("Case type ID:", id);

    const caseType = await db.caseType.findUnique({
      where: { id }
    });

    if (!caseType) {
      console.log("Case type not found:", id);
      return NextResponse.json(
        { error: "Loại case không tồn tại" },
        { status: 404 }
      );
    }

    console.log("Case type found:", caseType);

    return NextResponse.json({
      success: true,
      data: caseType
    });

  } catch (error) {
    console.error("Error fetching case type:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// PUT - Cập nhật loại case
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log("=== Update Case Type API Called ===");
    
    const session = await getSession();
    if (!session) {
      console.log("No session found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log("Session found:", session.user?.email);

    const { id } = await params;
    const body = await request.json();
    console.log("Request body:", body);
    
    const {
      name,
      isActive
    } = body;

    // Check if case type exists
    const existingCaseType = await db.caseType.findUnique({
      where: { id }
    });

    if (!existingCaseType) {
      console.log("Case type not found:", id);
      return NextResponse.json(
        { error: "Loại case không tồn tại" },
        { status: 404 }
      );
    }

    // Check if name is being changed and if new name already exists
    if (name && name !== existingCaseType.name) {
      const nameExists = await db.caseType.findFirst({
        where: { 
          name,
          id: { not: id }
        }
      });

      if (nameExists) {
        console.log("Case type name already exists:", name);
        return NextResponse.json(
          { error: "Tên loại case đã tồn tại" },
          { status: 400 }
        );
      }
    }

    // Update case type
    const updatedCaseType = await db.caseType.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) })
      }
    });

    console.log("Case type updated successfully:", updatedCaseType);

    return NextResponse.json({
      success: true,
      message: "Loại case đã được cập nhật thành công",
      data: updatedCaseType
    });

  } catch (error) {
    console.error("Error updating case type:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// DELETE - Xóa loại case
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log("=== Delete Case Type API Called ===");
    
    const session = await getSession();
    if (!session) {
      console.log("No session found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log("Session found:", session.user?.email);

    const { id } = await params;
    console.log("Case type ID to delete:", id);

    // Check if case type exists
    const existingCaseType = await db.caseType.findUnique({
      where: { id }
    });

    if (!existingCaseType) {
      console.log("Case type not found:", id);
      return NextResponse.json(
        { error: "Loại case không tồn tại" },
        { status: 404 }
      );
    }

    // Check if case type is being used by any internal cases
    const casesUsingThisType = await db.internalCase.findFirst({
      where: { caseType: existingCaseType.name }
    });

    if (casesUsingThisType) {
      console.log("Case type is being used by internal cases:", id);
      return NextResponse.json(
        { error: "Không thể xóa loại case đang được sử dụng" },
        { status: 400 }
      );
    }

    // Delete case type
    await db.caseType.delete({
      where: { id }
    });

    console.log("Case type deleted successfully:", id);

    return NextResponse.json({
      success: true,
      message: "Loại case đã được xóa thành công"
    });

  } catch (error) {
    console.error("Error deleting case type:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
