const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_jzQACkco0T8S@ep-broad-truth-a1v49nhu-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
    }
  }
});

async function addDeploymentTypes() {
  try {
    console.log('🚀 Adding new deployment types to production database...');
    
    const deploymentTypes = [
      {
        id: 'deployment_type_9',
        name: 'Triển khai hệ thống',
        description: 'Cài đặt server, database',
        isActive: true
      },
      {
        id: 'deployment_type_10',
        name: 'Triển khai mạng',
        description: 'Thiết lập LAN, WAN, VPN',
        isActive: true
      },
      {
        id: 'deployment_type_11',
        name: 'Triển khai bảo mật',
        description: 'Firewall, antivirus, SSL',
        isActive: true
      },
      {
        id: 'deployment_type_12',
        name: 'Triển khai backup',
        description: 'Sao lưu dữ liệu, hệ thống',
        isActive: true
      },
      {
        id: 'deployment_type_13',
        name: 'Triển khai monitoring',
        description: 'Giám sát hệ thống, mạng',
        isActive: true
      },
      {
        id: 'deployment_type_14',
        name: 'Triển khai user management',
        description: 'Quản lý người dùng, phân quyền',
        isActive: true
      },
      {
        id: 'deployment_type_15',
        name: 'Triển khai email server',
        description: 'Hệ thống email nội bộ',
        isActive: true
      },
      {
        id: 'deployment_type_16',
        name: 'Triển khai file server',
        description: 'Lưu trữ file, chia sẻ',
        isActive: true
      },
      {
        id: 'deployment_type_17',
        name: 'Triển khai print server',
        description: 'Hệ thống in ấn',
        isActive: true
      },
      {
        id: 'deployment_type_18',
        name: 'Triển khai remote access',
        description: 'Truy cập từ xa, remote desktop',
        isActive: true
      },
      {
        id: 'deployment_type_19',
        name: 'Triển khai network security',
        description: 'Bảo mật mạng, access control',
        isActive: true
      },
      {
        id: 'deployment_type_20',
        name: 'Triển khai system update',
        description: 'Cập nhật hệ thống, patch',
        isActive: true
      }
    ];

    // Check if deployment types already exist
    for (const type of deploymentTypes) {
      const existing = await prisma.deploymentType.findUnique({
        where: { id: type.id }
      });

      if (existing) {
        console.log(`⚠️  Deployment type "${type.name}" already exists, skipping...`);
        continue;
      }

      await prisma.deploymentType.create({
        data: type
      });
      console.log(`✅ Added: ${type.name}`);
    }

    console.log('🎉 Successfully added new deployment types to production database!');
    console.log('📋 Added 12 new deployment types focused on IT helpdesk, system, and network');

  } catch (error) {
    console.error('❌ Error adding deployment types:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addDeploymentTypes();
