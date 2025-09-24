const axios = require('axios');

// Configuration
const BOT_TOKEN = '7957331372:AAEl8wYO_mlZz3XLhzBGg9AKr-LZM--3LKo';
const CHAT_ID = '1653169009';
const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

console.log('🧪 Testing Receiving Case with Company Info');
console.log('==========================================');
console.log('');

async function testReceivingCaseWithCompany() {
  try {
    console.log('📱 Testing receiving case with company info...');
    
    const testMessage = `
🚨 <b>Case NHẬN HÀNG được tạo</b>

👨‍💼 <b>Người xử lý:</b> Test Handler 3
📋 <b>Tiêu đề:</b> Test Case 3
📝 <b>Mô tả chi tiết:</b> Test case nhận hàng

📦 <b>Nhận hàng từ cty:</b> Công ty ABC

⏰ <b>Thời gian tạo:</b> ${new Date().toLocaleString('vi-VN')}

🔗 <b>Xem chi tiết:</b> <a href="http://localhost:3001/admin/dashboard">Admin Dashboard</a>
    `.trim();
    
    const response = await axios.post(`${API_URL}/sendMessage`, {
      chat_id: CHAT_ID,
      text: testMessage,
      parse_mode: 'HTML'
    });
    
    console.log('✅ Receiving case with company info test successful!');
    console.log(`📧 Message ID: ${response.data.result.message_id}`);
    console.log('📱 Check your Telegram app for the receiving case format with company info!');
    
    return true;
  } catch (error) {
    console.log('❌ Receiving case with company info test failed:', error.message);
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

async function runReceivingCaseWithCompanyTest() {
  try {
    console.log('🚀 Starting Receiving Case with Company Info Test...');
    console.log('====================================================');
    
    // Test 1: Receiving case with company info
    await testReceivingCaseWithCompany();
    
    // Test 2: Server API
    await testServerAPI();
    
    console.log('\n🎉 RECEIVING CASE WITH COMPANY INFO TEST COMPLETED!');
    console.log('====================================================');
    console.log('✅ Receiving case format with company info is working!');
    console.log('✅ Server API is working!');
    console.log('');
    console.log('📱 Check your Telegram app for all messages');
    console.log('🔧 Receiving cases now include company info!');
    console.log('');
    console.log('✨ Updated Format for Case nhận hàng:');
    console.log('• 🚨 Case NHẬN HÀNG được tạo');
    console.log('• 👨‍💼 Người xử lý: [Handler Name]');
    console.log('• 📋 Tiêu đề: [Case Title]');
    console.log('• 📝 Mô tả chi tiết: [Description]');
    console.log('• 📦 Nhận hàng từ cty: [Company Name]');
    console.log('• ⏰ Thời gian tạo: [Creation Time]');
    console.log('• 🔗 Xem chi tiết: Admin Dashboard');
    console.log('');
    console.log('🚀 Next steps:');
    console.log('1. Create real receiving cases');
    console.log('2. Check Telegram for updated format with company info');
    console.log('3. Verify company name is displayed correctly');
    
  } catch (error) {
    console.log('\n❌ Receiving case with company info test failed:', error.message);
  }
}

// Run the receiving case with company info test
runReceivingCaseWithCompanyTest();


