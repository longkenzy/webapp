import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    console.log("🧪 Testing database connection...");
    
    // Test 1: Check connection
    await db.$connect();
    console.log("✅ Database connected");
    
    // Test 2: Query employees
    const employees = await db.employee.findMany({
      take: 1,
      select: { id: true, fullName: true, status: true }
    });
    console.log("✅ Employee query successful:", employees.length);
    
    // Test 3: Query users
    const users = await db.user.findMany({
      take: 1,
      select: { id: true, username: true, role: true }
    });
    console.log("✅ User query successful:", users.length);
    
    await db.$disconnect();
    
    return NextResponse.json({
      success: true,
      message: "Database connection test passed",
      employees: employees.length,
      users: users.length
    });
    
  } catch (error) {
    console.error("❌ Database test failed:", error);
    return NextResponse.json({
      success: false,
      error: error.message,
      details: {
        name: error.name,
        code: error.code
      }
    }, { status: 500 });
  }
}
