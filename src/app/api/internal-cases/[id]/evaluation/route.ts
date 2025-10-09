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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    
    const {
      adminDifficultyLevel,
      adminEstimatedTime,
      adminImpactLevel,
      adminUrgencyLevel
    } = body;

    // Validate required fields
    if (!adminDifficultyLevel || !adminEstimatedTime || !adminImpactLevel || !adminUrgencyLevel) {
      return NextResponse.json(
        { error: "All evaluation fields are required" },
        { status: 400 }
      );
    }

    // Update internal case with admin evaluation (optimized query)
    const updatedCase = await db.internalCase.update({
      where: { id },
      data: {
        adminDifficultyLevel: parseInt(adminDifficultyLevel),
        adminEstimatedTime: parseInt(adminEstimatedTime),
        adminImpactLevel: parseInt(adminImpactLevel),
        adminUrgencyLevel: parseInt(adminUrgencyLevel),
        adminAssessmentDate: dayjs().tz('Asia/Ho_Chi_Minh').toDate()
      },
      select: {
        id: true,
        title: true,
        description: true,
        caseType: true,
        form: true,
        status: true,
        startDate: true,
        endDate: true,
        userDifficultyLevel: true,
        userEstimatedTime: true,
        userImpactLevel: true,
        userUrgencyLevel: true,
        userFormScore: true,
        adminDifficultyLevel: true,
        adminEstimatedTime: true,
        adminImpactLevel: true,
        adminUrgencyLevel: true,
        userAssessmentDate: true,
        adminAssessmentDate: true,
        createdAt: true,
        updatedAt: true,
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
      }
    });

    const response = NextResponse.json({
      message: "Internal case evaluation updated successfully",
      data: updatedCase
    });

    // Add caching headers
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;

  } catch (error) {
    console.error("Error updating internal case evaluation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get internal case with evaluation data
    const internalCase = await db.internalCase.findUnique({
      where: { id },
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
      }
    });

    if (!internalCase) {
      return NextResponse.json(
        { error: "Internal case not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: internalCase
    });

  } catch (error) {
    console.error("Error fetching internal case evaluation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
