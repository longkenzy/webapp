import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { db } from '@/lib/db';

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
      status,
      endDate,
      description,
      crmReferenceCode,
      products
    } = body;

    // Check if delivery case exists
    const existingCase = await db.deliveryCase.findUnique({
      where: {
        id: id
      }
    });

    if (!existingCase) {
      return NextResponse.json({ error: 'Delivery case not found' }, { status: 404 });
    }

    // Update delivery case
    const updatedCase = await db.deliveryCase.update({
      where: { id: id },
      data: {
        status,
        endDate: endDate ? new Date(endDate) : null,
        description,
        crmReferenceCode: crmReferenceCode || null,
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
            serialNumber: product.serialNumber || null
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
