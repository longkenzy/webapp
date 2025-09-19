import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    console.log("=== Testing Maintenance Types API ===");
    
    // Test 1: Basic connection
    console.log("1. Testing database connection...");
    const connectionTest = await db.$queryRaw`SELECT 1 as test`;
    console.log("Connection test result:", connectionTest);
    
    // Test 2: Check table exists
    console.log("2. Checking if MaintenanceCaseType table exists...");
    const tableCheck = await db.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'MaintenanceCaseType'
    `;
    console.log("Table check result:", tableCheck);
    
    // Test 3: Raw count query
    console.log("3. Getting raw count...");
    const rawCount = await db.$queryRaw`SELECT COUNT(*) as count FROM "MaintenanceCaseType"`;
    console.log("Raw count result:", rawCount);
    
    // Test 4: Raw select query
    console.log("4. Getting raw data...");
    const rawData = await db.$queryRaw`SELECT * FROM "MaintenanceCaseType"`;
    console.log("Raw data result:", rawData);
    
    // Test 5: Prisma findMany (no conditions)
    console.log("5. Using Prisma findMany (no conditions)...");
    const prismaAll = await db.maintenanceCaseType.findMany();
    console.log("Prisma all result:", prismaAll);
    
    // Test 6: Prisma findMany with where clause
    console.log("6. Using Prisma findMany with isActive = true...");
    const prismaActive = await db.maintenanceCaseType.findMany({
      where: { isActive: true }
    });
    console.log("Prisma active result:", prismaActive);
    
    return NextResponse.json({
      success: true,
      tests: {
        connection: connectionTest,
        tableExists: tableCheck,
        rawCount: rawCount,
        rawData: rawData,
        prismaAll: prismaAll,
        prismaActive: prismaActive
      }
    });
    
  } catch (error) {
    console.error("Test API error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
