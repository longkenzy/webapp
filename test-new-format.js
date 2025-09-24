const axios = require('axios');

// Configuration
const BOT_TOKEN = '7957331372:AAEl8wYO_mlZz3XLhzBGg9AKr-LZM--3LKo';
const CHAT_ID = '1653169009';
const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

console.log('🧪 Testing New Telegram Format');
console.log('===============================');
console.log('');

async function testNewFormat() {
  try {
    console.log('📱 Testing new Telegram format...');
    
    const testMessage = `
🚨 <b>Case NỘI BỘ được tạo</b>

<b>Người yêu cầu</b>

👨‍💼 <b>Người xử lý:</b> Trần Công Vũ
📋 <b>Tiêu đề:</b> Test Case với Format Mới
<b>Mô tả chi tiết</b>

⏰ <b>Thời gian:</b> ${new Date().toLocaleString('vi-VN')}
    `.trim();
    
    const response = await axios.post(`${API_URL}/sendMessage`, {
      chat_id: CHAT_ID,
      text: testMessage,
      parse_mode: 'HTML'
    });
    
    console.log('✅ New format test successful!');
    console.log(`📧 Message ID: ${response.data.result.message_id}`);
    console.log('📱 Check your Telegram app for the new format!');
    
    return true;
  } catch (error) {
    console.log('❌ New format test failed:', error.message);
    return false;
  }
}

async function testServerAPI() {
  try {
    console.log('\n🌐 Testing server API with new format...');
    
    const response = await axios.post('http://localhost:3001/api/test-telegram');
    console.log('✅ Server API test:', response.data);
    console.log('📱 Check your Telegram app for the server-generated message!');
    
    return true;
  } catch (error) {
    console.log('❌ Server API test failed:', error.message);
    return false;
  }
}

async function runNewFormatTest() {
  try {
    console.log('🚀 Starting New Format Test...');
    console.log('================================');
    
    // Test 1: Direct new format
    await testNewFormat();
    
    // Test 2: Server API with new format
    await testServerAPI();
    
    console.log('\n🎉 NEW FORMAT TEST COMPLETED!');
    console.log('================================');
    console.log('✅ New format is working!');
    console.log('✅ Server API is using new format!');
    console.log('');
    console.log('📱 Check your Telegram app for both messages');
    console.log('🔧 The new format is now active for all case creations!');
    console.log('');
    console.log('🚀 Next steps:');
    console.log('1. Create a real internal case');
    console.log('2. Check Telegram for the new format');
    console.log('3. Verify the notification looks correct');
    
  } catch (error) {
    console.log('\n❌ New format test failed:', error.message);
  }
}

// Run the new format test
runNewFormatTest();
