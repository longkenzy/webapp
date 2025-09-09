import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

// Mock warranty data (same as in route.ts)
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
      status,
      customerId,
      notes
    } = body;

    // Find the warranty in mock data
    const warrantyIndex = mockWarranties.findIndex(w => w.id === id);
    if (warrantyIndex === -1) {
      return NextResponse.json(
        { error: "Warranty not found" },
        { status: 404 }
      );
    }

    // Update the warranty
    const updatedWarranty = {
      ...mockWarranties[warrantyIndex],
      endDate: endDate ? new Date(endDate).toISOString() : mockWarranties[warrantyIndex].endDate,
      status: status || mockWarranties[warrantyIndex].status,
      customer: customerId ? {
        ...mockWarranties[warrantyIndex].customer,
        id: customerId
      } : mockWarranties[warrantyIndex].customer,
      notes: notes !== undefined ? notes : mockWarranties[warrantyIndex].notes,
      updatedAt: new Date().toISOString()
    };

    // Update in mock array
    mockWarranties[warrantyIndex] = updatedWarranty;

    console.log("Warranty updated successfully:", updatedWarranty);

    return NextResponse.json({
      message: "Warranty updated successfully",
      data: updatedWarranty
    });

  } catch (error) {
    console.error("Error updating warranty:", error);
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
    const { id } = await params;
    console.log("=== Get Warranty API Called ===");
    console.log("Warranty ID:", id);
    
    const session = await getSession();
    if (!session) {
      console.log("No session found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log("Session found:", session.user?.email);

    // Find the warranty in mock data
    const warranty = mockWarranties.find(w => w.id === id);
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
