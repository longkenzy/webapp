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

    // Check if employee has active status
    if (employee.status === 'active') {
      return NextResponse.json(
        { error: "Không thể xóa nhân sự đang làm việc. Vui lòng cập nhật trạng thái trước khi xóa." },
        { status: 400 }
      );
    }

    // Delete the employee
    await db.employee.delete({
      where: {
        id: id,
      },
    });

    return NextResponse.json(
      { message: "Xóa nhân sự thành công" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting employee:", error);
    return NextResponse.json(
      { error: "Lỗi khi xóa nhân sự" },
      { status: 500 }
    );
  }
}
