import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const employee = await db.employee.findUnique({
      where: {
        id: id,
      },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Không tìm thấy nhân sự" },
        { status: 404 }
      );
    }

    return NextResponse.json(employee);
  } catch (error) {
    console.error("Error fetching employee:", error);
    return NextResponse.json(
      { error: "Lỗi khi lấy thông tin nhân sự" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
      fullName,
      dateOfBirth,
      gender,
      hometown,
      religion,
      ethnicity,
      startDate,
      primaryPhone,
      secondaryPhone,
      personalEmail,
      companyEmail,
      placeOfBirth,
      permanentAddress,
      temporaryAddress,
      position,
      department,
      status,
      contractType,
    } = body;

    // Validate required fields
    if (!fullName || !dateOfBirth || !gender || !hometown || !religion || !ethnicity ||
      !startDate || !primaryPhone || !personalEmail || !companyEmail ||
      !placeOfBirth || !permanentAddress || !status) {
      return NextResponse.json(
        { error: "Vui lòng điền đầy đủ thông tin bắt buộc" },
        { status: 400 }
      );
    }

    // Check if company email already exists for another employee
    const existingEmployee = await db.employee.findFirst({
      where: {
        companyEmail,
        id: { not: id }
      }
    });

    if (existingEmployee) {
      return NextResponse.json(
        { error: "Email công ty đã được sử dụng bởi nhân sự khác" },
        { status: 400 }
      );
    }

    const updatedEmployee = await db.employee.update({
      where: {
        id: id,
      },
      data: {
        fullName,
        dateOfBirth: dayjs(dateOfBirth).tz('Asia/Ho_Chi_Minh').toDate(),
        gender,
        hometown,
        religion,
        ethnicity,
        startDate: dayjs(startDate).tz('Asia/Ho_Chi_Minh').toDate(),
        primaryPhone,
        secondaryPhone: secondaryPhone || null,
        personalEmail,
        companyEmail,
        placeOfBirth,
        permanentAddress,
        temporaryAddress: temporaryAddress || null,
        position: position || null,
        department: department || null,
        status,
        contractType: contractType || null,
      },
    });

    return NextResponse.json(updatedEmployee);
  } catch (error) {
    console.error("Error updating employee:", error);
    return NextResponse.json(
      { error: "Lỗi khi cập nhật thông tin nhân sự" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Check if employee exists
    const employee = await db.employee.findUnique({
      where: {
        id: id,
      },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Không tìm thấy nhân sự" },
        { status: 404 }
      );
    }

    // Perform manual cascade delete in a transaction
    await db.$transaction(async (tx) => {
      // 1. Unlink User account (if any)
      await tx.user.updateMany({
        where: { employeeId: id },
        data: { employeeId: null, status: 'inactive' } // Optional: Deactivate user account
      });

      // Helper function to delete cases and related data
      const deleteCases = async (model: any, commentModel: any, worklogModel: any, productModel: any = null, caseIdField: string) => {
        // Find cases involved
        const cases = await model.findMany({
          where: {
            OR: [
              { handlerId: id },
              { requesterId: id },
              // Note: Some models might use 'reporterId' instead of 'requesterId'
              // We will handle this by checking field existence dynamically or being explicit below
            ]
          },
          select: { id: true }
        });

        const caseIds = cases.map((c: any) => c.id);

        if (caseIds.length > 0) {
          // Delete related items
          if (productModel) {
            // Products usually have OnDelete: Cascade in schema, but we can be safe
            // await productModel.deleteMany({ where: { [caseIdField]: { in: caseIds } } }); 
          }
          if (commentModel) await commentModel.deleteMany({ where: { [caseIdField]: { in: caseIds } } });
          if (worklogModel) await worklogModel.deleteMany({ where: { [caseIdField]: { in: caseIds } } });

          // Delete cases
          await model.deleteMany({ where: { id: { in: caseIds } } });
        }
      };

      // 2. Delete Internal Cases
      const internalCases = await tx.internalCase.findMany({ where: { OR: [{ handlerId: id }, { requesterId: id }] }, select: { id: true } });
      const internalIds = internalCases.map(c => c.id);
      if (internalIds.length > 0) {
        await tx.internalCaseComment.deleteMany({ where: { internalCaseId: { in: internalIds } } });
        await tx.internalCaseWorklog.deleteMany({ where: { internalCaseId: { in: internalIds } } });
        await tx.internalCase.deleteMany({ where: { id: { in: internalIds } } });
      }

      // 3. Delete Receiving Cases
      const receivingCases = await tx.receivingCase.findMany({ where: { OR: [{ handlerId: id }, { requesterId: id }] }, select: { id: true } });
      const receivingIds = receivingCases.map(c => c.id);
      if (receivingIds.length > 0) {
        await tx.receivingCaseComment.deleteMany({ where: { receivingCaseId: { in: receivingIds } } });
        await tx.receivingCaseWorklog.deleteMany({ where: { receivingCaseId: { in: receivingIds } } });
        // Products have Cascade delete in schema
        await tx.receivingCase.deleteMany({ where: { id: { in: receivingIds } } });
      }

      // 4. Delete Delivery Cases
      const deliveryCases = await tx.deliveryCase.findMany({ where: { OR: [{ handlerId: id }, { requesterId: id }] }, select: { id: true } });
      const deliveryIds = deliveryCases.map(c => c.id);
      if (deliveryIds.length > 0) {
        await tx.deliveryCaseComment.deleteMany({ where: { deliveryCaseId: { in: deliveryIds } } });
        await tx.deliveryCaseWorklog.deleteMany({ where: { deliveryCaseId: { in: deliveryIds } } });
        // Products have Cascade delete in schema
        await tx.deliveryCase.deleteMany({ where: { id: { in: deliveryIds } } });
      }

      // 5. Delete Maintenance Cases (uses reporterId)
      const maintenanceCases = await tx.maintenanceCase.findMany({ where: { OR: [{ handlerId: id }, { reporterId: id }] }, select: { id: true } });
      const maintenanceIds = maintenanceCases.map(c => c.id);
      if (maintenanceIds.length > 0) {
        await tx.maintenanceCaseComment.deleteMany({ where: { maintenanceCaseId: { in: maintenanceIds } } });
        await tx.maintenanceCaseWorklog.deleteMany({ where: { maintenanceCaseId: { in: maintenanceIds } } });
        await tx.maintenanceCase.deleteMany({ where: { id: { in: maintenanceIds } } });
      }

      // 6. Delete Incidents (uses reporterId - nullable)
      const incidents = await tx.incident.findMany({ where: { OR: [{ handlerId: id }, { reporterId: id }] }, select: { id: true } });
      const incidentIds = incidents.map(c => c.id);
      if (incidentIds.length > 0) {
        await tx.incidentComment.deleteMany({ where: { incidentId: { in: incidentIds } } });
        await tx.incidentWorklog.deleteMany({ where: { incidentId: { in: incidentIds } } });
        await tx.incident.deleteMany({ where: { id: { in: incidentIds } } });
      }

      // 7. Delete Warranties (uses reporterId)
      const warranties = await tx.warranty.findMany({ where: { OR: [{ handlerId: id }, { reporterId: id }] }, select: { id: true } });
      const warrantyIds = warranties.map(c => c.id);
      if (warrantyIds.length > 0) {
        await tx.warrantyComment.deleteMany({ where: { warrantyId: { in: warrantyIds } } });
        await tx.warrantyWorklog.deleteMany({ where: { warrantyId: { in: warrantyIds } } });
        await tx.warranty.deleteMany({ where: { id: { in: warrantyIds } } });
      }

      // 8. Delete Deployment Cases (uses reporterId)
      const deploymentCases = await tx.deploymentCase.findMany({ where: { OR: [{ handlerId: id }, { reporterId: id }] }, select: { id: true } });
      const deploymentIds = deploymentCases.map(c => c.id);
      if (deploymentIds.length > 0) {
        await tx.deploymentCaseComment.deleteMany({ where: { deploymentCaseId: { in: deploymentIds } } });
        await tx.deploymentCaseWorklog.deleteMany({ where: { deploymentCaseId: { in: deploymentIds } } });
        await tx.deploymentCase.deleteMany({ where: { id: { in: deploymentIds } } });
      }

      // 9. Finally delete the employee
      await tx.employee.delete({
        where: {
          id: id,
        },
      });
    });

    return NextResponse.json(
      { message: "Xóa nhân sự và toàn bộ case liên quan thành công" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting employee:", error);
    return NextResponse.json(
      { error: "Lỗi khi xóa nhân sự: " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500 }
    );
  }
}
