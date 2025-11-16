import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { atLeast } from "@/lib/auth/rbac";
import { Role } from "@prisma/client";
import { getSession } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!atLeast(session.user.role, Role.IT_STAFF)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const partners = await db.partner.findMany({ 
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

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!atLeast(session.user.role, Role.IT_STAFF)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { fullCompanyName, shortName, address, contactPerson, contactPhone } = body;

    // Validate required fields
    if (!fullCompanyName || !shortName || !address) {
      return NextResponse.json(
        { error: "Tên công ty đầy đủ, tên viết tắt và địa chỉ là bắt buộc" },
        { status: 400 }
      );
    }

    // Check if partner with same shortName already exists
    const existingPartner = await db.partner.findUnique({
      where: { shortName: shortName.trim() }
    });

    if (existingPartner) {
      return NextResponse.json(
        { error: `Tên viết tắt "${shortName}" đã tồn tại. Vui lòng chọn tên khác.` },
        { status: 400 }
      );
    }

    // Create the new partner
    const newPartner = await db.partner.create({
      data: {
        fullCompanyName: fullCompanyName.trim(),
        shortName: shortName.trim(),
        address: address.trim(),
        contactPerson: contactPerson?.trim() || null,
        contactPhone: contactPhone?.trim() || null,
      },
    });

    // Revalidate cache để user khác thấy được partner mới
    revalidatePath('/api/partners/list');

    return NextResponse.json(newPartner);
  } catch (error: any) {
    console.error("Error creating partner:", error);
    
    // Handle Prisma unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "Tên viết tắt này đã tồn tại. Vui lòng chọn tên khác." },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Lỗi server. Vui lòng thử lại sau." },
      { status: 500 }
    );
  }
}
