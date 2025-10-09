import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { Role } from "@prisma/client";
import { atLeast } from "@/lib/auth/rbac";
import bcrypt from "bcryptjs";
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);

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
    const requiredFields = {
      name: name,
      dateOfBirth: dateOfBirth,
      gender: gender,
      hometown: hometown,
      religion: religion,
      ethnicity: ethnicity,
      startDate: startDate,
      phone: phone,
      email: email,
      placeOfBirth: placeOfBirth
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([key, value]) => !value || value.trim() === '')
      .map(([key]) => key);

    // Validation completed

    if (missingFields.length > 0) {
      console.log("Validation failed. Missing fields:", missingFields);
      return NextResponse.json({ 
        error: `Vui lòng điền đầy đủ thông tin bắt buộc: ${missingFields.join(', ')}` 
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
        dateOfBirth: dayjs(dateOfBirth).tz('Asia/Ho_Chi_Minh').toDate(),
        gender,
        hometown,
        religion,
        ethnicity,
        startDate: dayjs(startDate).tz('Asia/Ho_Chi_Minh').toDate(),
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


