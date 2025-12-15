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
                employeeId: { not: null }
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
                select: { id: true, title: true, handlerId: true }
            }),
            db.receivingCase.findMany({
                where: { handlerId: { in: employeeIds }, status: { in: activeStatuses.receiving as any } },
                select: { id: true, title: true, handlerId: true }
            }),
            db.deliveryCase.findMany({
                where: { handlerId: { in: employeeIds }, status: { in: activeStatuses.delivery as any } },
                select: { id: true, title: true, handlerId: true }
            }),
            db.incident.findMany({
                where: { handlerId: { in: employeeIds }, status: { in: activeStatuses.incident as any } },
                select: { id: true, title: true, handlerId: true }
            }),
            db.maintenanceCase.findMany({
                where: { handlerId: { in: employeeIds }, status: { in: activeStatuses.maintenance as any } },
                select: { id: true, title: true, handlerId: true }
            }),
            db.warranty.findMany({
                where: { handlerId: { in: employeeIds }, status: { in: activeStatuses.warranty as any } },
                select: { id: true, title: true, handlerId: true }
            }),
            db.deploymentCase.findMany({
                where: { handlerId: { in: employeeIds }, status: { in: activeStatuses.deployment as any } },
                select: { id: true, title: true, handlerId: true }
            }),
        ]);

        // 4. Map results back to users
        const staffStatus = itStaff.map(user => {
            const empId = user.employee?.id;
            if (!empId) return null;

            const activeCase =
                internalCases.find(c => c.handlerId === empId) ||
                receivingCases.find(c => c.handlerId === empId) ||
                deliveryCases.find(c => c.handlerId === empId) ||
                incidents.find(c => c.handlerId === empId) ||
                maintenanceCases.find(c => c.handlerId === empId) ||
                warranties.find(c => c.handlerId === empId) ||
                deploymentCases.find(c => c.handlerId === empId);

            return {
                id: user.id,
                employeeId: empId,
                name: user.employee?.fullName || user.name,
                avatar: user.employee?.avatar,
                position: user.employee?.position || user.role,
                isOnline: !!activeCase,
                currentCase: activeCase ? {
                    id: activeCase.id,
                    title: activeCase.title
                } : null
            };
        }).filter(Boolean);

        return NextResponse.json(staffStatus);

    } catch (error) {
        console.error("Error fetching IT status:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
