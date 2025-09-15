/**
 * Script để sync dữ liệu EvaluationConfig và EvaluationOption từ dev sang production
 * Sử dụng: node sync-evaluation-configs-backup.js
 * 
 * Lưu ý: Script này sẽ:
 * - Tạo mới các config chưa có trong production
 * - Cập nhật các config đã có
 * - Xóa và tạo lại tất cả options để đảm bảo đồng bộ
 * - KHÔNG xóa hoặc reset database
 */

const { PrismaClient } = require('@prisma/client');

// Dev database connection
const devPrisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_jzQACkco0T8S@ep-rapid-dream-a1b4rn5j-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
    }
  }
});

// Production database connection
const prodPrisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_jzQACkco0T8S@ep-broad-truth-a1v49nhu-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
    }
  }
});

async function syncEvaluationConfigs() {
  try {
    console.log('🔄 Starting sync of EvaluationConfig and EvaluationOption from dev to production...');
    
    // 1. Get all evaluation configs from dev
    console.log('📥 Fetching evaluation configs from dev database...');
    const devConfigs = await devPrisma.evaluationConfig.findMany({
      include: {
        options: {
          orderBy: { order: 'asc' }
        }
      }
    });
    
    console.log(`Found ${devConfigs.length} evaluation configs in dev database`);
    
    // 2. Get existing configs from production
    console.log('📥 Fetching existing evaluation configs from production database...');
    const prodConfigs = await prodPrisma.evaluationConfig.findMany({
      include: {
        options: true
      }
    });
    
    console.log(`Found ${prodConfigs.length} existing evaluation configs in production database`);
    
    // 3. Sync each config
    for (const devConfig of devConfigs) {
      console.log(`\n🔄 Syncing config: ${devConfig.type} - ${devConfig.category}`);
      
      // Check if config exists in production
      const existingConfig = prodConfigs.find(prod => 
        prod.type === devConfig.type && prod.category === devConfig.category
      );
      
      let configId;
      
      if (existingConfig) {
        // Update existing config
        console.log(`  📝 Updating existing config (ID: ${existingConfig.id})`);
        await prodPrisma.evaluationConfig.update({
          where: { id: existingConfig.id },
          data: {
            isActive: devConfig.isActive,
            updatedAt: new Date()
          }
        });
        configId = existingConfig.id;
        
        // Delete existing options
        console.log(`  🗑️  Deleting existing options for config ${existingConfig.id}`);
        await prodPrisma.evaluationOption.deleteMany({
          where: { configId: existingConfig.id }
        });
      } else {
        // Create new config
        console.log(`  ➕ Creating new config`);
        const newConfig = await prodPrisma.evaluationConfig.create({
          data: {
            type: devConfig.type,
            category: devConfig.category,
            isActive: devConfig.isActive
          }
        });
        configId = newConfig.id;
      }
      
      // 4. Sync options for this config
      console.log(`  🔄 Syncing ${devConfig.options.length} options...`);
      for (const devOption of devConfig.options) {
        await prodPrisma.evaluationOption.create({
          data: {
            configId: configId,
            label: devOption.label,
            points: devOption.points,
            order: devOption.order,
            isActive: devOption.isActive
          }
        });
        console.log(`    ✅ Created option: ${devOption.label} (${devOption.points} points)`);
      }
    }
    
    // 5. Verify sync
    console.log('\n🔍 Verifying sync...');
    const finalProdConfigs = await prodPrisma.evaluationConfig.findMany({
      include: {
        options: {
          orderBy: { order: 'asc' }
        }
      }
    });
    
    console.log(`\n✅ Sync completed successfully!`);
    console.log(`📊 Final count in production:`);
    console.log(`   - EvaluationConfigs: ${finalProdConfigs.length}`);
    
    let totalOptions = 0;
    finalProdConfigs.forEach(config => {
      totalOptions += config.options.length;
      console.log(`   - ${config.type} (${config.category}): ${config.options.length} options`);
    });
    console.log(`   - Total EvaluationOptions: ${totalOptions}`);
    
  } catch (error) {
    console.error('❌ Error during sync:', error);
    throw error;
  } finally {
    await devPrisma.$disconnect();
    await prodPrisma.$disconnect();
  }
}

// Run the sync
syncEvaluationConfigs()
  .then(() => {
    console.log('\n🎉 Sync completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Sync failed:', error);
    process.exit(1);
  });
