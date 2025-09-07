import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: "No active session" }, { status: 401 });
    }

    // Update login time to extend session
    (session.user as any).loginTime = Date.now();

    return NextResponse.json({ 
      success: true, 
      message: "Session extended successfully",
      newLoginTime: Date.now()
    });
  } catch (error) {
    console.error("Error extending session:", error);
    return NextResponse.json({ error: "Failed to extend session" }, { status: 500 });
  }
}
