import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

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
    
    const { endDate, status } = body;

    // Check if internal case exists
    const existingCase = await db.internalCase.findUnique({
      where: { id },
    });

    if (!existingCase) {
      console.log("Case not found:", id);
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    // Validate end date
    if (endDate) {
      const startDate = new Date(existingCase.startDate);
      const endDateObj = new Date(endDate);
      
      if (endDateObj <= startDate) {
        console.log("Invalid end date:", { startDate, endDate });
        return NextResponse.json({ 
          error: "Ngày kết thúc phải lớn hơn ngày bắt đầu" 
        }, { status: 400 });
      }
    }

    // Update internal case
    const updatedCase = await db.internalCase.update({
      where: { id },
      data: {
        endDate: endDate ? new Date(endDate) : null,
        status: status || existingCase.status,
        updatedAt: new Date()
      },
      include: {
        requester: {
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
