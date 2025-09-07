import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Lấy danh sách partners cho user (không cần quyền admin)
    const partners = await db.partner.findMany({ 
      select: {
        id: true,
        fullCompanyName: true,
        shortName: true,
        address: true,
        contactPerson: true,
        contactPhone: true
      },
      orderBy: { shortName: "asc" } 
    });

    return NextResponse.json(partners);
  } catch (error) {
    console.error("Error fetching partners list:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
