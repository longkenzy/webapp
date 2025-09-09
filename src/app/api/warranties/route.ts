import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

// Mock warranty data for now (since we're not creating database tables)
const mockWarranties = [
  {
    id: "warranty-1",
    title: "Bảo hành máy tính Dell OptiPlex 7090",
    description: "Máy tính bị lỗi không khởi động được, cần kiểm tra và sửa chữa",
    reporter: {
      id: "emp-1",
      fullName: "Nguyễn Văn A",
      position: "Nhân viên IT",
      department: "Phòng IT"
    },
    handler: {
      id: "emp-2", 
      fullName: "Trần Thị B",
      position: "Kỹ thuật viên",
      department: "Phòng IT"
    },
    warrantyType: "hardware-warranty",
    customer: {
      id: "partner-1",
      fullCompanyName: "Công ty TNHH ABC",
      shortName: "ABC Corp",
      contactPerson: "Lê Văn C",
      contactPhone: "0123456789"
    },
    status: "INVESTIGATING",
    startDate: "2024-01-15T08:00:00.000Z",
    endDate: null,
    createdAt: "2024-01-15T08:00:00.000Z",
    updatedAt: "2024-01-15T08:00:00.000Z",
    notes: "Đã liên hệ khách hàng, đang chờ phản hồi",
    userDifficultyLevel: 3,
    userEstimatedTime: 4,
    userImpactLevel: 2,
    userUrgencyLevel: 3,
    userFormScore: 2,
    userAssessmentDate: "2024-01-15T08:00:00.000Z"
  },
  {
    id: "warranty-2",
    title: "Bảo hành phần mềm Office 365",
    description: "Khách hàng gặp lỗi không thể đăng nhập vào Office 365",
    reporter: {
      id: "emp-3",
      fullName: "Phạm Văn D",
      position: "Nhân viên hỗ trợ",
      department: "Phòng IT"
    },
    handler: {
      id: "emp-4",
      fullName: "Hoàng Thị E", 
      position: "Chuyên viên phần mềm",
      department: "Phòng IT"
    },
    warrantyType: "software-warranty",
    customer: {
      id: "partner-2",
      fullCompanyName: "Công ty Cổ phần XYZ",
      shortName: "XYZ JSC",
      contactPerson: "Vũ Văn F",
      contactPhone: "0987654321"
    },
    status: "RESOLVED",
    startDate: "2024-01-10T09:00:00.000Z",
    endDate: "2024-01-12T16:30:00.000Z",
    createdAt: "2024-01-10T09:00:00.000Z",
    updatedAt: "2024-01-12T16:30:00.000Z",
    notes: "Đã reset password và cấu hình lại tài khoản",
    userDifficultyLevel: 2,
    userEstimatedTime: 3,
    userImpactLevel: 3,
    userUrgencyLevel: 2,
    userFormScore: 1,
    userAssessmentDate: "2024-01-10T09:00:00.000Z"
  }
];

export async function POST(request: NextRequest) {
  try {
    console.log("=== Warranty API Called ===");
    
    const session = await getSession();
    if (!session) {
      console.log("No session found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log("Session found:", session.user?.email);

    const body = await request.json();
    console.log("Request body:", body);
    
    const {
      title,
      description,
      reporterId,
      handlerId,
      warrantyType,
      customerId,
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
    if (!title || !description || !reporterId || !handlerId || !warrantyType) {
      console.log("Missing required fields:", { title, description, reporterId, handlerId, warrantyType });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate end date
    if (endDate) {
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      
      if (endDateObj <= startDateObj) {
        console.log("Invalid end date:", { startDate, endDate });
        return NextResponse.json({ 
          error: "Ngày kết thúc phải lớn hơn ngày bắt đầu" 
        }, { status: 400 });
      }
    }

    // Create new warranty (mock)
    const newWarranty = {
      id: `warranty-${Date.now()}`,
      title,
      description,
      reporter: {
        id: reporterId,
        fullName: "Mock Reporter",
        position: "Mock Position",
        department: "Mock Department"
      },
      handler: {
        id: handlerId,
        fullName: "Mock Handler",
        position: "Mock Position", 
        department: "Mock Department"
      },
      warrantyType,
      customer: customerId ? {
        id: customerId,
        fullCompanyName: "Mock Customer",
        shortName: "Mock",
        contactPerson: "Mock Contact",
        contactPhone: "Mock Phone"
      } : null,
      status: status || "REPORTED",
      startDate: new Date(startDate).toISOString(),
      endDate: endDate ? new Date(endDate).toISOString() : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: notes || null,
      // User assessment fields
      userDifficultyLevel: userDifficultyLevel ? parseInt(userDifficultyLevel) : null,
      userEstimatedTime: userEstimatedTime ? parseInt(userEstimatedTime) : null,
      userImpactLevel: userImpactLevel ? parseInt(userImpactLevel) : null,
      userUrgencyLevel: userUrgencyLevel ? parseInt(userUrgencyLevel) : null,
      userFormScore: userFormScore ? parseInt(userFormScore) : null,
      userAssessmentDate: new Date().toISOString()
    };

    console.log("Warranty created successfully:", newWarranty);

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
    console.log("=== GET Warranties API Called ===");
    console.log("Request headers:", Object.fromEntries(request.headers.entries()));
    
    const session = await getSession();
    console.log("Session found:", session ? "Yes" : "No");
    console.log("Session details:", session);
    
    if (!session) {
      console.log("No session found, returning 401");
      return NextResponse.json({ 
        error: "Unauthorized",
        debug: "No session found. Please ensure you are logged in."
      }, { status: 401 });
    }
    
    console.log("User role:", session.user?.role);
    console.log("User ID:", session.user?.id);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");
    const warrantyType = searchParams.get("warrantyType");
    const customerId = searchParams.get("customerId");

    console.log("Query parameters:", { page, limit, status, warrantyType, customerId });

    // Filter mock data based on query parameters
    let filteredWarranties = [...mockWarranties];
    
    if (status) {
      filteredWarranties = filteredWarranties.filter(w => w.status === status);
    }
    if (warrantyType) {
      filteredWarranties = filteredWarranties.filter(w => w.warrantyType === warrantyType);
    }
    if (customerId) {
      filteredWarranties = filteredWarranties.filter(w => w.customer?.id === customerId);
    }

    // Apply pagination
    const skip = (page - 1) * limit;
    const paginatedWarranties = filteredWarranties.slice(skip, skip + limit);
    const total = filteredWarranties.length;
    
    console.log("Warranties fetched:", paginatedWarranties.length);
    console.log("Total count:", total);

    const response = NextResponse.json({
      data: paginatedWarranties,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

    // Add caching headers
    response.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    response.headers.set('ETag', `"${Date.now()}"`);
    
    return response;

  } catch (error) {
    console.error("=== ERROR in GET Warranties API ===");
    console.error("Error type:", typeof error);
    console.error("Error message:", error instanceof Error ? error.message : String(error));
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack");
    console.error("Full error object:", error);
    
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
