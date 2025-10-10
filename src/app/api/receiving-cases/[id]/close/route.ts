import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);


export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string  }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: caseId } = await params;
    const currentTime = dayjs().tz('Asia/Ho_Chi_Minh').toDate();

    console.log(`=== Closing Receiving Case ===`);
    console.log(`Case ID: ${caseId}`);
    console.log(`Closed at: ${currentTime}`);

    // Check if case exists
    const existingCase = await db.receivingCase.findUnique({
      where: { id: caseId },
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
        },
        supplier: {
          select: {
            id: true,
            shortName: true,
            fullCompanyName: true,
            contactPerson: true,
            contactPhone: true
          }
        }
      }
    });

    if (!existingCase) {
      return NextResponse.json(
        { error: "Case not found" },
        { status: 404 }
      );
    }

    // Check if case is already completed
    if (existingCase.status === 'COMPLETED') {
      return NextResponse.json(
        { error: "Case is already completed" },
        { status: 400 }
      );
    }

    // Update case to completed status with current time as end date
    const updatedCase = await db.receivingCase.update({
      where: { id: caseId },
      data: {
        status: 'COMPLETED',
        endDate: currentTime,
        updatedAt: currentTime
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
        },
        supplier: {
          select: {
            id: true,
            shortName: true,
            fullCompanyName: true,
            contactPerson: true,
            contactPhone: true
          }
        }
      }
    });

    console.log(`Case closed successfully: ${updatedCase.title}`);
    console.log(`New status: ${updatedCase.status}`);
    console.log(`End date: ${updatedCase.endDate}`);

    return NextResponse.json({
      success: true,
      message: "Case đã được đóng thành công",
      data: updatedCase
    });

  } catch (error) {
    console.error("Error closing receiving case:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Internal server error", 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}
