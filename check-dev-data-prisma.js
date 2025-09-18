// Script kiểm tra dữ liệu database development sử dụng Prisma
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDevData() {
    console.log('=== KIỂM TRA DỮ LIỆU DATABASE DEVELOPMENT ===');
    console.log('Database: ep-rapid-dream-a1b4rn5j (Development)');
    console.log('');
    console.log('Số lượng bản ghi trong các bảng:');
    console.log('=================================');

    try {
        const counts = await Promise.all([
            prisma.user.count().then(count => ({ table: 'User', count })),
            prisma.partner.count().then(count => ({ table: 'Partner', count })),
            prisma.employee.count().then(count => ({ table: 'Employee', count })),
            prisma.incidentType.count().then(count => ({ table: 'IncidentType', count })),
            prisma.maintenanceType.count().then(count => ({ table: 'MaintenanceType', count })),
            prisma.warrantyType.count().then(count => ({ table: 'WarrantyType', count })),
            prisma.evaluationConfig.count().then(count => ({ table: 'EvaluationConfig', count })),
            prisma.incident.count().then(count => ({ table: 'Incident', count })),
            prisma.maintenanceCase.count().then(count => ({ table: 'MaintenanceCase', count })),
            prisma.warrantyCase.count().then(count => ({ table: 'WarrantyCase', count })),
            prisma.internalCase.count().then(count => ({ table: 'InternalCase', count })),
            prisma.deliveryCase.count().then(count => ({ table: 'DeliveryCase', count })),
            prisma.receivingCase.count().then(count => ({ table: 'ReceivingCase', count })),
            prisma.notification.count().then(count => ({ table: 'Notification', count })),
            prisma.schedule.count().then(count => ({ table: 'Schedule', count }))
        ]);

        counts.forEach(({ table, count }) => {
            console.log(`${table.padEnd(20)}: ${count} bản ghi`);
        });

        const totalRecords = counts.reduce((sum, { count }) => sum + count, 0);
        console.log('=================================');
        console.log(`Tổng cộng: ${totalRecords} bản ghi`);

        if (totalRecords === 0) {
            console.log('');
            console.log('⚠️  Database development CHƯA CÓ DỮ LIỆU');
            console.log('Để copy dữ liệu từ production:');
            console.log('  .\\copy-prod-data-simple.ps1');
        } else {
            console.log('');
            console.log('✅ Database development ĐÃ CÓ DỮ LIỆU');
        }

    } catch (error) {
        console.error('❌ Lỗi khi kiểm tra dữ liệu:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkDevData();
