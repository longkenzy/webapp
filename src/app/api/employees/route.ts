import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { Role } from "@prisma/client";
import { atLeast } from "@/lib/auth/rbac";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!atLeast(session.user.role, Role.IT_STAFF)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const employees = await db.employee.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(employees);
  } catch (error) {
    console.error("Error fetching employees:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!atLeast(session.user.role, Role.IT_STAFF)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { 
      employeeId,
      name,
      dateOfBirth,
      gender,
      hometown,
      religion,
      ethnicity,
      seniority,
      startDate,
      phone,
      email,
      placeOfBirth,
      temporaryAddress,
      avatar,
      position,
      contractType,
      department,
      officeLocation,
      officeAddress
    } = body;

    console.log("Received employee data:", body);

    // Validation - check required fields for Employee
    if (!name || !dateOfBirth || !gender || !hometown || !religion || !ethnicity || 
        !startDate || !phone || !email || !placeOfBirth) {
      console.log("Validation failed. Missing fields:", {
        name: !!name,
        dateOfBirth: !!dateOfBirth,
        gender: !!gender,
        hometown: !!hometown,
        religion: !!religion,
        ethnicity: !!ethnicity,
        startDate: !!startDate,
        phone: !!phone,
        email: !!email,
        placeOfBirth: !!placeOfBirth
      });
      return NextResponse.json({ 
        error: "Vui lòng điền đầy đủ thông tin bắt buộc (Họ tên, Ngày sinh, Giới tính, Quê quán, Tôn giáo, Dân tộc, Ngày vào làm, Số điện thoại, Email, Nơi sinh)" 
      }, { status: 400 });
    }

    // Check if company email already exists
    const existingEmployee = await db.employee.findUnique({
      where: { companyEmail: email }
    });

    if (existingEmployee) {
      return NextResponse.json({ error: "Email công ty đã được sử dụng" }, { status: 400 });
    }

    // Create new employee
    const newEmployee = await db.employee.create({
      data: {
        fullName: name,
        dateOfBirth: new Date(dateOfBirth),
        gender,
        hometown,
        religion,
        ethnicity,
        startDate: new Date(startDate),
        primaryPhone: phone,
        personalEmail: email, // Use email as personal email
        companyEmail: email, // Use same email as company email
        placeOfBirth,
        permanentAddress: officeAddress || "", // Use office address as permanent address
        temporaryAddress: temporaryAddress || null,
        position: position || null,
        department: department || null,
        status: "active",
        contractType: contractType || null,
        avatar: avatar || null,
      }
    });

    return NextResponse.json(newEmployee, { status: 201 });

  } catch (error) {
    console.error("Error creating employee:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


