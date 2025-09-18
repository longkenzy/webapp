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
        // Kiểm tra từng bảng một cách tuần tự
        const userCount = await prisma.user.count();
        console.log(`User${' '.repeat(16)}: ${userCount} bản ghi`);

        const partnerCount = await prisma.partner.count();
        console.log(`Partner${' '.repeat(14)}: ${partnerCount} bản ghi`);

        const employeeCount = await prisma.employee.count();
        console.log(`Employee${' '.repeat(12)}: ${employeeCount} bản ghi`);

        const incidentTypeCount = await prisma.incidentType.count();
        console.log(`IncidentType${' '.repeat(9)}: ${incidentTypeCount} bản ghi`);

        const maintenanceTypeCount = await prisma.maintenanceType.count();
        console.log(`MaintenanceType${' '.repeat(6)}: ${maintenanceTypeCount} bản ghi`);

        const warrantyTypeCount = await prisma.warrantyType.count();
        console.log(`WarrantyType${' '.repeat(9)}: ${warrantyTypeCount} bản ghi`);

        const evaluationConfigCount = await prisma.evaluationConfig.count();
        console.log(`EvaluationConfig${' '.repeat(5)}: ${evaluationConfigCount} bản ghi`);

        const incidentCount = await prisma.incident.count();
        console.log(`Incident${' '.repeat(13)}: ${incidentCount} bản ghi`);

        const maintenanceCaseCount = await prisma.maintenanceCase.count();
        console.log(`MaintenanceCase${' '.repeat(6)}: ${maintenanceCaseCount} bản ghi`);

        const warrantyCaseCount = await prisma.warrantyCase.count();
        console.log(`WarrantyCase${' '.repeat(9)}: ${warrantyCaseCount} bản ghi`);

        const internalCaseCount = await prisma.internalCase.count();
        console.log(`InternalCase${' '.repeat(9)}: ${internalCaseCount} bản ghi`);

        const deliveryCaseCount = await prisma.deliveryCase.count();
        console.log(`DeliveryCase${' '.repeat(9)}: ${deliveryCaseCount} bản ghi`);

        const receivingCaseCount = await prisma.receivingCase.count();
        console.log(`ReceivingCase${' '.repeat(8)}: ${receivingCaseCount} bản ghi`);

        const notificationCount = await prisma.notification.count();
        console.log(`Notification${' '.repeat(9)}: ${notificationCount} bản ghi`);

        const scheduleCount = await prisma.schedule.count();
        console.log(`Schedule${' '.repeat(13)}: ${scheduleCount} bản ghi`);

        const totalRecords = userCount + partnerCount + employeeCount + incidentTypeCount + 
                           maintenanceTypeCount + warrantyTypeCount + evaluationConfigCount +
                           incidentCount + maintenanceCaseCount + warrantyCaseCount + 
                           internalCaseCount + deliveryCaseCount + receivingCaseCount +
                           notificationCount + scheduleCount;

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
            console.log('');
            console.log('Để kiểm tra chi tiết:');
            console.log('  npx prisma studio --schema=src/prisma/schema.prisma');
        }

    } catch (error) {
        console.error('❌ Lỗi khi kiểm tra dữ liệu:', error.message);
        console.log('');
        console.log('Có thể database chưa được khởi tạo hoặc có lỗi kết nối.');
        console.log('Thử chạy: npx prisma db push --schema=src/prisma/schema.prisma');
    } finally {
        await prisma.$disconnect();
    }
}

checkDevData();
