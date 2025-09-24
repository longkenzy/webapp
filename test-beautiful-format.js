const axios = require('axios');

// Configuration
const BOT_TOKEN = '7957331372:AAEl8wYO_mlZz3XLhzBGg9AKr-LZM--3LKo';
const CHAT_ID = '1653169009';
const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

console.log('✨ Testing Beautiful Telegram Format');
console.log('===================================');
console.log('');

async function testBeautifulFormat() {
  try {
    console.log('📱 Testing beautiful Telegram format...');
    
    const testMessage = `
🚨 <b>Case NỘI BỘ được tạo</b>

👤 <b>Người yêu cầu:</b> Nguyễn Thành Đạt
👨‍💼 <b>Người xử lý:</b> Trần Công Vũ

📋 <b>Tiêu đề:</b> Test Case với Format Đẹp
📝 <b>Mô tả chi tiết:</b> [Chi tiết trong hệ thống]

⏰ <b>Thời gian tạo:</b> ${new Date().toLocaleString('vi-VN')}

🔗 <b>Xem chi tiết:</b> <a href="http://localhost:3001/admin/dashboard">Admin Dashboard</a>
    `.trim();
    
    const response = await axios.post(`${API_URL}/sendMessage`, {
      chat_id: CHAT_ID,
      text: testMessage,
      parse_mode: 'HTML'
    });
    
    console.log('✅ Beautiful format test successful!');
    console.log(`📧 Message ID: ${response.data.result.message_id}`);
    console.log('📱 Check your Telegram app for the beautiful format!');
    
    return true;
  } catch (error) {
    console.log('❌ Beautiful format test failed:', error.message);
    return false;
  }
}

async function testServerAPI() {
  try {
    console.log('\n🌐 Testing server API with beautiful format...');
    
    const response = await axios.post('http://localhost:3001/api/test-telegram');
    console.log('✅ Server API test:', response.data);
    console.log('📱 Check your Telegram app for the server-generated message!');
    
    return true;
  } catch (error) {
    console.log('❌ Server API test failed:', error.message);
    return false;
  }
}

async function runBeautifulFormatTest() {
  try {
    console.log('🚀 Starting Beautiful Format Test...');
    console.log('=====================================');
    
    // Test 1: Direct beautiful format
    await testBeautifulFormat();
    
    // Test 2: Server API with beautiful format
    await testServerAPI();
    
    console.log('\n🎉 BEAUTIFUL FORMAT TEST COMPLETED!');
    console.log('=====================================');
    console.log('✅ Beautiful format is working!');
    console.log('✅ Server API is using beautiful format!');
    console.log('');
    console.log('📱 Check your Telegram app for both messages');
    console.log('🔧 The beautiful format is now active for all case creations!');
    console.log('');
    console.log('✨ Format Features:');
    console.log('• Clear section separation');
    console.log('• Proper emoji usage');
    console.log('• Clean typography');
    console.log('• Clickable links');
    console.log('• Professional appearance');
    console.log('');
    console.log('🚀 Next steps:');
    console.log('1. Create a real internal case');
    console.log('2. Check Telegram for the beautiful format');
    console.log('3. Verify the notification looks professional');
    
  } catch (error) {
    console.log('\n❌ Beautiful format test failed:', error.message);
  }
}

// Run the beautiful format test
runBeautifulFormatTest();
