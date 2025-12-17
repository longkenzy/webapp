import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { ReceivingCaseStatus } from "@prisma/client";
import { convertToVietnamTime } from "@/lib/date-utils";

import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);


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
    const receivingCase = await db.receivingCase.findUnique({
      where: { id },
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

    if (!receivingCase) {
      return NextResponse.json({ error: "Receiving case not found" }, { status: 404 });
    }

    return NextResponse.json(receivingCase);
  } catch (error) {
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

    const {
      title,
      description,
      requesterId,
      handlerId,
      supplierId,
      form,
      startDate,
      endDate,
      status,
      notes,
      crmReferenceCode,
      userDifficultyLevel,
      userEstimatedTime,
      userImpactLevel,
      userUrgencyLevel,
      userFormScore,
      adminDifficultyLevel,
      adminEstimatedTime,
      adminImpactLevel,
      adminUrgencyLevel,
      adminAssessmentNotes,
      inProgressAt,
      products
    } = body;


    // Check if receiving case exists
    const existingCase = await db.receivingCase.findUnique({
      where: { id }
    });

    if (!existingCase) {
      return NextResponse.json({ error: "Receiving case not found" }, { status: 404 });
    }


    // Validate requesterId if provided
    if (requesterId && requesterId !== existingCase.requesterId) {
      const employee = await db.employee.findUnique({
        where: { id: requesterId }
      });
      if (!employee) {
        return NextResponse.json({ error: "Requester not found" }, { status: 400 });
      }
    }

    // Validate handlerId if provided
    if (handlerId && handlerId !== existingCase.handlerId) {
      const employee = await db.employee.findUnique({
        where: { id: handlerId }
      });
      if (!employee) {
        return NextResponse.json({ error: "Handler not found" }, { status: 400 });
      }
    }

    // Validate supplierId if provided
    if (supplierId && supplierId !== existingCase.supplierId) {
      const supplier = await db.partner.findUnique({
        where: { id: supplierId }
      });
      if (!supplier) {
        return NextResponse.json({ error: "Supplier not found" }, { status: 400 });
      }
    }

    // Prepare update data
    const updateData: any = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (requesterId !== undefined) updateData.requesterId = requesterId;
    if (handlerId !== undefined) updateData.handlerId = handlerId;
    if (supplierId !== undefined) updateData.supplierId = supplierId;
    if (form !== undefined) updateData.form = form;
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;

    // Auto-set status to COMPLETED if endDate is provided but status is not COMPLETED
    let finalStatus = status;
    if (endDate && status !== 'COMPLETED' && status !== undefined) {
      finalStatus = 'COMPLETED';
    }

    if (finalStatus !== undefined) updateData.status = finalStatus;

    // Handle inProgressAt field
    if (body.inProgressAt !== undefined && body.inProgressAt !== null) {
      try {
        updateData.inProgressAt = dayjs(body.inProgressAt).tz('Asia/Ho_Chi_Minh').toDate();
      } catch (error) {
        // Skip this field if there's an error
      }
    } else if (body.inProgressAt === null) {
      // Only set to null if explicitly passed as null
      updateData.inProgressAt = null;
    }
    if (notes !== undefined) updateData.notes = notes;
    if (crmReferenceCode !== undefined) updateData.crmReferenceCode = crmReferenceCode;

    // User assessment fields
    if (userDifficultyLevel !== undefined) updateData.userDifficultyLevel = parseInt(userDifficultyLevel);
    if (userEstimatedTime !== undefined) updateData.userEstimatedTime = parseInt(userEstimatedTime);
    if (userImpactLevel !== undefined) updateData.userImpactLevel = parseInt(userImpactLevel);
    if (userUrgencyLevel !== undefined) updateData.userUrgencyLevel = parseInt(userUrgencyLevel);
    if (userFormScore !== undefined) updateData.userFormScore = parseInt(userFormScore);

    // Admin assessment fields
    if (adminDifficultyLevel !== undefined) updateData.adminDifficultyLevel = parseInt(adminDifficultyLevel);
    if (adminEstimatedTime !== undefined) updateData.adminEstimatedTime = parseInt(adminEstimatedTime);
    if (adminImpactLevel !== undefined) updateData.adminImpactLevel = parseInt(adminImpactLevel);
    if (adminUrgencyLevel !== undefined) updateData.adminUrgencyLevel = parseInt(adminUrgencyLevel);
    if (adminAssessmentNotes !== undefined) updateData.adminAssessmentNotes = adminAssessmentNotes;

    // Set user assessment date if any user field is updated
    if (userDifficultyLevel !== undefined || userEstimatedTime !== undefined ||
      userImpactLevel !== undefined || userUrgencyLevel !== undefined || userFormScore !== undefined) {
      updateData.userAssessmentDate = dayjs().tz('Asia/Ho_Chi_Minh').toDate();
    }

    // Set admin assessment date if any admin field is updated
    if (adminDifficultyLevel !== undefined || adminEstimatedTime !== undefined ||
      adminImpactLevel !== undefined || adminUrgencyLevel !== undefined) {
      updateData.adminAssessmentDate = dayjs().tz('Asia/Ho_Chi_Minh').toDate();
    }

    // Handle products update
    if (products !== undefined) {

      // Delete existing products
      await db.receivingCaseProduct.deleteMany({
        where: { receivingCaseId: id }
      });

      // Add new products
      if (products && products.length > 0) {
        updateData.products = {
          create: products.map((product: any) => ({
            name: product.name,
            code: product.code || null,
            quantity: Math.max(1, parseInt(String(product.quantity)) || 1), // Convert to integer, minimum 1
            serialNumber: product.serialNumber || null,
            inProgressAt: product.inProgressAt ? dayjs(product.inProgressAt).tz('Asia/Ho_Chi_Minh').toDate() : null
          }))
        };
      }
    }


    try {
      const updatedCase = await db.receivingCase.update({
        where: { id },
        data: updateData,
        include: {
          requester: {
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
              serialNumber: true,
              inProgressAt: true
            }
          }
        }
      });

      return NextResponse.json(updatedCase);
    } catch (dbError) {
      console.error('Database update error:', dbError);
      return NextResponse.json({
        error: "Database update failed",
        details: dbError instanceof Error ? dbError.message : 'Unknown database error'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
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
    // Check if receiving case exists
    const existingCase = await db.receivingCase.findUnique({
      where: { id }
    });

    if (!existingCase) {
      return NextResponse.json({ error: "Receiving case not found" }, { status: 404 });
    }

    // Delete the receiving case (cascade will handle related records)
    await db.receivingCase.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Receiving case deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
