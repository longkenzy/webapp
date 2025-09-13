import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

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
      status
    } = body;

    // First, let's check if there are any warranties in the database
    const allWarranties = await db.warranty.findMany({
      take: 5,
      include: {
        reporter: true,
        handler: true,
        warrantyType: true,
        customer: true
      }
    }).catch(dbError => {
      console.error("Database error when finding all warranties:", dbError);
      throw dbError;
    });
    
    console.log("Total warranties in database:", allWarranties.length);
    console.log("Sample warranty IDs:", allWarranties.map(w => w.id));

    // Check if warranty exists
    console.log("Checking if warranty exists with ID:", id);
    const existingWarranty = await db.warranty.findUnique({
      where: { id },
      include: {
        reporter: true,
        handler: true,
        warrantyType: true,
        customer: true
      }
    }).catch(dbError => {
      console.error("Database error when finding warranty:", dbError);
      throw dbError;
    });

    if (!existingWarranty) {
      console.log("Warranty not found with ID:", id);
      return NextResponse.json(
        { error: "Warranty not found" },
        { status: 404 }
      );
    }

    console.log("Found existing warranty:", existingWarranty.id);

    // Update the warranty in database
    console.log("Updating warranty with data:", { endDate, status });
    const updatedWarranty = await db.warranty.update({
      where: { id },
      data: {
        endDate: endDate ? new Date(endDate) : null,
        status: status || existingWarranty.status,
        updatedAt: new Date()
      },
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
