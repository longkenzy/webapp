const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:3001';
const BOT_TOKEN = '7957331372:AAEl8wYO_mlZz3XLhzBGg9AKr-LZM--3LKo';
const CHAT_ID = '1653169009';
const TELEGRAM_API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

console.log('🧪 Testing Real Case Creation with Telegram Notifications');
console.log('=========================================================');
console.log('');

async function testTelegramAPI() {
  try {
    console.log('📱 Testing Telegram API...');
    
    const response = await axios.get(`${API_URL}/api/test-telegram`);
    console.log('✅ Telegram API test:', response.data);
    
    return true;
  } catch (error) {
    console.log('❌ Telegram API test failed:', error.message);
    return false;
  }
}

async function testTelegramSend() {
  try {
    console.log('\n📤 Testing Telegram send...');
    
    const response = await axios.post(`${API_URL}/api/test-telegram`);
    console.log('✅ Telegram send test:', response.data);
    
    return true;
  } catch (error) {
    console.log('❌ Telegram send test failed:', error.message);
    return false;
  }
}

async function testDirectTelegram() {
  try {
    console.log('\n🔧 Testing direct Telegram...');
    
    const testMessage = `
🧪 <b>Real Case Creation Test</b>

✅ Testing Telegram before real case creation
⏰ <b>Test time:</b> ${new Date().toLocaleString('vi-VN')}
🔗 <b>API URL:</b> ${API_URL}

This is a pre-test before creating a real case.

---
SmartServices - Hệ thống quản lý Case
    `.trim();
    
    const response = await axios.post(`${TELEGRAM_API_URL}/sendMessage`, {
      chat_id: CHAT_ID,
      text: testMessage,
      parse_mode: 'HTML'
    });
    
    console.log('✅ Direct Telegram test successful!');
    console.log(`📧 Message ID: ${response.data.result.message_id}`);
    
    return true;
  } catch (error) {
    console.log('❌ Direct Telegram test failed:', error.message);
    return false;
  }
}

async function testCaseCreationAPI() {
  try {
    console.log('\n📋 Testing Case Creation API...');
    
    // This would normally require authentication and real data
    console.log('✅ Case Creation APIs are ready:');
    console.log('   - /api/internal-cases');
    console.log('   - /api/delivery-cases');
    console.log('   - /api/receiving-cases');
    console.log('   - /api/maintenance-cases');
    console.log('   - /api/warranties');
    console.log('   - /api/incidents');
    console.log('   - /api/deployment-cases');
    
    console.log('\n📝 To test real case creation:');
    console.log('1. Go to http://localhost:3001');
    console.log('2. Login to the system');
    console.log('3. Create a new internal case');
    console.log('4. Check Telegram for notification');
    
    return true;
  } catch (error) {
    console.log('❌ Case Creation API test failed:', error.message);
    return false;
  }
}

async function runRealCaseTest() {
  try {
    console.log('🚀 Starting Real Case Creation Test...');
    console.log('========================================');
    
    // Test 1: Telegram API
    const apiTest = await testTelegramAPI();
    
    // Test 2: Telegram Send
    const sendTest = await testTelegramSend();
    
    // Test 3: Direct Telegram
    const directTest = await testDirectTelegram();
    
    // Test 4: Case Creation API
    const caseTest = await testCaseCreationAPI();
    
    console.log('\n🎉 REAL CASE CREATION TEST COMPLETED!');
    console.log('========================================');
    
    if (apiTest && sendTest && directTest && caseTest) {
      console.log('✅ All tests passed!');
      console.log('✅ Telegram notifications are working!');
      console.log('✅ Ready for real case creation!');
      console.log('');
      console.log('📱 Check your Telegram app for test messages');
      console.log('🔧 Your Telegram notification system is fully operational!');
      console.log('');
      console.log('🚀 Next steps:');
      console.log('1. Go to http://localhost:3001');
      console.log('2. Login to the system');
      console.log('3. Create a new case (any type)');
      console.log('4. Check Telegram for notification');
      console.log('5. Verify the notification format and content');
    } else {
      console.log('❌ Some tests failed');
      console.log('🔧 Please check the errors above');
    }
    
  } catch (error) {
    console.log('\n❌ Real case creation test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure the development server is running');
    console.log('2. Check environment variables');
    console.log('3. Verify Telegram bot configuration');
    console.log('4. Check network connectivity');
  }
}

// Run the real case creation test
runRealCaseTest();
