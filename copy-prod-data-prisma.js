// Script copy dữ liệu từ Production sang Development sử dụng Prisma
const { PrismaClient } = require('@prisma/client');

// Khởi tạo Prisma client cho production
const prodPrisma = new PrismaClient({
    datasources: {
        db: {
            url: "postgresql://neondb_owner:npg_jzQACkco0T8S@ep-broad-truth-a1v49nhu-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
        }
    }
});

// Khởi tạo Prisma client cho development
const devPrisma = new PrismaClient({
    datasources: {
        db: {
            url: "postgresql://neondb_owner:npg_jzQACkco0T8S@ep-rapid-dream-a1b4rn5j-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
        }
    }
});

async function copyProdDataToDev() {
    console.log('=== COPY DỮ LIỆU PRODUCTION SANG DEVELOPMENT ===');
    console.log('Production: ep-broad-truth-a1v49nhu');
    console.log('Development: ep-rapid-dream-a1b4rn5j');
    console.log('');

    try {
        console.log('Bước 1: Xóa dữ liệu cũ trong development...');
        
        // Xóa dữ liệu theo thứ tự để tránh foreign key constraint
        await devPrisma.notification.deleteMany();
        await devPrisma.schedule.deleteMany();
        await devPrisma.deliveryCase.deleteMany();
        await devPrisma.receivingCase.deleteMany();
        await devPrisma.internalCase.deleteMany();
        await devPrisma.warranty.deleteMany();
        await devPrisma.deploymentCase.deleteMany();
        await devPrisma.maintenanceCase.deleteMany();
        await devPrisma.incident.deleteMany();
        await devPrisma.evaluationConfig.deleteMany();
        await devPrisma.warrantyType.deleteMany();
        await devPrisma.deploymentType.deleteMany();
        await devPrisma.maintenanceCaseType.deleteMany();
        await devPrisma.incidentType.deleteMany();
        await devPrisma.employee.deleteMany();
        await devPrisma.partner.deleteMany();
        await devPrisma.user.deleteMany();
        
        console.log('✅ Xóa dữ liệu cũ thành công');

        console.log('');
        console.log('Bước 2: Copy dữ liệu từ production...');

        // Copy dữ liệu theo thứ tự (không có foreign key trước)
        console.log('  - Copying Partners...');
        const partners = await prodPrisma.partner.findMany();
        if (partners.length > 0) {
            await devPrisma.partner.createMany({ data: partners });
            console.log(`    ✅ Copied ${partners.length} partners`);
        }

        console.log('  - Copying Employees...');
        const employees = await prodPrisma.employee.findMany();
        if (employees.length > 0) {
            await devPrisma.employee.createMany({ data: employees });
            console.log(`    ✅ Copied ${employees.length} employees`);
        }

        console.log('  - Copying Users...');
        const users = await prodPrisma.user.findMany();
        if (users.length > 0) {
            // Xử lý foreign key employeeId
            const usersData = users.map(user => ({
                ...user,
                employeeId: user.employeeId || null
            }));
            await devPrisma.user.createMany({ data: usersData });
            console.log(`    ✅ Copied ${users.length} users`);
        }

        console.log('  - Copying IncidentTypes...');
        const incidentTypes = await prodPrisma.incidentType.findMany();
        if (incidentTypes.length > 0) {
            await devPrisma.incidentType.createMany({ data: incidentTypes });
            console.log(`    ✅ Copied ${incidentTypes.length} incident types`);
        }

        console.log('  - Copying MaintenanceCaseTypes...');
        const maintenanceCaseTypes = await prodPrisma.maintenanceCaseType.findMany();
        if (maintenanceCaseTypes.length > 0) {
            await devPrisma.maintenanceCaseType.createMany({ data: maintenanceCaseTypes });
            console.log(`    ✅ Copied ${maintenanceCaseTypes.length} maintenance case types`);
        }

        console.log('  - Copying WarrantyTypes...');
        const warrantyTypes = await prodPrisma.warrantyType.findMany();
        if (warrantyTypes.length > 0) {
            await devPrisma.warrantyType.createMany({ data: warrantyTypes });
            console.log(`    ✅ Copied ${warrantyTypes.length} warranty types`);
        }

        console.log('  - Copying DeploymentTypes...');
        try {
            const deploymentTypes = await prodPrisma.deploymentType.findMany();
            if (deploymentTypes.length > 0) {
                await devPrisma.deploymentType.createMany({ data: deploymentTypes });
                console.log(`    ✅ Copied ${deploymentTypes.length} deployment types`);
            } else {
                console.log(`    ⚠️  No deployment types found`);
            }
        } catch (error) {
            console.log(`    ⚠️  DeploymentType table does not exist in production`);
        }

        console.log('  - Copying EvaluationConfigs...');
        try {
            const evaluationConfigs = await prodPrisma.evaluationConfig.findMany();
            if (evaluationConfigs.length > 0) {
                await devPrisma.evaluationConfig.createMany({ data: evaluationConfigs });
                console.log(`    ✅ Copied ${evaluationConfigs.length} evaluation configs`);
            } else {
                console.log(`    ⚠️  No evaluation configs found`);
            }
        } catch (error) {
            console.log(`    ⚠️  EvaluationConfig table does not exist in production`);
        }

        console.log('  - Copying Incidents...');
        try {
            const incidents = await prodPrisma.incident.findMany();
            if (incidents.length > 0) {
                await devPrisma.incident.createMany({ data: incidents });
                console.log(`    ✅ Copied ${incidents.length} incidents`);
            } else {
                console.log(`    ⚠️  No incidents found`);
            }
        } catch (error) {
            console.log(`    ⚠️  Incident table does not exist in production`);
        }

        console.log('  - Copying MaintenanceCases...');
        try {
            const maintenanceCases = await prodPrisma.maintenanceCase.findMany();
            if (maintenanceCases.length > 0) {
                await devPrisma.maintenanceCase.createMany({ data: maintenanceCases });
                console.log(`    ✅ Copied ${maintenanceCases.length} maintenance cases`);
            } else {
                console.log(`    ⚠️  No maintenance cases found`);
            }
        } catch (error) {
            console.log(`    ⚠️  MaintenanceCase table does not exist in production`);
        }

        console.log('  - Copying Warranties...');
        try {
            const warranties = await prodPrisma.warranty.findMany();
            if (warranties.length > 0) {
                await devPrisma.warranty.createMany({ data: warranties });
                console.log(`    ✅ Copied ${warranties.length} warranties`);
            } else {
                console.log(`    ⚠️  No warranties found`);
            }
        } catch (error) {
            console.log(`    ⚠️  Warranty table does not exist in production`);
        }

        console.log('  - Copying DeploymentCases...');
        try {
            const deploymentCases = await prodPrisma.deploymentCase.findMany();
            if (deploymentCases.length > 0) {
                await devPrisma.deploymentCase.createMany({ data: deploymentCases });
                console.log(`    ✅ Copied ${deploymentCases.length} deployment cases`);
            } else {
                console.log(`    ⚠️  No deployment cases found`);
            }
        } catch (error) {
            console.log(`    ⚠️  DeploymentCase table does not exist in production`);
        }

        console.log('  - Copying InternalCases...');
        try {
            const internalCases = await prodPrisma.internalCase.findMany();
            if (internalCases.length > 0) {
                await devPrisma.internalCase.createMany({ data: internalCases });
                console.log(`    ✅ Copied ${internalCases.length} internal cases`);
            } else {
                console.log(`    ⚠️  No internal cases found`);
            }
        } catch (error) {
            console.log(`    ⚠️  InternalCase table does not exist in production`);
        }

        console.log('  - Copying DeliveryCases...');
        try {
            const deliveryCases = await prodPrisma.deliveryCase.findMany();
            if (deliveryCases.length > 0) {
                await devPrisma.deliveryCase.createMany({ data: deliveryCases });
                console.log(`    ✅ Copied ${deliveryCases.length} delivery cases`);
            } else {
                console.log(`    ⚠️  No delivery cases found`);
            }
        } catch (error) {
            console.log(`    ⚠️  DeliveryCase table does not exist in production`);
        }

        console.log('  - Copying ReceivingCases...');
        try {
            const receivingCases = await prodPrisma.receivingCase.findMany();
            if (receivingCases.length > 0) {
                await devPrisma.receivingCase.createMany({ data: receivingCases });
                console.log(`    ✅ Copied ${receivingCases.length} receiving cases`);
            } else {
                console.log(`    ⚠️  No receiving cases found`);
            }
        } catch (error) {
            console.log(`    ⚠️  ReceivingCase table does not exist in production`);
        }

        console.log('  - Copying Notifications...');
        try {
            const notifications = await prodPrisma.notification.findMany();
            if (notifications.length > 0) {
                await devPrisma.notification.createMany({ data: notifications });
                console.log(`    ✅ Copied ${notifications.length} notifications`);
            } else {
                console.log(`    ⚠️  No notifications found`);
            }
        } catch (error) {
            console.log(`    ⚠️  Notification table does not exist in production`);
        }

        console.log('  - Copying Schedules...');
        try {
            const schedules = await prodPrisma.schedule.findMany();
            if (schedules.length > 0) {
                await devPrisma.schedule.createMany({ data: schedules });
                console.log(`    ✅ Copied ${schedules.length} schedules`);
            } else {
                console.log(`    ⚠️  No schedules found`);
            }
        } catch (error) {
            console.log(`    ⚠️  Schedule table does not exist in production`);
        }

        console.log('');
        console.log('✅ HOÀN THÀNH COPY DỮ LIỆU!');
        console.log('Dữ liệu production đã được copy sang development');

        console.log('');
        console.log('Bước 3: Kiểm tra kết quả...');
        
        // Kiểm tra số lượng bản ghi sau khi copy
        const devUserCount = await devPrisma.user.count();
        const devPartnerCount = await devPrisma.partner.count();
        const devEmployeeCount = await devPrisma.employee.count();
        const devIncidentCount = await devPrisma.incident.count();
        const devMaintenanceCaseCount = await devPrisma.maintenanceCase.count();
        const devWarrantyCount = await devPrisma.warranty.count();
        const devInternalCaseCount = await devPrisma.internalCase.count();
        const devDeliveryCaseCount = await devPrisma.deliveryCase.count();
        const devReceivingCaseCount = await devPrisma.receivingCase.count();

        console.log('Số lượng bản ghi sau khi copy:');
        console.log(`  - Users: ${devUserCount}`);
        console.log(`  - Partners: ${devPartnerCount}`);
        console.log(`  - Employees: ${devEmployeeCount}`);
        console.log(`  - Incidents: ${devIncidentCount}`);
        console.log(`  - MaintenanceCases: ${devMaintenanceCaseCount}`);
        console.log(`  - Warranties: ${devWarrantyCount}`);
        console.log(`  - InternalCases: ${devInternalCaseCount}`);
        console.log(`  - DeliveryCases: ${devDeliveryCaseCount}`);
        console.log(`  - ReceivingCases: ${devReceivingCaseCount}`);

        const totalDevRecords = devUserCount + devPartnerCount + devEmployeeCount + 
                               devIncidentCount + devMaintenanceCaseCount + devWarrantyCount +
                               devInternalCaseCount + devDeliveryCaseCount + devReceivingCaseCount;

        console.log(`Tổng cộng: ${totalDevRecords} bản ghi`);

        if (totalDevRecords > 0) {
            console.log('');
            console.log('🎉 COPY DỮ LIỆU THÀNH CÔNG!');
            console.log('Database development đã có dữ liệu từ production');
            console.log('');
            console.log('Để kiểm tra chi tiết:');
            console.log('  npx prisma studio --schema=src/prisma/schema.prisma');
        } else {
            console.log('');
            console.log('⚠️  Không có dữ liệu nào được copy');
            console.log('Có thể production database cũng chưa có dữ liệu');
        }

    } catch (error) {
        console.error('❌ Lỗi khi copy dữ liệu:', error.message);
        console.log('');
        console.log('Có thể có lỗi kết nối hoặc schema không khớp');
    } finally {
        await prodPrisma.$disconnect();
        await devPrisma.$disconnect();
    }
}

copyProdDataToDev();
