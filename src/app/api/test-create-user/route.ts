import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";

export async function POST() {
  try {
    console.log("🧪 Testing simple user creation...");
    
    // Test data
    const testData = {
      username: `test_${Date.now()}`,
      email: `test_${Date.now()}@test.com`,
      password: 'test123',
      role: Role.USER,
      status: 'inactive'
    };
    
    console.log("🔍 Test data:", testData);
    
    // Try to create user
    const newUser = await db.user.create({
      data: testData,
    });
    
    console.log("✅ User created successfully:", newUser.id);
    
    // Clean up - delete test user
    await db.user.delete({
      where: { id: newUser.id }
    });
    
    console.log("✅ Test user deleted successfully");
    
    return NextResponse.json({
      success: true,
      message: "User creation test passed",
      userId: newUser.id
    });
    
  } catch (error) {
    console.error("❌ User creation test failed:", error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorName = error instanceof Error ? error.name : 'Unknown';
    const errorCode = (error as any)?.code || 'UNKNOWN';
    
    console.error("❌ Error details:", {
      name: errorName,
      message: errorMessage,
      code: errorCode
    });
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      details: {
        name: errorName,
        code: errorCode
      }
    }, { status: 500 });
  }
}
