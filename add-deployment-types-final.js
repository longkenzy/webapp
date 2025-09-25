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
        description: 'Cài đặt server, database'
      },
      {
        id: 'deployment_type_10',
        name: 'Triển khai mạng',
        description: 'Thiết lập LAN, WAN, VPN'
      },
      {
        id: 'deployment_type_11',
        name: 'Triển khai bảo mật',
        description: 'Firewall, antivirus, SSL'
      },
      {
        id: 'deployment_type_12',
        name: 'Triển khai backup',
        description: 'Sao lưu dữ liệu, hệ thống'
      },
      {
        id: 'deployment_type_13',
        name: 'Triển khai monitoring',
        description: 'Giám sát hệ thống, mạng'
      },
      {
        id: 'deployment_type_14',
        name: 'Triển khai user management',
        description: 'Quản lý người dùng, phân quyền'
      },
      {
        id: 'deployment_type_15',
        name: 'Triển khai email server',
        description: 'Hệ thống email nội bộ'
      },
      {
        id: 'deployment_type_16',
        name: 'Triển khai file server',
        description: 'Lưu trữ file, chia sẻ'
      },
      {
        id: 'deployment_type_17',
        name: 'Triển khai print server',
        description: 'Hệ thống in ấn'
      },
      {
        id: 'deployment_type_18',
        name: 'Triển khai remote access',
        description: 'Truy cập từ xa, remote desktop'
      },
      {
        id: 'deployment_type_19',
        name: 'Triển khai network security',
        description: 'Bảo mật mạng, access control'
      },
      {
        id: 'deployment_type_20',
        name: 'Triển khai system update',
        description: 'Cập nhật hệ thống, patch'
      }
    ];

    let addedCount = 0;

    for (const type of deploymentTypes) {
      try {
        await prisma.deploymentType.create({
          data: type
        });
        console.log(`✅ Added: ${type.name}`);
        addedCount++;
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`⚠️  Already exists: ${type.name}`);
        } else {
          console.log(`❌ Error adding "${type.name}":`, error.message);
        }
      }
    }

    console.log(`🎉 Successfully processed ${deploymentTypes.length} deployment types!`);
    console.log(`📋 Added ${addedCount} new deployment types focused on IT helpdesk, system, and network`);

  } catch (error) {
    console.error('❌ Error adding deployment types:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addDeploymentTypes();
