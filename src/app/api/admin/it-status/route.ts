import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session || (session.user.role !== "ADMIN" && session.user.role !== "IT_LEAD")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 1. Get all active users with employee profiles
        const itStaff = await db.user.findMany({
            where: {
                // Show all active users who have an employee profile
                status: "active",
                employeeId: { not: null },
                employee: {
                    department: "IT DEPARTMENT"
                }
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                employee: {
                    select: {
                        id: true,
                        fullName: true,
                        avatar: true,
                        position: true,
                        department: true
                    }
                }
            }
        });

        // 2. Definition of "Active" statuses for each case type
        const activeStatuses = {
            internal: ['IN_PROGRESS'],
            receiving: ['IN_PROGRESS'],
            delivery: ['IN_PROGRESS'],
            incident: ['PROCESSING'],
            maintenance: ['PROCESSING'],
            warranty: ['PROCESSING'],
            deployment: ['PROCESSING']
        };

        // 3. Check active cases for each staff
        // We can do this efficiently by querying cases where handlerId is in our list of employeeIDs
        // and status is active.

        const employeeIds = itStaff.map(u => u.employee?.id).filter(Boolean) as string[];

        // Parallelize queries for all case types
        const [
            internalCases,
            receivingCases,
            deliveryCases,
            incidents,
            maintenanceCases,
            warranties,
            deploymentCases
        ] = await Promise.all([
            db.internalCase.findMany({
                where: { handlerId: { in: employeeIds }, status: { in: activeStatuses.internal as any } },
                select: { id: true, title: true, handlerId: true, startDate: true, requester: { select: { fullName: true } }, description: true, notes: true }
            }),
            db.receivingCase.findMany({
                where: { handlerId: { in: employeeIds }, status: { in: activeStatuses.receiving as any } },
                select: { id: true, title: true, handlerId: true, startDate: true, supplier: { select: { shortName: true } }, description: true, notes: true }
            }),
            db.deliveryCase.findMany({
                where: { handlerId: { in: employeeIds }, status: { in: activeStatuses.delivery as any } },
                select: { id: true, title: true, handlerId: true, startDate: true, customer: { select: { shortName: true } }, description: true, notes: true }
            }),
            db.incident.findMany({
                where: { handlerId: { in: employeeIds }, status: { in: activeStatuses.incident as any } },
                select: { id: true, title: true, handlerId: true, startDate: true, customerName: true, customer: { select: { shortName: true } }, description: true, notes: true }
            }),
            db.maintenanceCase.findMany({
                where: { handlerId: { in: employeeIds }, status: { in: activeStatuses.maintenance as any } },
                select: { id: true, title: true, handlerId: true, startDate: true, customerName: true, customer: { select: { shortName: true } }, description: true, notes: true }
            }),
            db.warranty.findMany({
                where: { handlerId: { in: employeeIds }, status: { in: activeStatuses.warranty as any } },
                select: { id: true, title: true, handlerId: true, startDate: true, customerName: true, customer: { select: { shortName: true } }, description: true, notes: true }
            }),
            db.deploymentCase.findMany({
                where: { handlerId: { in: employeeIds }, status: { in: activeStatuses.deployment as any } },
                select: { id: true, title: true, handlerId: true, startDate: true, customerName: true, customer: { select: { shortName: true } }, description: true, notes: true }
            }),
        ]);

        // 4. Map results back to users
        const staffStatus = itStaff.map(user => {
            const empId = user.employee?.id;
            if (!empId) return null;

            const activeCases: any[] = [];

            const userInternal = internalCases.filter(c => c.handlerId === empId);
            userInternal.forEach(internal => {
                activeCases.push({
                    id: internal.id,
                    title: internal.title,
                    type: 'Nội bộ',
                    client: internal.requester?.fullName || 'N/A',
                    startTime: internal.startDate,
                    description: internal.description,
                    notes: internal.notes
                });
            });

            const userReceiving = receivingCases.filter(c => c.handlerId === empId);
            userReceiving.forEach(receiving => {
                activeCases.push({
                    id: receiving.id,
                    title: receiving.title,
                    type: 'Nhận hàng',
                    client: receiving.supplier?.shortName || 'N/A',
                    startTime: receiving.startDate,
                    description: receiving.description,
                    notes: receiving.notes
                });
            });

            const userDelivery = deliveryCases.filter(c => c.handlerId === empId);
            userDelivery.forEach(delivery => {
                activeCases.push({
                    id: delivery.id,
                    title: delivery.title,
                    type: 'Giao hàng',
                    client: delivery.customer?.shortName || 'N/A',
                    startTime: delivery.startDate,
                    description: delivery.description,
                    notes: delivery.notes
                });
            });

            const userIncident = incidents.filter(c => c.handlerId === empId);
            userIncident.forEach(incident => {
                activeCases.push({
                    id: incident.id,
                    title: incident.title,
                    type: 'Sự cố',
                    client: incident.customer?.shortName || incident.customerName || 'N/A',
                    startTime: incident.startDate,
                    description: incident.description,
                    notes: incident.notes
                });
            });

            const userMaintenance = maintenanceCases.filter(c => c.handlerId === empId);
            userMaintenance.forEach(maintenance => {
                activeCases.push({
                    id: maintenance.id,
                    title: maintenance.title,
                    type: 'Bảo trì',
                    client: maintenance.customer?.shortName || maintenance.customerName || 'N/A',
                    startTime: maintenance.startDate,
                    description: maintenance.description,
                    notes: maintenance.notes
                });
            });

            const userWarranty = warranties.filter(c => c.handlerId === empId);
            userWarranty.forEach(warranty => {
                activeCases.push({
                    id: warranty.id,
                    title: warranty.title,
                    type: 'Bảo hành',
                    client: warranty.customer?.shortName || warranty.customerName || 'N/A',
                    startTime: warranty.startDate,
                    description: warranty.description,
                    notes: warranty.notes
                });
            });

            const userDeployment = deploymentCases.filter(c => c.handlerId === empId);
            userDeployment.forEach(deployment => {
                activeCases.push({
                    id: deployment.id,
                    title: deployment.title,
                    type: 'Triển khai',
                    client: deployment.customer?.shortName || deployment.customerName || 'N/A',
                    startTime: deployment.startDate,
                    description: deployment.description,
                    notes: deployment.notes
                });
            });

            return {
                id: user.id,
                employeeId: empId,
                name: user.employee?.fullName || user.name,
                avatar: user.employee?.avatar,
                position: user.employee?.position || user.role,
                isOnline: activeCases.length > 0,
                activeCases: activeCases
            };
        }).filter(Boolean);

        return NextResponse.json(staffStatus);

    } catch (error) {
        console.error("Error fetching IT status:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
