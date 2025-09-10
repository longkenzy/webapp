import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all active incident types from IncidentType table
    const incidentTypes = await db.incidentType.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        name: true,
        description: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    const response = NextResponse.json({
      data: incidentTypes
    });

    // Disable caching to ensure fresh data
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    return response;

  } catch (error) {
    console.error("Error fetching incident types:", error);
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

    // Check if incident type already exists
    const existingType = await db.incidentType.findUnique({
      where: { name: name.trim() }
    });

    if (existingType) {
      return NextResponse.json(
        { error: "Incident type already exists" },
        { status: 409 }
      );
    }

    // Create new incident type
    const newIncidentType = await db.incidentType.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        isActive: true
      }
    });

    return NextResponse.json({
      data: newIncidentType
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating incident type:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
