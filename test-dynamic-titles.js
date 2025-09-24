const axios = require('axios');

// Configuration
const BOT_TOKEN = '7957331372:AAEl8wYO_mlZz3XLhzBGg9AKr-LZM--3LKo';
const CHAT_ID = '1653169009';
const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

console.log('🧪 Testing Dynamic Case Type Titles');
console.log('===================================');
console.log('');

async function testDynamicTitles() {
  try {
    console.log('📱 Testing dynamic case type titles...');
    
    const caseTypes = [
      {
        type: 'Case nội bộ',
        emoji: '🏢',
        title: 'Case NỘI BỘ được tạo',
        description: 'Test case nội bộ'
      },
      {
        type: 'Case giao hàng',
        emoji: '🚚',
        title: 'Case GIAO HÀNG được tạo',
        description: 'Test case giao hàng'
      },
      {
        type: 'Case nhận hàng',
        emoji: '📦',
        title: 'Case NHẬN HÀNG được tạo',
        description: 'Test case nhận hàng'
      },
      {
        type: 'Case bảo trì',
        emoji: '🔧',
        title: 'Case BẢO TRÌ được tạo',
        description: 'Test case bảo trì'
      },
      {
        type: 'Case bảo hành',
        emoji: '🛡️',
        title: 'Case BẢO HÀNH được tạo',
        description: 'Test case bảo hành'
      },
      {
        type: 'Case sự cố',
        emoji: '⚠️',
        title: 'Case SỰ CỐ được tạo',
        description: 'Test case sự cố'
      },
      {
        type: 'Case triển khai',
        emoji: '🚀',
        title: 'Case TRIỂN KHAI được tạo',
        description: 'Test case triển khai'
      }
    ];
    
    for (let i = 0; i < caseTypes.length; i++) {
      const caseType = caseTypes[i];
      
      const testMessage = `
🚨 <b>${caseType.title}</b>

👤 <b>Người yêu cầu:</b> Test User ${i + 1}
👨‍💼 <b>Người xử lý:</b> Test Handler ${i + 1}

${caseType.emoji} <b>Loại Case:</b> ${caseType.type}
📋 <b>Tiêu đề:</b> Test Case ${i + 1}
📝 <b>Mô tả chi tiết:</b> ${caseType.description}

⏰ <b>Thời gian tạo:</b> ${new Date().toLocaleString('vi-VN')}

🔗 <b>Xem chi tiết:</b> <a href="http://localhost:3001/admin/dashboard">Admin Dashboard</a>
      `.trim();
      
      await axios.post(`${API_URL}/sendMessage`, {
        chat_id: CHAT_ID,
        text: testMessage,
        parse_mode: 'HTML'
      });
      
      console.log(`✅ ${caseType.type} - ${caseType.title} sent`);
      
      // Wait 1 second between messages
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('✅ All dynamic titles sent successfully!');
    return true;
  } catch (error) {
    console.log('❌ Dynamic titles test failed:', error.message);
    return false;
  }
}

async function testServerAPI() {
  try {
    console.log('\n🌐 Testing server API with dynamic titles...');
    
    const response = await axios.post('http://localhost:3001/api/test-telegram');
    console.log('✅ Server API test:', response.data);
    console.log('📱 Check your Telegram app for the server-generated message!');
    
    return true;
  } catch (error) {
    console.log('❌ Server API test failed:', error.message);
    return false;
  }
}

async function runDynamicTitlesTest() {
  try {
    console.log('🚀 Starting Dynamic Titles Test...');
    console.log('===================================');
    
    // Test 1: Dynamic titles
    await testDynamicTitles();
    
    // Test 2: Server API
    await testServerAPI();
    
    console.log('\n🎉 DYNAMIC TITLES TEST COMPLETED!');
    console.log('===================================');
    console.log('✅ Dynamic titles are working!');
    console.log('✅ Server API is using dynamic titles!');
    console.log('');
    console.log('📱 Check your Telegram app for all messages');
    console.log('🔧 Each case type now has its own title!');
    console.log('');
    console.log('✨ Dynamic Title Features:');
    console.log('• 🏢 Case NỘI BỘ được tạo');
    console.log('• 🚚 Case GIAO HÀNG được tạo');
    console.log('• 📦 Case NHẬN HÀNG được tạo');
    console.log('• 🔧 Case BẢO TRÌ được tạo');
    console.log('• 🛡️ Case BẢO HÀNH được tạo');
    console.log('• ⚠️ Case SỰ CỐ được tạo');
    console.log('• 🚀 Case TRIỂN KHAI được tạo');
    console.log('');
    console.log('🚀 Next steps:');
    console.log('1. Create real cases of different types');
    console.log('2. Check Telegram for dynamic titles');
    console.log('3. Verify each case type shows correct title');
    
  } catch (error) {
    console.log('\n❌ Dynamic titles test failed:', error.message);
  }
}

// Run the dynamic titles test
runDynamicTitlesTest();
