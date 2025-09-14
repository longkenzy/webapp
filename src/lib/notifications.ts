import { db } from '@/lib/db';
import { NotificationType } from '@prisma/client';

export interface CreateNotificationParams {
  title: string;
  message: string;
  type: NotificationType;
  userId: string;
  caseId?: string;
  caseType?: string;
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    const notification = await db.notification.create({
      data: {
        title: params.title,
        message: params.message,
        type: params.type,
        userId: params.userId,
        caseId: params.caseId,
        caseType: params.caseType
      }
    });

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

export async function createCaseCreatedNotification(
  caseType: string,
  caseId: string,
  caseTitle: string,
  requesterName: string,
  adminUserId: string
) {
  const caseTypeMap: Record<string, string> = {
    'internal': 'Case nội bộ',
    'delivery': 'Case giao hàng',
    'receiving': 'Case nhận hàng',
    'maintenance': 'Case bảo trì',
    'warranty': 'Case bảo hành',
    'incident': 'Case sự cố'
  };

  const displayCaseType = caseTypeMap[caseType] || caseType;

  return createNotification({
    title: `Case ${displayCaseType} mới được tạo`,
    message: `${requesterName} đã tạo case "${caseTitle}"`,
    type: NotificationType.CASE_CREATED,
    userId: adminUserId,
    caseId,
    caseType
  });
}

export async function getAdminUsers() {
  try {
    const adminUsers = await db.user.findMany({
      where: {
        role: {
          in: ['ADMIN', 'IT_LEAD']
        }
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    return adminUsers;
  } catch (error) {
    console.error('Error fetching admin users:', error);
    throw error;
  }
}
