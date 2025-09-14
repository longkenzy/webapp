import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all active warranty types from database
    const warrantyTypes = await db.warrantyType.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, description: true }
    });

    const response = NextResponse.json({ data: warrantyTypes });
    
    // Add caching headers for better performance
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

    // Check if warranty type already exists
    const existingType = await db.warrantyType.findUnique({
      where: { name: name.trim() }
    });

    if (existingType) {
      return NextResponse.json(
        { error: "Warranty type already exists" },
        { status: 409 }
      );
    }

    // Create new warranty type
    const newWarrantyType = await db.warrantyType.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        isActive: true
      }
    });

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
