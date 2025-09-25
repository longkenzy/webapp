const { Client } = require('pg');

const client = new Client({
  connectionString: "postgresql://neondb_owner:npg_jzQACkco0T8S@ep-broad-truth-a1v49nhu-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
});

async function addDeploymentTypes() {
  try {
    console.log('🚀 Adding new deployment types to production database...');
    
    await client.connect();
    
    const deploymentTypes = [
      ['deployment_type_9', 'Triển khai hệ thống', 'Cài đặt server, database'],
      ['deployment_type_10', 'Triển khai mạng', 'Thiết lập LAN, WAN, VPN'],
      ['deployment_type_11', 'Triển khai bảo mật', 'Firewall, antivirus, SSL'],
      ['deployment_type_12', 'Triển khai backup', 'Sao lưu dữ liệu, hệ thống'],
      ['deployment_type_13', 'Triển khai monitoring', 'Giám sát hệ thống, mạng'],
      ['deployment_type_14', 'Triển khai user management', 'Quản lý người dùng, phân quyền'],
      ['deployment_type_15', 'Triển khai email server', 'Hệ thống email nội bộ'],
      ['deployment_type_16', 'Triển khai file server', 'Lưu trữ file, chia sẻ'],
      ['deployment_type_17', 'Triển khai print server', 'Hệ thống in ấn'],
      ['deployment_type_18', 'Triển khai remote access', 'Truy cập từ xa, remote desktop'],
      ['deployment_type_19', 'Triển khai network security', 'Bảo mật mạng, access control'],
      ['deployment_type_20', 'Triển khai system update', 'Cập nhật hệ thống, patch']
    ];

    let addedCount = 0;

    for (const [id, name, description] of deploymentTypes) {
      try {
        const result = await client.query(
          `INSERT INTO "DeploymentType" ("id", "name", "description", "createdAt", "updatedAt") 
           VALUES ($1, $2, $3, NOW(), NOW()) 
           ON CONFLICT ("id") DO NOTHING`,
          [id, name, description]
        );
        
        if (result.rowCount > 0) {
          console.log(`✅ Added: ${name}`);
          addedCount++;
        } else {
          console.log(`⚠️  Already exists: ${name}`);
        }
      } catch (error) {
        console.log(`❌ Error adding "${name}":`, error.message);
      }
    }

    console.log(`🎉 Successfully processed ${deploymentTypes.length} deployment types!`);
    console.log(`📋 Added ${addedCount} new deployment types focused on IT helpdesk, system, and network`);

  } catch (error) {
    console.error('❌ Error adding deployment types:', error);
  } finally {
    await client.end();
  }
}

addDeploymentTypes();
