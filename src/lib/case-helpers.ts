import { db } from "@/lib/db";
import { createCaseCreatedNotification, getAdminUsers } from "@/lib/notifications";

// Common case validation
export function validateCaseDates(startDate: string, endDate?: string) {
  if (!endDate) return null;
  
  const startDateObj = new Date(startDate);
  const endDateObj = new Date(endDate);
  
  if (endDateObj <= startDateObj) {
    return "Ngày kết thúc phải lớn hơn ngày bắt đầu";
  }
  
  return null;
}

// Common user assessment data processing
export function processUserAssessment(body: any) {
  return {
    userDifficultyLevel: body.userDifficultyLevel !== undefined && body.userDifficultyLevel !== null 
      ? parseInt(body.userDifficultyLevel) : null,
    userEstimatedTime: body.userEstimatedTime !== undefined && body.userEstimatedTime !== null 
      ? parseInt(body.userEstimatedTime) : null,
    userImpactLevel: body.userImpactLevel !== undefined && body.userImpactLevel !== null 
      ? parseInt(body.userImpactLevel) : null,
    userUrgencyLevel: body.userUrgencyLevel !== undefined && body.userUrgencyLevel !== null 
      ? parseInt(body.userUrgencyLevel) : null,
    userFormScore: body.userFormScore !== undefined && body.userFormScore !== null 
      ? parseInt(body.userFormScore) : null,
    userAssessmentDate: new Date()
  };
}

// Common employee validation
export async function validateEmployees(requesterId: string, handlerId: string) {
  const [requester, handler] = await Promise.all([
    db.employee.findUnique({ where: { id: requesterId } }),
    db.employee.findUnique({ where: { id: handlerId } })
  ]);

  if (!requester) {
    // Try to find user and get default employee
    const user = await db.user.findUnique({
      where: { id: requesterId },
      include: { employee: true }
    });
    
    if (user?.employee) {
      return { requester: user.employee, handler };
    } else if (user) {
      // Use first available employee as fallback
      const defaultEmployee = await db.employee.findFirst();
      return { requester: defaultEmployee, handler };
    }
  }

  return { requester, handler };
}

// Send notifications for case creation
export async function sendCaseNotifications(
  caseType: 'internal' | 'deployment' | 'maintenance' | 'warranty' | 'receiving',
  caseId: string,
  title: string,
  requesterName: string
) {
  try {
    const adminUsers = await getAdminUsers();
    
    await Promise.all(
      adminUsers.map(admin =>
        createCaseCreatedNotification(
          caseType,
          caseId,
          title,
          requesterName,
          admin.id
        )
      )
    );
    
    console.log(`Notifications sent to ${adminUsers.length} admin users for ${caseType} case`);
  } catch (error) {
    console.error('Error sending case notifications:', error);
    // Don't throw - notifications are not critical
  }
}

// Common case query builder
export function buildCaseWhereClause(searchParams: URLSearchParams) {
  const where: Record<string, any> = {};
  
  const status = searchParams.get("status");
  const search = searchParams.get("search");
  const requesterId = searchParams.get("requesterId");
  const handlerId = searchParams.get("handlerId");
  const caseType = searchParams.get("caseType");

  if (status) where.status = status;
  if (requesterId) where.requesterId = requesterId;
  if (handlerId) where.handlerId = handlerId;
  if (caseType) where.caseType = caseType;
  
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { requester: { fullName: { contains: search, mode: 'insensitive' } } },
      { handler: { fullName: { contains: search, mode: 'insensitive' } } }
    ];
  }

  return where;
}

// Common case include fields
export const commonCaseIncludes = {
  requester: {
    select: {
      id: true,
      fullName: true,
      position: true,
      department: true,
      companyEmail: true,
      avatar: true
    }
  },
  handler: {
    select: {
      id: true,
      fullName: true,
      position: true,
      department: true,
      companyEmail: true,
      avatar: true
    }
  }
};