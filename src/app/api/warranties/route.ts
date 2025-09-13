import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
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
      warrantyType,
      customerId,
      customerName,
      startDate,
      endDate,
      status,
      notes,
      // User assessment fields
      userDifficultyLevel,
      userEstimatedTime,
      userImpactLevel,
      userUrgencyLevel,
      userFormScore
    } = body;

    // Validate required fields
    if (!title || !description || !handlerId || !warrantyType || !customerName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate end date
    if (endDate && new Date(endDate) <= new Date(startDate)) {
      return NextResponse.json({ 
        error: "Ngày kết thúc phải lớn hơn ngày bắt đầu" 
      }, { status: 400 });
    }

    // Get warranty type and default employee in parallel
    const [warrantyTypeRecord, defaultEmployee] = await Promise.all([
      db.warrantyType.findFirst({ where: { name: warrantyType } }),
      db.employee.findFirst()
    ]);

    if (!warrantyTypeRecord) {
      return NextResponse.json(
        { error: "Invalid warranty type" },
        { status: 400 }
      );
    }

    if (!defaultEmployee) {
      return NextResponse.json(
        { error: 'No employees found' },
        { status: 400 }
      );
    }

    // Create new warranty in database
    const newWarranty = await db.warranty.create({
      data: {
        title,
        description,
        reporterId: defaultEmployee.id,
        handlerId,
        warrantyTypeId: warrantyTypeRecord.id,
        customerId: customerId || null,
        customerName,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        status: status || 'RECEIVED',
        notes: notes || null,
        // User assessment fields
        userDifficultyLevel: userDifficultyLevel ? parseInt(userDifficultyLevel) : null,
        userEstimatedTime: userEstimatedTime ? parseInt(userEstimatedTime) : null,
        userImpactLevel: userImpactLevel ? parseInt(userImpactLevel) : null,
        userUrgencyLevel: userUrgencyLevel ? parseInt(userUrgencyLevel) : null,
        userFormScore: userFormScore ? parseInt(userFormScore) : null,
        userAssessmentDate: new Date()
      },
      include: {
        reporter: { select: { id: true, fullName: true, position: true } },
        handler: { select: { id: true, fullName: true, position: true } },
        warrantyType: { select: { id: true, name: true } },
        customer: { select: { id: true, fullCompanyName: true, shortName: true } }
      }
    });

    return NextResponse.json({
      message: "Warranty created successfully",
      data: newWarranty
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating warranty:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 100); // Max 100 items
    const status = searchParams.get("status");
    const warrantyType = searchParams.get("warrantyType");
    const customerId = searchParams.get("customerId");

    // Build where clause
    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    if (warrantyType) {
      where.warrantyType = {
        name: warrantyType
      };
    }
    if (customerId) {
      where.customerId = customerId;
    }

    // Get warranties from database with pagination
    const skip = (page - 1) * limit;
    
    const [warranties, total] = await Promise.all([
      db.warranty.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          reporter: { select: { id: true, fullName: true, position: true } },
          handler: { select: { id: true, fullName: true, position: true } },
          warrantyType: { select: { id: true, name: true } },
          customer: { select: { id: true, fullCompanyName: true, shortName: true } }
        }
      }),
      db.warranty.count({ where })
    ]);
    
    const response = NextResponse.json({
      data: warranties,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

    // Add caching headers for better performance
    response.headers.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
    return response;

  } catch (error) {
    console.error("Error fetching warranties:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}