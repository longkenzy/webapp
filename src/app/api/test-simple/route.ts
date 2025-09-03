import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    console.log("🧪 Simple database test...");
    
    // Just test basic connection
    const result = await db.$queryRaw`SELECT 1 as test`;
    console.log("✅ Raw query successful:", result);
    
    return NextResponse.json({
      success: true,
      message: "Simple database test passed",
      result
    });
    
  } catch (error) {
    console.error("❌ Simple test failed:", error);
    return NextResponse.json({
      success: false,
      error: error.message,
      name: error.name
    }, { status: 500 });
  }
}
