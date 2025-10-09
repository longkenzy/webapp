import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { InternalCaseStatus } from "@prisma/client";
import { createCaseCreatedNotification, getAdminUsers } from "@/lib/notifications";
import { convertToVietnamTime } from "@/lib/date-utils";
import { 
  withAuth, 
  withErrorHandling, 
  successResponse, 
  errorResponse, 
  validateRequiredFields,
  getPaginationParams,
  setNoCacheHeaders
} from "@/lib/api-middleware";
import { 
  validateCaseDates, 
  processUserAssessment, 
  validateEmployees, 
  sendCaseNotifications,
  buildCaseWhereClause,
  commonCaseIncludes
} from "@/lib/case-helpers";

export const POST = withErrorHandling(
  withAuth(async (request: NextRequest) => {
    const body = await request.json();
    
    const {
      title,
      description,
      requesterId,
      handlerId,
      caseType,
      form,
      startDate,
      endDate,
      status,
      notes
    } = body;

    // Validate required fields
    const missingFields = validateRequiredFields(body, [
      'title', 'description', 'requesterId', 'handlerId', 'caseType'
    ]);

    if (missingFields.length > 0) {
      return errorResponse(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Validate dates
    const dateError = validateCaseDates(startDate, endDate);
    if (dateError) {
      return errorResponse(dateError);
    }

    // Validate employees
    const { requester, handler } = await validateEmployees(requesterId, handlerId);
    if (!requester || !handler) {
      return errorResponse("Requester or handler not found");
    }

    // Process user assessment data
    const userAssessment = processUserAssessment(body);

    // Create internal case
    const internalCase = await db.internalCase.create({
      data: {
        title,
        description,
        requesterId: requester.id,
        handlerId: handler.id,
        caseType,
        form: form || "Onsite",
        startDate: convertToVietnamTime(startDate),
        endDate: endDate ? convertToVietnamTime(endDate) : null,
        status: status || InternalCaseStatus.RECEIVED,
        notes: notes || null,
        ...userAssessment
      },
      include: commonCaseIncludes
    });

    // Send notifications asynchronously
    sendCaseNotifications('internal', internalCase.id, internalCase.title, requester.fullName);

    return successResponse(internalCase, "Internal case created successfully");
  })
);

export const GET = withErrorHandling(
  withAuth(async (request: NextRequest) => {
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = getPaginationParams(searchParams);
    const where = buildCaseWhereClause(searchParams);

    const [internalCases, total] = await Promise.all([
      db.internalCase.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: commonCaseIncludes
      }),
      db.internalCase.count({ where })
    ]);

    const pagination = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    };

    const response = successResponse(internalCases, undefined, pagination);
    return setNoCacheHeaders(response);
  })
);
