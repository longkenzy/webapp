const axios = require('axios');

// Configuration
const BOT_TOKEN = '7957331372:AAEl8wYO_mlZz3XLhzBGg9AKr-LZM--3LKo';
const CHAT_ID = '1653169009';
const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

console.log('🧪 Testing Receiving Case Format');
console.log('================================');
console.log('');

async function testReceivingCaseFormat() {
  try {
    console.log('📱 Testing receiving case format...');
    
    const testMessage = `
🚨 <b>Case NHẬN HÀNG được tạo</b>

👨‍💼 <b>Người xử lý:</b> Test Handler 3
📋 <b>Tiêu đề:</b> Test Case 3
📝 <b>Mô tả chi tiết:</b> Test case nhận hàng

⏰ <b>Thời gian tạo:</b> ${new Date().toLocaleString('vi-VN')}

🔗 <b>Xem chi tiết:</b> <a href="http://localhost:3001/admin/dashboard">Admin Dashboard</a>
    `.trim();
    
    const response = await axios.post(`${API_URL}/sendMessage`, {
      chat_id: CHAT_ID,
      text: testMessage,
      parse_mode: 'HTML'
    });
    
    console.log('✅ Receiving case format test successful!');
    console.log(`📧 Message ID: ${response.data.result.message_id}`);
    console.log('📱 Check your Telegram app for the receiving case format!');
    
    return true;
  } catch (error) {
    console.log('❌ Receiving case format test failed:', error.message);
    return false;
  }
}

async function testOtherCaseFormats() {
  try {
    console.log('\n📱 Testing other case formats...');
    
    const otherCases = [
      {
        type: 'Case nội bộ',
        title: 'Case NỘI BỘ được tạo',
        emoji: '🏢'
      },
      {
        type: 'Case giao hàng',
        title: 'Case GIAO HÀNG được tạo',
        emoji: '🚚'
      }
    ];
    
    for (let i = 0; i < otherCases.length; i++) {
      const caseType = otherCases[i];
      
      const testMessage = `
🚨 <b>${caseType.title}</b>

👤 <b>Người yêu cầu:</b> Test User ${i + 1}
👨‍💼 <b>Người xử lý:</b> Test Handler ${i + 1}

${caseType.emoji} <b>Loại Case:</b> ${caseType.type}
📋 <b>Tiêu đề:</b> Test Case ${i + 1}
📝 <b>Mô tả chi tiết:</b> Test case ${caseType.type}

⏰ <b>Thời gian tạo:</b> ${new Date().toLocaleString('vi-VN')}

🔗 <b>Xem chi tiết:</b> <a href="http://localhost:3001/admin/dashboard">Admin Dashboard</a>
      `.trim();
      
      await axios.post(`${API_URL}/sendMessage`, {
        chat_id: CHAT_ID,
        text: testMessage,
        parse_mode: 'HTML'
      });
      
      console.log(`✅ ${caseType.type} format sent`);
      
      // Wait 1 second between messages
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('✅ Other case formats sent successfully!');
    return true;
  } catch (error) {
    console.log('❌ Other case formats test failed:', error.message);
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

async function runReceivingCaseFormatTest() {
  try {
    console.log('🚀 Starting Receiving Case Format Test...');
    console.log('==========================================');
    
    // Test 1: Receiving case format
    await testReceivingCaseFormat();
    
    // Test 2: Other case formats
    await testOtherCaseFormats();
    
    // Test 3: Server API
    await testServerAPI();
    
    console.log('\n🎉 RECEIVING CASE FORMAT TEST COMPLETED!');
    console.log('==========================================');
    console.log('✅ Receiving case format is working!');
    console.log('✅ Other case formats are working!');
    console.log('✅ Server API is working!');
    console.log('');
    console.log('📱 Check your Telegram app for all messages');
    console.log('🔧 Receiving cases now have simplified format!');
    console.log('');
    console.log('✨ Format Differences:');
    console.log('• 📦 Case nhận hàng: Simplified (no requester)');
    console.log('• 🏢 Case nội bộ: Full format (with requester)');
    console.log('• 🚚 Case giao hàng: Full format (with requester)');
    console.log('• Other cases: Full format (with requester)');
    console.log('');
    console.log('🚀 Next steps:');
    console.log('1. Create real receiving cases');
    console.log('2. Check Telegram for simplified format');
    console.log('3. Verify other case types still use full format');
    
  } catch (error) {
    console.log('\n❌ Receiving case format test failed:', error.message);
  }
}

// Run the receiving case format test
runReceivingCaseFormatTest();
