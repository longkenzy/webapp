import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      console.log('No session found for user profile request');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log('Session found for user:', session.user.id);
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        department: true,
        status: true,
        role: true,
        username: true,
        createdAt: true,
        updatedAt: true,
        employee: {
          select: {
            id: true,
            fullName: true,
            dateOfBirth: true,
            gender: true,
            hometown: true,
            religion: true,
            ethnicity: true,
            startDate: true,
            primaryPhone: true,
            secondaryPhone: true,
            personalEmail: true,
            companyEmail: true,
            placeOfBirth: true,
            permanentAddress: true,
            temporaryAddress: true,
            avatar: true,
            contractType: true,
            department: true,
            position: true,
            status: true
          }
        },
        schedules: {
          select: {
            id: true,
            title: true,
            startAt: true,
            endAt: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userWithAvatar = {
      ...user,
      avatarUrl: user.employee?.avatar ? `/api/avatars/${user.employee.avatar}` : null
    };

    return NextResponse.json(userWithAvatar);

  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, phone, department } = await request.json();

    // Update user basic info
    const updatedUser = await db.user.update({
      where: { id: session.user.id },
      data: {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(department && { department })
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        department: true,
        status: true,
        role: true,
        username: true,
        updatedAt: true
      }
    });

    return NextResponse.json({ success: true, user: updatedUser });

  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
