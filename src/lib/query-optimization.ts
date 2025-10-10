import { db } from "@/lib/db";

// Cached queries for frequently accessed data
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, { data: any; timestamp: number }>();

function getCacheKey(prefix: string, params?: Record<string, any>): string {
    return `${prefix}:${params ? JSON.stringify(params) : 'all'}`;
}

function isExpired(timestamp: number): boolean {
    return Date.now() - timestamp > CACHE_TTL;
}

export async function getCachedData<T>(
    key: string,
    fetcher: () => Promise<T>
): Promise<T> {
    const cached = cache.get(key);

    if (cached && !isExpired(cached.timestamp)) {
        return cached.data;
    }

    const data = await fetcher();
    cache.set(key, { data, timestamp: Date.now() });

    return data;
}

export function invalidateCache(pattern?: string) {
    if (pattern) {
        for (const key of cache.keys()) {
            if (key.includes(pattern)) {
                cache.delete(key);
            }
        }
    } else {
        cache.clear();
    }
}

// Optimized employee queries
export const employeeQueries = {
    async getActiveEmployees() {
        return getCachedData('employees:active', () =>
            db.employee.findMany({
                where: { status: "active" },
                select: {
                    id: true,
                    fullName: true,
                    position: true,
                    department: true,
                    companyEmail: true
                },
                orderBy: { fullName: 'asc' }
            })
        );
    },

    async getEmployeeById(id: string) {
        return getCachedData(`employee:${id}`, () =>
            db.employee.findUnique({
                where: { id },
                select: {
                    id: true,
                    fullName: true,
                    position: true,
                    department: true,
                    companyEmail: true,
                    avatar: true
                }
            })
        );
    }
};

// Optimized case type queries
export const caseTypeQueries = {
    async getDeploymentTypes() {
        return getCachedData('deployment-types', () =>
            db.deploymentType.findMany({
                select: { id: true, name: true },
                orderBy: { name: 'asc' }
            })
        );
    },

    async getMaintenanceTypes() {
        return getCachedData('maintenance-types', () =>
            db.maintenanceCaseType.findMany({
                select: { id: true, name: true },
                orderBy: { name: 'asc' }
            })
        );
    },

    async getWarrantyTypes() {
        return getCachedData('warranty-types', () =>
            db.warrantyType.findMany({
                select: { id: true, name: true },
                orderBy: { name: 'asc' }
            })
        );
    }
};

// Batch operations for better performance
export const batchOperations = {
    async getMultipleEmployees(ids: string[]) {
        if (ids.length === 0) return [];

        return db.employee.findMany({
            where: { id: { in: ids } },
            select: {
                id: true,
                fullName: true,
                position: true,
                department: true,
                companyEmail: true,
                avatar: true
            }
        });
    },

    async getCaseStatistics(caseType: 'internal' | 'deployment' | 'maintenance' | 'warranty' | 'receiving') {
        const tableName = `${caseType}Case`;

        return getCachedData(`stats:${caseType}`, async () => {
            // Use raw query for better performance on statistics
            const result = await db.$queryRaw`
        SELECT 
          status,
          COUNT(*) as count,
          DATE_TRUNC('month', "createdAt") as month
        FROM "${tableName}"
        WHERE "createdAt" >= NOW() - INTERVAL '12 months'
        GROUP BY status, DATE_TRUNC('month', "createdAt")
        ORDER BY month DESC
      `;

            return result;
        });
    }
};

// Database health check
export async function checkDatabaseHealth(): Promise<boolean> {
    try {
        await db.$queryRaw`SELECT 1`;
        return true;
    } catch (error) {
        console.error('Database health check failed:', error);
        return false;
    }
}

// Connection pool monitoring
export function getConnectionInfo() {
    return {
        // These would be available in newer Prisma versions
        // activeConnections: db.$metrics?.counters?.prisma_client_queries_active || 0,
        // totalConnections: db.$metrics?.counters?.prisma_client_queries_total || 0,
        cacheSize: cache.size,
        cacheKeys: Array.from(cache.keys())
    };
}