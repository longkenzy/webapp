import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Allow any authenticated user to view employee list
    const employees = await db.employee.findMany({
      where: {
        status: "active" // Only show active employees
      },
      select: {
        id: true,
        fullName: true,
        position: true,
        department: true,
        companyEmail: true
      },
      orderBy: {
        fullName: 'asc' // Sort by name alphabetically
      }
    });

    const response = NextResponse.json(employees);
    
    // Add caching headers for employees (they don't change often)
    response.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    response.headers.set('ETag', `"${Date.now()}"`);
    
    return response;
  } catch (error) {
    console.error("Error fetching employees list:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
