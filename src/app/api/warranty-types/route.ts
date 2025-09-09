import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

// Mock warranty types data
const mockWarrantyTypes = [
  {
    id: "warranty-type-1",
    name: "hardware-warranty",
    description: "Bảo hành phần cứng",
    isActive: true
  },
  {
    id: "warranty-type-2", 
    name: "software-warranty",
    description: "Bảo hành phần mềm",
    isActive: true
  },
  {
    id: "warranty-type-3",
    name: "service-warranty", 
    description: "Bảo hành dịch vụ",
    isActive: true
  },
  {
    id: "warranty-type-4",
    name: "extended-warranty",
    description: "Bảo hành mở rộng", 
    isActive: true
  },
  {
    id: "warranty-type-5",
    name: "replacement-warranty",
    description: "Bảo hành thay thế",
    isActive: true
  },
  {
    id: "warranty-type-6",
    name: "repair-warranty",
    description: "Bảo hành sửa chữa",
    isActive: true
  }
];

export async function GET(request: NextRequest) {
  try {
    console.log("=== GET Warranty Types API Called ===");
    
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Session found:", session.user?.email);

    // Get all active warranty types
    const warrantyTypes = mockWarrantyTypes.filter(type => type.isActive);

    const response = NextResponse.json({
      data: warrantyTypes
    });

    // Add caching headers
    response.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    
    return response;

  } catch (error) {
    console.error("Error fetching warranty types:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("=== POST Warranty Types API Called ===");
    
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Session found:", session.user?.email);

    const body = await request.json();
    const { name, description } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    // Check if warranty type already exists
    const existingType = mockWarrantyTypes.find(type => type.name === name.trim());

    if (existingType) {
      return NextResponse.json(
        { error: "Warranty type already exists" },
        { status: 409 }
      );
    }

    // Create new warranty type
    const newWarrantyType = {
      id: `warranty-type-${Date.now()}`,
      name: name.trim(),
      description: description?.trim() || null,
      isActive: true
    };

    // Add to mock array
    mockWarrantyTypes.push(newWarrantyType);

    console.log("Warranty type created:", newWarrantyType);

    return NextResponse.json({
      data: newWarrantyType
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating warranty type:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
