import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { db } from "@/lib/db";
import { writeFile, unlink, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("avatar") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 5MB" }, { status: 400 });
    }

    // Get user data to check for existing avatar
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: { employee: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Ensure avatars directory exists
    const avatarsDir = join(process.cwd(), "public", "avatars");
    if (!existsSync(avatarsDir)) {
      await mkdir(avatarsDir, { recursive: true });
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExtension}`;
    const filePath = join(avatarsDir, fileName);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    await writeFile(filePath, buffer);

    // Delete old avatar if exists
    if (user.employee?.avatar) {
      const oldAvatarPath = join(process.cwd(), "public", "avatars", user.employee.avatar);
      if (existsSync(oldAvatarPath)) {
        try {
          await unlink(oldAvatarPath);
        } catch (error) {
          console.error("Error deleting old avatar:", error);
        }
      }
    }

    // Update employee avatar in database
    if (user.employee) {
      await db.employee.update({
        where: { id: user.employee.id },
        data: { avatar: fileName }
      });
    } else {
      // If user doesn't have employee record, create one
      const newEmployee = await db.employee.create({
        data: {
          fullName: user.name || "Unknown",
          dateOfBirth: new Date(),
          gender: "Unknown",
          hometown: "Unknown",
          religion: "Unknown",
          ethnicity: "Unknown",
          startDate: new Date(),
          primaryPhone: user.phone || "",
          secondaryPhone: null, // Optional field
          personalEmail: user.email,
          companyEmail: user.email,
          placeOfBirth: "Unknown",
          permanentAddress: "Unknown",
          temporaryAddress: null, // Optional field
          avatar: fileName
        }
      });
      
      // Update user with employeeId
      await db.user.update({
        where: { id: user.id },
        data: { employeeId: newEmployee.id }
      });
    }

    return NextResponse.json({ 
      success: true, 
      avatar: fileName,
      avatarUrl: `/avatars/${fileName}`
    });

  } catch (error) {
    console.error("Error uploading avatar:", error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    // Return more specific error message in development
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error instanceof Error ? error.message : "Unknown error"
      : "Internal server error";
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
