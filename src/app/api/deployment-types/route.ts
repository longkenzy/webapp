import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Fetching deployment types...");

    // Get all active deployment types
    const deploymentTypes = await db.deploymentType.findMany({
      where: {
        isActive: true
      },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        description: true
      }
    });

    console.log(`Found ${deploymentTypes.length} deployment types`);

    const response = NextResponse.json({
      data: deploymentTypes
    });

    // Add caching headers
    response.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    response.headers.set('ETag', `"${Date.now()}"`);
    
    return response;

  } catch (error) {
    console.error("Error fetching deployment types:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
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

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    console.log("Creating deployment type:", { name, description });

    // Create deployment type
    const deploymentType = await db.deploymentType.create({
      data: {
        name,
        description: description || null
      }
    });

    console.log("Deployment type created successfully:", deploymentType);

    return NextResponse.json({
      message: "Deployment type created successfully",
      data: deploymentType
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating deployment type:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
