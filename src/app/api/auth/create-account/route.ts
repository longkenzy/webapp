import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { getSession } from "@/lib/auth/session";
import { atLeast } from "@/lib/auth/rbac";

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 Starting account creation process...");
    
    // Check authentication
    const session = await getSession();
    if (!session) {
      console.log("❌ No session found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Check authorization - only IT_STAFF and above can create accounts
    if (!atLeast(session.user.role, Role.IT_STAFF)) {
      console.log("❌ Insufficient permissions:", session.user.role);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    console.log("✅ User authenticated:", session.user.role);
    
    const body = await request.json();
    console.log("🔍 Request body:", body);
    
    const {
      employeeId,
      username,
      password,
      role,
      isActive,
    } = body;

    // Validate required fields
    if (!employeeId || !username || !password || !role) {
      console.log("❌ Validation failed - missing required fields");
      return NextResponse.json(
        { error: "Vui lòng điền đầy đủ thông tin bắt buộc" },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      console.log("❌ Password too short");
      return NextResponse.json(
        { error: "Mật khẩu phải có ít nhất 6 ký tự" },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = Object.values(Role);
    if (!validRoles.includes(role)) {
      console.log("❌ Invalid role:", role);
      return NextResponse.json(
        { error: "Quyền không hợp lệ" },
        { status: 400 }
      );
    }

    console.log("🔍 Validating employee...");
    
    // Test database connection first
    try {
      await db.$connect();
      console.log("✅ Database connected successfully");
    } catch (dbConnError) {
      console.error("❌ Database connection failed:", dbConnError);
      return NextResponse.json(
        { error: "Lỗi kết nối database" },
        { status: 500 }
      );
    }
    
    // Check if employee exists
    const employee = await db.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      console.log("❌ Employee not found:", employeeId);
      return NextResponse.json(
        { error: "Không tìm thấy nhân sự" },
        { status: 404 }
      );
    }

    console.log("🔍 Employee found:", employee.fullName);

    // Check if employee is active
    if (employee.status !== 'active') {
      console.log("❌ Employee not active:", employee.status);
      return NextResponse.json(
        { error: "Chỉ có thể tạo tài khoản cho nhân sự đang làm việc" },
        { status: 400 }
      );
    }

    console.log("🔍 Checking username uniqueness...");
    // Check if username already exists
    const existingUser = await db.user.findFirst({
      where: { username },
    });

    if (existingUser) {
      console.log("❌ Username already exists:", username);
      return NextResponse.json(
        { error: "Tên đăng nhập đã tồn tại" },
        { status: 400 }
      );
    }

    console.log("🔍 Checking if employee already has account...");
    // Check if employee already has an account
    const existingEmployeeAccount = await db.user.findFirst({
      where: { email: employee.companyEmail },
    });

    if (existingEmployeeAccount) {
      console.log("❌ Employee already has account:", employee.companyEmail);
      return NextResponse.json(
        { error: "Nhân sự này đã có tài khoản" },
        { status: 400 }
      );
    }

    console.log("🔍 Hashing password...");
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    console.log("🔍 Creating user in database...");
    
    try {
      // Create user account WITHOUT employeeId first (to avoid Prisma Client issue)
      const userData = {
        username,
        email: employee.companyEmail,
        password: hashedPassword,
        name: employee.fullName,
        role: role as Role,
        status: isActive ? 'active' : 'inactive',
      };
      
      console.log("🔍 User data (without employeeId):", userData);
      
      const newUser = await db.user.create({
        data: userData,
      });

      console.log("✅ User created successfully:", newUser.id);

      // Now update the user to add employeeId using raw SQL to avoid Prisma Client issue
      console.log("🔍 Updating user with employeeId...");
      
      try {
        await db.$executeRaw`UPDATE "User" SET "employeeId" = ${employeeId} WHERE id = ${newUser.id}`;
        console.log("✅ User updated with employeeId successfully");
      } catch (updateError) {
        console.error("❌ Error updating user with employeeId:", updateError);
        // Don't fail here, user was created successfully
      }

      // Remove password from response
      const { password: _, ...userWithoutPassword } = newUser;

      await db.$disconnect();
      
      return NextResponse.json(
        { 
          message: "Tạo tài khoản thành công",
          user: userWithoutPassword 
        },
        { status: 201 }
      );
    } catch (dbError) {
      console.error("❌ Database error during user creation:", dbError);
      console.error("❌ Database error details:", {
        name: dbError instanceof Error ? dbError.name : 'Unknown',
        message: dbError instanceof Error ? dbError.message : String(dbError),
        code: (dbError as any)?.code || 'Unknown',
        meta: (dbError as any)?.meta || null
      });
      
      await db.$disconnect();
      
      // Return specific error message
      if ((dbError as any)?.code === 'P2002') {
        return NextResponse.json(
          { error: "Tên đăng nhập hoặc email đã tồn tại" },
          { status: 400 }
        );
      }
      
      throw dbError; // Re-throw to be caught by outer catch
    }
    
  } catch (error) {
    console.error("❌ Error creating account:", error);
    console.error("❌ Error details:", {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    
    // Try to disconnect database
    try {
      await db.$disconnect();
    } catch (disconnectError) {
      console.error("❌ Error disconnecting database:", disconnectError);
    }
    
    // Return more specific error message
    if (error instanceof Error && error.message.includes('DATABASE_URL')) {
      return NextResponse.json(
        { error: "Lỗi kết nối database" },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: "Lỗi khi tạo tài khoản" },
      { status: 500 }
    );
  }
}
