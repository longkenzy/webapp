import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { db } from "@/lib/db";
import { writeFile, unlink, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);


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

    // Ensure avatars directory exists with fallback for production
    let avatarsDir: string = '';

    // Try different directory paths for production
    const possiblePaths = [
      join(process.cwd(), "public", "avatars"),
      join(process.cwd(), "avatars"),
      "/tmp/avatars",
      "/var/www/avatars"
    ];

    console.log("Attempting to find/create avatars directory...");
    console.log("Current working directory:", process.cwd());
    console.log("NODE_ENV:", process.env.NODE_ENV);

    let directoryCreated = false;
    for (const dirPath of possiblePaths) {
      try {
        console.log("Trying directory:", dirPath);

        if (!existsSync(dirPath)) {
          console.log("Directory does not exist, creating...");
          await mkdir(dirPath, { recursive: true });
          console.log("Directory created successfully at:", dirPath);
        } else {
          console.log("Directory already exists at:", dirPath);
        }

        // Test write permissions
        const testFile = join(dirPath, "test-write-permissions.tmp");
        await writeFile(testFile, "test");
        await unlink(testFile);
        console.log("Write permissions test passed for:", dirPath);

        avatarsDir = dirPath;
        directoryCreated = true;
        break;

      } catch (dirError) {
        console.error(`Failed to use directory ${dirPath}:`, dirError);
        continue;
      }
    }

    if (!directoryCreated) {
      throw new Error("Failed to create or access any avatars directory. Please check server permissions and configuration.");
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
      // Check if an employee with this email already exists to avoid unique constraint error
      const existingEmployee = await db.employee.findUnique({
        where: { companyEmail: user.email }
      });

      if (existingEmployee) {
        // Link existing employee to user and update avatar
        await db.employee.update({
          where: { id: existingEmployee.id },
          data: { avatar: fileName }
        });

        await db.user.update({
          where: { id: user.id },
          data: { employeeId: existingEmployee.id }
        });
      } else {
        // Create new employee record
        const newEmployee = await db.employee.create({
          data: {
            fullName: user.name || "Unknown",
            dateOfBirth: dayjs().tz('Asia/Ho_Chi_Minh').toDate(),
            gender: "Unknown",
            hometown: "Unknown",
            religion: "Unknown",
            ethnicity: "Unknown",
            startDate: dayjs().tz('Asia/Ho_Chi_Minh').toDate(),
            primaryPhone: user.phone || "",
            secondaryPhone: null,
            personalEmail: user.email,
            companyEmail: user.email,
            placeOfBirth: "Unknown",
            permanentAddress: "Unknown",
            temporaryAddress: null,
            avatar: fileName
          }
        });

        // Update user with employeeId
        await db.user.update({
          where: { id: user.id },
          data: { employeeId: newEmployee.id }
        });
      }
    }

    // Always use API route for avatar URLs to ensure consistency
    const avatarUrl = `/api/avatars/${fileName}`;

    console.log("Avatar saved successfully:", {
      fileName,
      filePath,
      avatarUrl,
      avatarsDir
    });

    return NextResponse.json({
      success: true,
      avatar: fileName,
      avatarUrl: avatarUrl
    });

  } catch (error) {
    console.error("Error uploading avatar:", error);

    // Detailed error logging
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    // Return specific error message to client for debugging
    let errorMessage = "Internal server error";
    let statusCode = 500;

    if (error instanceof Error) {
      // Expose the actual error message for debugging purposes since this is an internal tools app
      errorMessage = error.message;

      if (error.message.includes("ENOENT")) {
        errorMessage = `Directory not found or not writable: ${error.message}`;
      } else if (error.message.includes("EACCES") || error.message.includes("EPERM")) {
        errorMessage = `Permission denied writing to disk: ${error.message}`;
      } else if (error.message.includes("Unique constraint")) {
        errorMessage = "Database error: Email already exists in employee records.";
      }
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
