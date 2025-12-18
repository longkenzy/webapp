import { db } from './db';
import { createLongTermCaseNotification } from './notifications';

export async function checkAndNotifyLongTermCases() {
    const now = new Date();
    const threshold = 18 * 60 * 60 * 1000; // 18 hours
    const pastLimit = new Date(now.getTime() - threshold);

    try {
        // We need to check all case types
        const caseTypes = [
            { table: 'internalCase', type: 'internal' },
            { table: 'deliveryCase', type: 'delivery' },
            { table: 'receivingCase', type: 'receiving' },
            { table: 'maintenanceCase', type: 'maintenance' },
            { table: 'incident', type: 'incident' },
            { table: 'warranty', type: 'warranty' },
            { table: 'deploymentCase', type: 'deployment' },
        ];

        let totalNotificationsSent = 0;

        for (const item of caseTypes) {
            // Find incomplete cases older than 18h
            const cases = await (db as any)[item.table].findMany({
                where: {
                    startDate: { lt: pastLimit },
                    status: { notIn: ['COMPLETED', 'RESOLVED', 'CANCELLED', 'HOÀN THÀNH', 'HỦY'] },
                    handlerId: { not: null }
                },
                include: {
                    handler: {
                        include: {
                            user: true
                        }
                    }
                }
            });

            for (const case_ of cases) {
                if (!case_.handler?.user) continue;

                const userId = case_.handler.user.id;

                // Check if a long-term notification already exists for this case
                const existingNotification = await db.notification.findFirst({
                    where: {
                        userId,
                        caseId: case_.id,
                        title: { contains: 'quá hạn 18h' }
                    }
                });

                if (!existingNotification) {
                    await createLongTermCaseNotification(
                        item.type,
                        case_.id,
                        case_.title,
                        userId
                    );
                    totalNotificationsSent++;
                    console.log(`Sent long-term notification for ${item.type} case: ${case_.id}`);
                }
            }
        }

        return totalNotificationsSent;
    } catch (error) {
        console.error('Error in checkAndNotifyLongTermCases:', error);
        return 0;
    }
}
