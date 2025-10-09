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
  withAuth(async (request: NextRequest) => {
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

    // Get default employee as reporter
    const defaultEmployee = await db.employee.findFirst();
    if (!defaultEmployee) {
      return errorResponse('No employees found');
    }

    // Process user assessment data
    const userAssessment = processUserAssessment(body);

    const newMaintenanceCase = await db.maintenanceCase.create({
      data: {
        title,
        description,
        reporterId: defaultEmployee.id,
        handlerId,
        customerName,
        customerId: customerId || null,
        maintenanceType: 'PREVENTIVE',
        maintenanceTypeId,
        startDate: convertToVietnamTime(startDate),
        endDate: endDate ? convertToVietnamTime(endDate) : null,
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
    sendCaseNotifications('maintenance', newMaintenanceCase.id, newMaintenanceCase.title, defaultEmployee.fullName);

    return successResponse(newMaintenanceCase, 'Maintenance case created successfully');
  })
);
