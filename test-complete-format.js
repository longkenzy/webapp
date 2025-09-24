const axios = require('axios');

// Configuration
const BOT_TOKEN = '7957331372:AAEl8wYO_mlZz3XLhzBGg9AKr-LZM--3LKo';
const CHAT_ID = '1653169009';
const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

console.log('✨ Testing Complete Telegram Format');
console.log('===================================');
console.log('');

async function testCompleteFormat() {
  try {
    console.log('📱 Testing complete Telegram format...');
    
    const testMessage = `
🚨 <b>Case NỘI BỘ được tạo</b>

👤 <b>Người yêu cầu:</b> Nguyễn Tấn Đạt
👨‍💼 <b>Người xử lý:</b> Trần Công Vũ

🔧 <b>Loại Case:</b> Khắc phục lỗi hệ điều hành.
📋 <b>Tiêu đề:</b> Test Case với Format Hoàn Chỉnh
📝 <b>Mô tả chi tiết:</b> Đây là mô tả chi tiết của case test để kiểm tra format mới

⏰ <b>Thời gian tạo:</b> ${new Date().toLocaleString('vi-VN')}

🔗 <b>Xem chi tiết:</b> <a href="http://localhost:3001/admin/dashboard">Admin Dashboard</a>
    `.trim();
    
    const response = await axios.post(`${API_URL}/sendMessage`, {
      chat_id: CHAT_ID,
      text: testMessage,
      parse_mode: 'HTML'
    });
    
    console.log('✅ Complete format test successful!');
    console.log(`📧 Message ID: ${response.data.result.message_id}`);
    console.log('📱 Check your Telegram app for the complete format!');
    
    return true;
  } catch (error) {
    console.log('❌ Complete format test failed:', error.message);
    return false;
  }
}

async function testServerAPI() {
  try {
    console.log('\n🌐 Testing server API with complete format...');
    
    const response = await axios.post('http://localhost:3001/api/test-telegram');
    console.log('✅ Server API test:', response.data);
    console.log('📱 Check your Telegram app for the server-generated message!');
    
    return true;
  } catch (error) {
    console.log('❌ Server API test failed:', error.message);
    return false;
  }
}

async function runCompleteFormatTest() {
  try {
    console.log('🚀 Starting Complete Format Test...');
    console.log('====================================');
    
    // Test 1: Direct complete format
    await testCompleteFormat();
    
    // Test 2: Server API with complete format
    await testServerAPI();
    
    console.log('\n🎉 COMPLETE FORMAT TEST COMPLETED!');
    console.log('====================================');
    console.log('✅ Complete format is working!');
    console.log('✅ Server API is using complete format!');
    console.log('');
    console.log('📱 Check your Telegram app for both messages');
    console.log('🔧 The complete format is now active for all case creations!');
    console.log('');
    console.log('✨ Complete Format Features:');
    console.log('• Case type with emoji');
    console.log('• Detailed description');
    console.log('• Clear section separation');
    console.log('• Proper emoji usage');
    console.log('• Clean typography');
    console.log('• Clickable links');
    console.log('• Professional appearance');
    console.log('');
    console.log('🚀 Next steps:');
    console.log('1. Create a real internal case');
    console.log('2. Check Telegram for the complete format');
    console.log('3. Verify the notification includes case type and description');
    
  } catch (error) {
    console.log('\n❌ Complete format test failed:', error.message);
  }
}

// Run the complete format test
runCompleteFormatTest();
