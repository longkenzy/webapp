import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    
    // Security check - prevent directory traversal
    if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }
    
    // Try different possible locations for the avatar file
    const possiblePaths = [
      join(process.cwd(), "public", "avatars", filename),
      join(process.cwd(), "avatars", filename),
      join("/tmp", "avatars", filename),
      join("/var", "www", "avatars", filename)
    ];
    
    let filePath: string | null = null;
    
    for (const path of possiblePaths) {
      if (existsSync(path)) {
        filePath = path;
        break;
      }
    }
    
    if (!filePath) {
      return NextResponse.json({ error: "Avatar not found" }, { status: 404 });
    }
    
    // Read the file as Uint8Array
    const fileBuffer = await readFile(filePath);
    const uint8Array = new Uint8Array(fileBuffer);
    
    // Determine content type based on file extension
    const extension = filename.split('.').pop()?.toLowerCase();
    let contentType = 'image/jpeg'; // default
    
    switch (extension) {
      case 'png':
        contentType = 'image/png';
        break;
      case 'gif':
        contentType = 'image/gif';
        break;
      case 'webp':
        contentType = 'image/webp';
        break;
      case 'svg':
        contentType = 'image/svg+xml';
        break;
    }
    
    // Return the file with appropriate headers
    return new NextResponse(uint8Array, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
    
  } catch (error) {
    console.error("Error serving avatar:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
