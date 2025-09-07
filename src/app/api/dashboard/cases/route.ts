import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // Fetch cases for today and cases that are not "RECEIVED" or "IN_PROGRESS"
    const cases = await db.internalCase.findMany({
      where: {
        OR: [
          // Cases created today
          {
            createdAt: {
              gte: startOfDay,
              lt: endOfDay
            }
          },
          // Cases that are not "RECEIVED" or "IN_PROGRESS"
          {
            status: {
              notIn: ['RECEIVED', 'IN_PROGRESS']
            }
          }
        ]
      },
      include: {
        requester: {
          select: {
            id: true,
            fullName: true,
            position: true,
            department: true
          }
        },
        handler: {
          select: {
            id: true,
            fullName: true,
            position: true,
            department: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      data: cases
    });

  } catch (error) {
    console.error("Error fetching dashboard cases:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
