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
      adminUrgencyLevel,
      adminFormScore
    } = body;

    // Validate that the deployment case exists
    const existingCase = await db.deploymentCase.findUnique({
      where: { id }
    });

    if (!existingCase) {
      return NextResponse.json({ error: "Deployment case not found" }, { status: 404 });
    }

    const updateData: any = {};
    
    if (adminDifficultyLevel !== undefined) updateData.adminDifficultyLevel = adminDifficultyLevel ? parseInt(adminDifficultyLevel) : null;
    if (adminEstimatedTime !== undefined) updateData.adminEstimatedTime = adminEstimatedTime ? parseInt(adminEstimatedTime) : null;
    if (adminImpactLevel !== undefined) updateData.adminImpactLevel = adminImpactLevel ? parseInt(adminImpactLevel) : null;
    if (adminUrgencyLevel !== undefined) updateData.adminUrgencyLevel = adminUrgencyLevel ? parseInt(adminUrgencyLevel) : null;
    if (adminFormScore !== undefined) updateData.adminFormScore = adminFormScore ? parseInt(adminFormScore) : null;
    
    // Set admin assessment date
    updateData.adminAssessmentDate = dayjs().tz('Asia/Ho_Chi_Minh').toDate();

    const deploymentCase = await db.deploymentCase.update({
      where: { id },
      data: updateData,
      include: {
        reporter: {
          select: {
            id: true,
            fullName: true,
            position: true,
            department: true,
            companyEmail: true
          }
        },
        handler: {
          select: {
            id: true,
            fullName: true,
            position: true,
            department: true,
            companyEmail: true
          }
        },
        customer: {
          select: {
            id: true,
            fullCompanyName: true,
            shortName: true,
            contactPerson: true,
            contactPhone: true
          }
        },
        deploymentType: {
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      }
    });

    // Transform data to match frontend expectations
    const transformedCase = {
      ...deploymentCase,
      customerName: deploymentCase.customer?.shortName || deploymentCase.customer?.fullCompanyName || 'Khách hàng'
    };

    return NextResponse.json({
      message: "Deployment case evaluation updated successfully",
      data: transformedCase
    });

  } catch (error) {
    console.error("Error updating deployment case evaluation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
