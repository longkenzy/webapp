import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { ReceivingCaseStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  console.log('=== API Receiving Case GET START ===');
  
  try {
    console.log('Getting session...');
    const session = await getSession();
    console.log('Session result:', session ? 'Found' : 'Not found');
    
    if (!session) {
      console.log('No session found - returning 401');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log('Session found:', session.user?.email);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') as ReceivingCaseStatus | null;
    const search = searchParams.get('search');
    const receiverId = searchParams.get('receiverId');
    const supplierId = searchParams.get('supplierId');

    console.log('Query params:', { page, limit, status, search, receiverId, supplierId });

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (receiverId) {
      where.handlerId = receiverId;
    }
    if (supplierId) {
      where.supplierId = supplierId;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { requester: { fullName: { contains: search, mode: 'insensitive' } } },
        { handler: { fullName: { contains: search, mode: 'insensitive' } } },
        { supplier: { shortName: { contains: search, mode: 'insensitive' } } }
      ];
    }

    console.log('Where clause:', where);

    console.log('Starting database query...');
    const [receivingCases, total] = await Promise.all([
      db.receivingCase.findMany({
        where,
        include: {
          requester: {
            select: {
              id: true,
              fullName: true,
              position: true,
              department: true,
              companyEmail: true
            }
          },
          handler: {
            select: {
              id: true,
              fullName: true,
              position: true,
              department: true,
              companyEmail: true
            }
          },
          supplier: {
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
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      db.receivingCase.count({ where })
    ]);

    console.log('Database query completed successfully');
    console.log('Query results:', { 
      casesCount: receivingCases.length, 
      total, 
      page, 
      limit 
    });

    console.log('Preparing response...');
    const response = {
      receivingCases,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
    
    console.log('Returning response with', receivingCases.length, 'cases');
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching receiving cases:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  console.log('=== API Receiving Case POST START ===');
  
  try {
    // Check session first
    const session = await getSession();
    if (!session) {
      console.log('No session found');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log('Session found:', session.user?.email);

    // Parse request body
    let body;
    try {
      body = await request.json();
      console.log('Request body parsed successfully:', body);
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    // Extract fields
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
      userDifficultyLevel,
      userEstimatedTime,
      userImpactLevel,
      userUrgencyLevel,
      userFormScore,
      products
    } = body;

    console.log('Extracted fields:', {
      title: !!title,
      description: !!description,
      requesterId: !!requesterId,
      handlerId: !!handlerId,
      supplierId: !!supplierId,
      startDate: !!startDate,
      userDifficultyLevel: !!userDifficultyLevel,
      userEstimatedTime: !!userEstimatedTime,
      userImpactLevel: !!userImpactLevel,
      userUrgencyLevel: !!userUrgencyLevel,
      userFormScore: !!userFormScore
    });

    // Validate required fields
    const missingFields = [];
    if (!title) missingFields.push('title');
    if (!description) missingFields.push('description');
    if (!requesterId) missingFields.push('requesterId');
    if (!handlerId) missingFields.push('handlerId');
    if (!supplierId) missingFields.push('supplierId');
    if (!startDate) missingFields.push('startDate');

    if (missingFields.length > 0) {
      console.log('Missing required fields:', missingFields);
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate evaluation fields
    const missingEvalFields = [];
    if (!userDifficultyLevel) missingEvalFields.push('userDifficultyLevel');
    if (!userEstimatedTime) missingEvalFields.push('userEstimatedTime');
    if (!userImpactLevel) missingEvalFields.push('userImpactLevel');
    if (!userUrgencyLevel) missingEvalFields.push('userUrgencyLevel');
    if (!userFormScore) missingEvalFields.push('userFormScore');

    if (missingEvalFields.length > 0) {
      console.log('Missing evaluation fields:', missingEvalFields);
      return NextResponse.json(
        { error: `Missing evaluation fields: ${missingEvalFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Check if employee and partner exist
    console.log('Checking employee and partner existence...');
    const [employee, partner] = await Promise.all([
      db.employee.findUnique({ where: { id: requesterId } }),
      db.partner.findUnique({ where: { id: supplierId } })
    ]);

    if (!employee) {
      console.log('Employee not found:', requesterId);
      return NextResponse.json(
        { error: `Employee not found with ID: ${requesterId}` },
        { status: 400 }
      );
    }

    if (!partner) {
      console.log('Partner not found:', supplierId);
      return NextResponse.json(
        { error: `Partner not found with ID: ${supplierId}` },
        { status: 400 }
      );
    }

    console.log('Employee and partner found:', {
      employee: employee.fullName,
      partner: partner.shortName
    });

    // Prepare data for creation
    const caseData = {
      title,
      description,
      requesterId,
      handlerId,
      supplierId,
      form: form || 'Onsite',
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      status: (status as ReceivingCaseStatus) || ReceivingCaseStatus.RECEIVED,
      notes: notes || null,
      userDifficultyLevel: parseInt(userDifficultyLevel),
      userEstimatedTime: parseInt(userEstimatedTime),
      userImpactLevel: parseInt(userImpactLevel),
      userUrgencyLevel: parseInt(userUrgencyLevel),
      userFormScore: parseInt(userFormScore),
      userAssessmentDate: new Date()
    };

    console.log('Creating receiving case with data:', caseData);

    // Handle products from request body
    let productsData = [];
    if (products && Array.isArray(products)) {
      productsData = products;
    } else if (description && typeof description === 'string') {
      try {
        // Try to parse as JSON (legacy format)
        productsData = JSON.parse(description);
      } catch (e) {
        // If not JSON, treat as plain text
        productsData = [];
      }
    }

    // Create the receiving case with products
    const receivingCase = await db.receivingCase.create({
      data: {
        ...caseData,
        products: {
          create: productsData.map((product: any) => ({
            name: product.name || '',
            code: product.code || null,
            quantity: parseInt(product.quantity) || 1,
            serialNumber: product.serialNumber || null
          }))
        }
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

    console.log('Successfully created receiving case:', receivingCase.id);
    return NextResponse.json(receivingCase, { status: 201 });

  } catch (error) {
    console.error("Error creating receiving case:", error);
    
    // More detailed error handling
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      
      // Check for specific Prisma errors
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: "A case with this information already exists" },
          { status: 409 }
        );
      }
      
      if (error.message.includes('Foreign key constraint')) {
        return NextResponse.json(
          { error: "Invalid reference to employee or partner" },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}