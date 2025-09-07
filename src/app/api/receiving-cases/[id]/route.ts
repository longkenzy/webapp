import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { ReceivingCaseStatus } from "@prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const receivingCase = await db.receivingCase.findUnique({
      where: { id: params.id },
      include: {
        requester: {
          select: {
            id: true,
            fullName: true,
            position: true,
            department: true,
            companyEmail: true,
            primaryPhone: true
          }
        },
        handler: {
          select: {
            id: true,
            fullName: true,
            position: true,
            department: true,
            companyEmail: true,
            primaryPhone: true
          }
        },
        supplier: {
          select: {
            id: true,
            shortName: true,
            fullCompanyName: true,
            address: true,
            contactPerson: true,
            contactPhone: true
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
          orderBy: { createdAt: 'desc' }
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
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!receivingCase) {
      return NextResponse.json({ error: "Receiving case not found" }, { status: 404 });
    }

    return NextResponse.json(receivingCase);
  } catch (error) {
    console.error("Error fetching receiving case:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      handlerId,
      form,
      startDate,
      endDate,
      status,
      notes,
      adminDifficultyLevel,
      adminEstimatedTime,
      adminImpactLevel,
      adminUrgencyLevel,
      adminAssessmentNotes,
      products
    } = body;

    // Check if receiving case exists
    const existingCase = await db.receivingCase.findUnique({
      where: { id: params.id }
    });

    if (!existingCase) {
      return NextResponse.json({ error: "Receiving case not found" }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {};
    
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (handlerId !== undefined) updateData.handlerId = handlerId;
    if (form !== undefined) updateData.form = form;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    // Admin assessment fields
    if (adminDifficultyLevel !== undefined) updateData.adminDifficultyLevel = parseInt(adminDifficultyLevel);
    if (adminEstimatedTime !== undefined) updateData.adminEstimatedTime = parseInt(adminEstimatedTime);
    if (adminImpactLevel !== undefined) updateData.adminImpactLevel = parseInt(adminImpactLevel);
    if (adminUrgencyLevel !== undefined) updateData.adminUrgencyLevel = parseInt(adminUrgencyLevel);
    if (adminAssessmentNotes !== undefined) updateData.adminAssessmentNotes = adminAssessmentNotes;

    // Set admin assessment date if any admin field is updated
    if (adminDifficultyLevel !== undefined || adminEstimatedTime !== undefined || 
        adminImpactLevel !== undefined || adminUrgencyLevel !== undefined) {
      updateData.adminAssessmentDate = new Date();
    }

    // Handle products update
    if (products !== undefined) {
      // Delete existing products
      await db.receivingCaseProduct.deleteMany({
        where: { receivingCaseId: params.id }
      });

      // Add new products
      if (products && products.length > 0) {
        updateData.products = {
          create: products.map((product: any) => ({
            name: product.name,
            code: product.code || null,
            quantity: product.quantity,
            serialNumber: product.serialNumber || null
          }))
        };
      }
    }

    const updatedCase = await db.receivingCase.update({
      where: { id: params.id },
      data: updateData,
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
        supplier: {
          select: {
            id: true,
            shortName: true,
            fullCompanyName: true
          }
        },
        products: {
          select: {
            id: true,
            name: true,
            code: true,
            quantity: true,
            serialNumber: true
          }
        }
      }
    });

    return NextResponse.json(updatedCase);
  } catch (error) {
    console.error("Error updating receiving case:", error);
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

    // Check if receiving case exists
    const existingCase = await db.receivingCase.findUnique({
      where: { id: params.id }
    });

    if (!existingCase) {
      return NextResponse.json({ error: "Receiving case not found" }, { status: 404 });
    }

    // Delete the receiving case (cascade will handle related records)
    await db.receivingCase.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: "Receiving case deleted successfully" });
  } catch (error) {
    console.error("Error deleting receiving case:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
