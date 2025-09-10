import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    console.log("=== Test Auth API Called ===");
    
    // Test database connection
    const userCount = await db.user.count();
    console.log("Database connection test - User count:", userCount);
    
    // Test session
    const session = await getSession();
    console.log("Session test - Session exists:", !!session);
    
    if (session) {
      console.log("Session details:", {
        userId: session.user?.id,
        email: session.user?.email,
        role: session.user?.role
      });
    }
    
    return NextResponse.json({
      success: true,
      databaseConnected: true,
      userCount,
      sessionExists: !!session,
      session: session ? {
        userId: session.user?.id,
        email: session.user?.email,
        role: session.user?.role
      } : null,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("Test auth error:", error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
