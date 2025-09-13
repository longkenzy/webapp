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
    
    const {
      adminDifficultyLevel,
      adminEstimatedTime,
      adminImpactLevel,
      adminUrgencyLevel
    } = body;

    // Validate required fields
    if (!adminDifficultyLevel || !adminEstimatedTime || !adminImpactLevel || !adminUrgencyLevel) {
      return NextResponse.json(
        { error: "All evaluation fields are required" },
        { status: 400 }
      );
    }

    // Update warranty with admin evaluation (optimized query)
    const updatedWarranty = await db.warranty.update({
      where: { id },
      data: {
        adminDifficultyLevel: parseInt(adminDifficultyLevel),
        adminEstimatedTime: parseInt(adminEstimatedTime),
        adminImpactLevel: parseInt(adminImpactLevel),
        adminUrgencyLevel: parseInt(adminUrgencyLevel),
        adminAssessmentDate: new Date()
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        startDate: true,
        endDate: true,
        userDifficultyLevel: true,
        userEstimatedTime: true,
        userImpactLevel: true,
        userUrgencyLevel: true,
        userFormScore: true,
        adminDifficultyLevel: true,
        adminEstimatedTime: true,
        adminImpactLevel: true,
        adminUrgencyLevel: true,
        userAssessmentDate: true,
        adminAssessmentDate: true,
        createdAt: true,
        updatedAt: true,
        reporter: { select: { id: true, fullName: true, position: true } },
        handler: { select: { id: true, fullName: true, position: true } },
        warrantyType: { select: { id: true, name: true } },
        customer: { select: { id: true, fullCompanyName: true, shortName: true } }
      }
    });

    return NextResponse.json({
      message: "Warranty evaluation updated successfully",
      data: updatedWarranty
    });

  } catch (error) {
    console.error("Error updating warranty evaluation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
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

    // Get warranty with evaluation data
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

    return NextResponse.json({
      data: warranty
    });

  } catch (error) {
    console.error("Error fetching warranty evaluation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
