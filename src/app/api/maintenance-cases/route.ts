import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { MaintenanceCaseStatus } from '@prisma/client';
import { createCaseCreatedNotification, getAdminUsers } from '@/lib/notifications';
import { convertToVietnamTime } from "@/lib/date-utils";
import {
  withAuth,
  withErrorHandling,
  successResponse,
  errorResponse,
  validateRequiredFields,
  setNoCacheHeaders
} from '@/lib/api-middleware';
import {
  validateCaseDates,
  processUserAssessment,
  sendCaseNotifications
} from '@/lib/case-helpers';

export const GET = withErrorHandling(
  withAuth(async (request: NextRequest) => {
    const maintenanceCases = await db.maintenanceCase.findMany({
      include: {
        reporter: {
          select: {
            id: true,
            fullName: true,
            position: true,
            department: true,
            avatar: true
          }
        },
        handler: {
          select: {
            id: true,
            fullName: true,
            position: true,
            department: true,
            avatar: true
          }
        },
        maintenanceCaseType: {
          select: {
            id: true,
            name: true
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
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const response = successResponse(maintenanceCases);
    return setNoCacheHeaders(response);
  })
);

export const POST = withErrorHandling(
  withAuth(async (request: NextRequest, session: any) => {
    const body = await request.json();
    const {
      title,
      description,
      maintenanceTypeId,
      handlerId,
      customerName,
      customerId,
      startDate,
      endDate,
      status,
      notes,
      crmReferenceCode
    } = body;

    // Validate required fields
    const missingFields = validateRequiredFields(body, [
      'title', 'description', 'handlerId', 'customerName', 'startDate', 'maintenanceTypeId'
    ]);

    if (missingFields.length > 0) {
      return errorResponse(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Validate dates
    const dateError = validateCaseDates(startDate, endDate);
    if (dateError) {
      return errorResponse(dateError);
    }

    // Get reporter from session or fallback to default employee
    let reporterId: string;
    let reporterName: string;

    if (session?.user?.employee) {
      reporterId = session.user.employee.id;
      reporterName = session.user.employee.fullName;
    } else {
      const defaultEmployee = await db.employee.findFirst();
      if (!defaultEmployee) {
        return errorResponse('No employees found');
      }
      reporterId = defaultEmployee.id;
      // If user has a name in session, use it for notification even if we attach to default employee
      reporterName = session?.user?.name || defaultEmployee.fullName;
    }

    // Process user assessment data
    const userAssessment = processUserAssessment(body);

    const newMaintenanceCase = await db.maintenanceCase.create({
      data: {
        title,
        description,
        reporterId,
        handlerId,
        customerName,
        customerId: customerId || null,
        maintenanceType: 'PREVENTIVE',
        maintenanceTypeId,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
        notes: notes || '',
        status: status || MaintenanceCaseStatus.RECEIVED,
        crmReferenceCode: crmReferenceCode || null,
        ...userAssessment
      },
      include: {
        reporter: {
          select: {
            id: true,
            fullName: true,
            position: true,
            department: true,
            avatar: true
          }
        },
        handler: {
          select: {
            id: true,
            fullName: true,
            position: true,
            department: true,
            avatar: true
          }
        },
        maintenanceCaseType: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Send notifications asynchronously
    sendCaseNotifications('maintenance', newMaintenanceCase.id, newMaintenanceCase.title, reporterName);

    return successResponse(newMaintenanceCase, 'Maintenance case created successfully');
  })
);
