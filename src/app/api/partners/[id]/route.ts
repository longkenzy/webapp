import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { atLeast } from "@/lib/auth/rbac";
import { Role } from "@prisma/client";
import { getSession } from "@/lib/auth/session";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!atLeast(session.user.role, Role.IT_STAFF)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = params;
    const body = await request.json();
    
    const { fullCompanyName, shortName, address, contactPerson, contactPhone } = body;

    // Validate required fields
    if (!fullCompanyName || !shortName || !address) {
      return NextResponse.json(
        { error: "Tên công ty đầy đủ, tên viết tắt và địa chỉ là bắt buộc" },
        { status: 400 }
      );
    }

    // Update the partner
    const updatedPartner = await db.partner.update({
      where: { id },
      data: {
        fullCompanyName,
        shortName,
        address,
        contactPerson: contactPerson || null,
        contactPhone: contactPhone || null,
      },
    });

    return NextResponse.json(updatedPartner);
  } catch (error) {
    console.error("Error updating partner:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!atLeast(session.user.role, Role.IT_STAFF)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = params;

    // Delete the partner
    await db.partner.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting partner:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
