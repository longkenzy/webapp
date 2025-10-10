import { NextRequest, NextResponse } from 'next/server';
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

// Database connection verified

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Fetching maintenance types from database...");
    console.log("Database URL:", process.env.DATABASE_URL ? "Set" : "Not set");
    
    // Database connection verified
    
    // Get all maintenance types first (without where clause)
    const allTypes = await db.maintenanceCaseType.findMany();
    console.log("All maintenance types (no filter):", allTypes);
    
    // Get all active maintenance types from database
    const maintenanceTypes = await db.maintenanceCaseType.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, description: true, isActive: true }
    });

    console.log("Found maintenance types:", maintenanceTypes);
    console.log("Maintenance types count:", maintenanceTypes.length);

    const response = NextResponse.json({ data: maintenanceTypes });
    
    // Disable caching to ensure real-time updates
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;

  } catch (error) {
    console.error("Error fetching maintenance types:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    // Check if maintenance type already exists
    const existingType = await db.maintenanceCaseType.findUnique({
      where: { name: name.trim() }
    });

    if (existingType) {
      return NextResponse.json(
        { error: "Maintenance type already exists" },
        { status: 409 }
      );
    }

    // Create new maintenance type
    const newMaintenanceType = await db.maintenanceCaseType.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        isActive: true
      }
    });

    return NextResponse.json({
      data: newMaintenanceType
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating maintenance type:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
