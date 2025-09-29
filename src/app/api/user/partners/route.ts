import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all partners for user (no role restriction for reading)
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
    console.error("Error fetching partners:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
