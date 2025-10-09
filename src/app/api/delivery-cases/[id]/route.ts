import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { db } from '@/lib/db';
import { convertToVietnamTime } from "@/lib/date-utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const deliveryCase = await db.deliveryCase.findUnique({
      where: {
        id: id
      },
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
        customer: {
          select: {
            id: true,
            shortName: true,
            fullCompanyName: true,
            contactPerson: true,
            contactPhone: true
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
        },
        _count: {
          select: {
            comments: true,
            worklogs: true,
            products: true
          }
        }
      }
    });

    if (!deliveryCase) {
      return NextResponse.json({ error: 'Delivery case not found' }, { status: 404 });
    }

    return NextResponse.json(deliveryCase);

  } catch (error) {
    console.error('Error fetching delivery case:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    
    const {
      title,
      description,
      requesterId,
      handlerId,
      customerId,
      form,
      startDate,
      endDate,
      status,
      notes,
      crmReferenceCode,
      // User assessment fields
      userDifficultyLevel,
      userEstimatedTime,
      userImpactLevel,
      userUrgencyLevel,
      userFormScore,
      // Admin assessment fields
      adminDifficultyLevel,
      adminEstimatedTime,
      adminImpactLevel,
      adminUrgencyLevel,
      adminAssessmentNotes,
      inProgressAt,
      products
    } = body;

    // Check if delivery case exists
    const existingCase = await db.deliveryCase.findUnique({
      where: {
        id: id
      },
      select: { startDate: true, inProgressAt: true }
    });

    if (!existingCase) {
      return NextResponse.json({ error: 'Delivery case not found' }, { status: 404 });
    }

    // Validate end date (only if both dates exist) - allow any past/future dates
    if (endDate && endDate !== null && endDate !== '') {
      const startDateToCheck = startDate ? new Date(startDate) : new Date(existingCase.startDate);
      const endDateObj = new Date(endDate);
      
      if (endDateObj <= startDateToCheck) {
        return NextResponse.json({ 
          error: "Ngày kết thúc phải lớn hơn ngày bắt đầu" 
        }, { status: 400 });
      }
      
      // Validate end date with inProgressAt if it exists
      if (existingCase.inProgressAt) {
        const inProgressDate = new Date(existingCase.inProgressAt);
        if (endDateObj <= inProgressDate) {
          return NextResponse.json({ 
            error: "Ngày kết thúc phải lớn hơn thời gian đang xử lý" 
          }, { status: 400 });
        }
      }
    }

    // Build update data dynamically
    const updateData: any = {
      updatedAt: new Date()
    };
    
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (form !== undefined) updateData.form = form;
    if (startDate !== undefined) updateData.startDate = convertToVietnamTime(startDate);
    if (endDate !== undefined) {
      if (endDate === null || endDate === '') {
        updateData.endDate = null;
      } else {
        updateData.endDate = convertToVietnamTime(endDate);
      }
    }
    // Auto-set status to COMPLETED if endDate is provided but status is not COMPLETED
    let finalStatus = status;
    if (endDate && status !== 'COMPLETED' && status !== undefined) {
      finalStatus = 'COMPLETED';
    }
    
    if (finalStatus !== undefined) updateData.status = finalStatus;
    
    // Handle inProgressAt field
    if (inProgressAt !== undefined && inProgressAt !== null) {
      try {
        updateData.inProgressAt = new Date(inProgressAt);
      } catch (error) {
        // Skip this field if there's an error
      }
    } else if (inProgressAt === null) {
      // Only set to null if explicitly passed as null
      updateData.inProgressAt = null;
    }
    
    if (notes !== undefined) updateData.notes = notes;
    if (crmReferenceCode !== undefined) updateData.crmReferenceCode = crmReferenceCode;
    
    // Handle Prisma relations using connect/disconnect syntax
    if (handlerId !== undefined) {
      updateData.handler = { connect: { id: handlerId } };
    }
    
    if (requesterId !== undefined) {
      updateData.requester = { connect: { id: requesterId } };
    }
    
    if (customerId !== undefined) {
      if (customerId) {
        updateData.customer = { connect: { id: customerId } };
      } else {
        updateData.customer = { disconnect: true };
      }
    }
    
    // User assessment fields
    if (userDifficultyLevel !== undefined) updateData.userDifficultyLevel = userDifficultyLevel ? parseInt(userDifficultyLevel) : null;
    if (userEstimatedTime !== undefined) updateData.userEstimatedTime = userEstimatedTime ? parseInt(userEstimatedTime) : null;
    if (userImpactLevel !== undefined) updateData.userImpactLevel = userImpactLevel ? parseInt(userImpactLevel) : null;
    if (userUrgencyLevel !== undefined) updateData.userUrgencyLevel = userUrgencyLevel ? parseInt(userUrgencyLevel) : null;
    if (userFormScore !== undefined) updateData.userFormScore = userFormScore ? parseInt(userFormScore) : null;
    
    // Admin assessment fields
    if (adminDifficultyLevel !== undefined) updateData.adminDifficultyLevel = adminDifficultyLevel ? parseInt(adminDifficultyLevel) : null;
    if (adminEstimatedTime !== undefined) updateData.adminEstimatedTime = adminEstimatedTime ? parseInt(adminEstimatedTime) : null;
    if (adminImpactLevel !== undefined) updateData.adminImpactLevel = adminImpactLevel ? parseInt(adminImpactLevel) : null;
    if (adminUrgencyLevel !== undefined) updateData.adminUrgencyLevel = adminUrgencyLevel ? parseInt(adminUrgencyLevel) : null;
    if (adminAssessmentNotes !== undefined) updateData.adminAssessmentNotes = adminAssessmentNotes;
    
    // Set user assessment date if any user field is updated
    if (userDifficultyLevel !== undefined || userEstimatedTime !== undefined || 
        userImpactLevel !== undefined || userUrgencyLevel !== undefined || userFormScore !== undefined) {
      updateData.userAssessmentDate = new Date();
    }
    
    // Set admin assessment date if any admin field is updated
    if (adminDifficultyLevel !== undefined || adminEstimatedTime !== undefined || 
        adminImpactLevel !== undefined || adminUrgencyLevel !== undefined) {
      updateData.adminAssessmentDate = new Date();
    }

    // Update delivery case
    const updatedCase = await db.deliveryCase.update({
      where: { id: id },
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
        customer: {
          select: {
            id: true,
            shortName: true,
            fullCompanyName: true,
            contactPerson: true,
            contactPhone: true
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
        },
        _count: {
          select: {
            comments: true,
            worklogs: true,
            products: true
          }
        }
      }
    });

    // Update products if provided
    if (products && Array.isArray(products)) {
      // Delete existing products
      await db.deliveryCaseProduct.deleteMany({
        where: { deliveryCaseId: id }
      });

      // Create new products
      if (products.length > 0) {
        await db.deliveryCaseProduct.createMany({
          data: products.map((product: any) => ({
            deliveryCaseId: id,
            name: product.name,
            code: product.code || null,
            quantity: product.quantity,
            serialNumber: product.serialNumber || null,
            inProgressAt: product.inProgressAt ? new Date(product.inProgressAt) : null
          }))
        });
      }

      // Fetch updated case with products
      const finalCase = await db.deliveryCase.findUnique({
        where: { id: id },
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
          customer: {
            select: {
              id: true,
              shortName: true,
              fullCompanyName: true,
              contactPerson: true,
              contactPhone: true
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
          },
          _count: {
            select: {
              comments: true,
              worklogs: true,
              products: true
            }
          }
        }
      });

      return NextResponse.json(finalCase);
    }

    return NextResponse.json(updatedCase);

  } catch (error) {
    console.error('Error updating delivery case:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    // Check if delivery case exists
    const existingCase = await db.deliveryCase.findUnique({
      where: {
        id: id
      }
    });

    if (!existingCase) {
      return NextResponse.json({ error: 'Delivery case not found' }, { status: 404 });
    }

    // Delete delivery case (products will be deleted automatically due to cascade)
    await db.deliveryCase.delete({
      where: { id: id }
    });

    return NextResponse.json({ message: 'Delivery case deleted successfully' });

  } catch (error) {
    console.error('Error deleting delivery case:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
