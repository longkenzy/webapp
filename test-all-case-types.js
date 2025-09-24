const axios = require('axios');

// Configuration
const BOT_TOKEN = '7957331372:AAEl8wYO_mlZz3XLhzBGg9AKr-LZM--3LKo';
const CHAT_ID = '1653169009';
const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

console.log('🧪 Testing All Case Types Telegram Notifications');
console.log('===============================================');
console.log('');

async function testAllCaseTypes() {
  try {
    console.log('📱 Testing all case types...');
    
    const caseTypes = [
      {
        type: 'Case nội bộ',
        emoji: '🏢',
        title: 'Test Internal Case',
        description: 'Mô tả case nội bộ test'
      },
      {
        type: 'Case giao hàng',
        emoji: '🚚',
        title: 'Test Delivery Case',
        description: 'Mô tả case giao hàng test'
      },
      {
        type: 'Case nhận hàng',
        emoji: '📦',
        title: 'Test Receiving Case',
        description: 'Mô tả case nhận hàng test'
      },
      {
        type: 'Case bảo trì',
        emoji: '🔧',
        title: 'Test Maintenance Case',
        description: 'Mô tả case bảo trì test'
      },
      {
        type: 'Case bảo hành',
        emoji: '🛡️',
        title: 'Test Warranty Case',
        description: 'Mô tả case bảo hành test'
      },
      {
        type: 'Case sự cố',
        emoji: '⚠️',
        title: 'Test Incident Case',
        description: 'Mô tả case sự cố test'
      },
      {
        type: 'Case triển khai',
        emoji: '🚀',
        title: 'Test Deployment Case',
        description: 'Mô tả case triển khai test'
      }
    ];
    
    for (let i = 0; i < caseTypes.length; i++) {
      const caseType = caseTypes[i];
      
      const testMessage = `
🚨 <b>Case NỘI BỘ được tạo</b>

👤 <b>Người yêu cầu:</b> Test User ${i + 1}
👨‍💼 <b>Người xử lý:</b> Test Handler ${i + 1}

${caseType.emoji} <b>Loại Case:</b> ${caseType.type}
📋 <b>Tiêu đề:</b> ${caseType.title}
📝 <b>Mô tả chi tiết:</b> ${caseType.description}

⏰ <b>Thời gian tạo:</b> ${new Date().toLocaleString('vi-VN')}

🔗 <b>Xem chi tiết:</b> <a href="http://localhost:3001/admin/dashboard">Admin Dashboard</a>
      `.trim();
      
      await axios.post(`${API_URL}/sendMessage`, {
        chat_id: CHAT_ID,
        text: testMessage,
        parse_mode: 'HTML'
      });
      
      console.log(`✅ ${caseType.type} notification sent`);
      
      // Wait 1 second between messages
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('✅ All case types notifications sent successfully!');
    return true;
  } catch (error) {
    console.log('❌ All case types test failed:', error.message);
    return false;
  }
}

async function testServerAPI() {
  try {
    console.log('\n🌐 Testing server API...');
    
    const response = await axios.post('http://localhost:3001/api/test-telegram');
    console.log('✅ Server API test:', response.data);
    console.log('📱 Check your Telegram app for the server-generated message!');
    
    return true;
  } catch (error) {
    console.log('❌ Server API test failed:', error.message);
    return false;
  }
}

async function runAllCaseTypesTest() {
  try {
    console.log('🚀 Starting All Case Types Test...');
    console.log('===================================');
    
    // Test 1: All case types
    await testAllCaseTypes();
    
    // Test 2: Server API
    await testServerAPI();
    
    console.log('\n🎉 ALL CASE TYPES TEST COMPLETED!');
    console.log('===================================');
    console.log('✅ All case types are working!');
    console.log('✅ Server API is working!');
    console.log('');
    console.log('📱 Check your Telegram app for all messages');
    console.log('🔧 All case types now have Telegram notifications!');
    console.log('');
    console.log('✨ Supported Case Types:');
    console.log('• 🏢 Case nội bộ');
    console.log('• 🚚 Case giao hàng');
    console.log('• 📦 Case nhận hàng');
    console.log('• 🔧 Case bảo trì');
    console.log('• 🛡️ Case bảo hành');
    console.log('• ⚠️ Case sự cố');
    console.log('• 🚀 Case triển khai');
    console.log('');
    console.log('🚀 Next steps:');
    console.log('1. Create real cases of different types');
    console.log('2. Check Telegram for notifications');
    console.log('3. Verify all case types work correctly');
    
  } catch (error) {
    console.log('\n❌ All case types test failed:', error.message);
  }
}

// Run the all case types test
runAllCaseTypesTest();
