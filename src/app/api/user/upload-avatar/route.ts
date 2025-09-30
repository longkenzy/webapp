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

    // Determine the correct avatar URL based on directory location
    let avatarUrl: string;
    if (avatarsDir.includes("public")) {
      avatarUrl = `/avatars/${fileName}`;
    } else {
      // For production environments where avatars might be stored elsewhere
      avatarUrl = `/api/avatars/${fileName}`;
    }
    
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
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      console.error("Current working directory:", process.cwd());
      console.error("Avatars directory path:", join(process.cwd(), "public", "avatars"));
      console.error("File system access test:", existsSync(join(process.cwd(), "public")));
    }
    
    // Return more specific error message based on error type
    let errorMessage = "Internal server error";
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes("ENOENT")) {
        errorMessage = "Directory not found. Please check server configuration.";
        statusCode = 500;
      } else if (error.message.includes("EACCES") || error.message.includes("EPERM")) {
        errorMessage = "Permission denied. Please check file system permissions.";
        statusCode = 500;
      } else if (error.message.includes("database")) {
        errorMessage = "Database error occurred.";
        statusCode = 500;
      } else {
        errorMessage = process.env.NODE_ENV === 'development' 
          ? error.message 
          : "File upload failed. Please try again.";
      }
    }
    
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
