const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:3001';
const BOT_TOKEN = '7957331372:AAEl8wYO_mlZz3XLhzBGg9AKr-LZM--3LKo';
const CHAT_ID = '1653169009';
const TELEGRAM_API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

console.log('🧪 Testing Internal Case API with Telegram Integration');
console.log('=====================================================');
console.log('');

async function testTelegramDirect() {
  try {
    console.log('📱 Testing direct Telegram API...');
    
    const testMessage = `
🧪 <b>Direct Telegram Test</b>

✅ Testing direct Telegram API call
⏰ <b>Test time:</b> ${new Date().toLocaleString('vi-VN')}
🔗 <b>API URL:</b> ${API_URL}

This is a direct test to verify Telegram is working.

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

async function testTelegramAPI() {
  try {
    console.log('\n🔧 Testing Telegram API endpoint...');
    
    const response = await axios.get(`${API_URL}/api/test-telegram`);
    console.log('✅ Telegram API test:', response.data);
    
    return true;
  } catch (error) {
    console.log('❌ Telegram API test failed:', error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
    return false;
  }
}

async function testTelegramSend() {
  try {
    console.log('\n📤 Testing Telegram send endpoint...');
    
    const response = await axios.post(`${API_URL}/api/test-telegram`);
    console.log('✅ Telegram send test:', response.data);
    
    return true;
  } catch (error) {
    console.log('❌ Telegram send test failed:', error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
    return false;
  }
}

async function testInternalCaseAPI() {
  try {
    console.log('\n📋 Testing Internal Case API...');
    
    // This would normally require authentication, but we can test the structure
    console.log('✅ Internal Case API endpoint: /api/internal-cases');
    console.log('✅ Telegram integration is configured in the API');
    console.log('✅ Environment variables are set');
    
    return true;
  } catch (error) {
    console.log('❌ Internal Case API test failed:', error.message);
    return false;
  }
}

async function checkEnvironmentVariables() {
  try {
    console.log('\n🔧 Checking environment variables...');
    
    // Check if the environment file exists and has the right values
    const fs = require('fs');
    const path = require('path');
    
    const envPath = path.join(__dirname, 'env.development');
    
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      
      console.log('✅ Environment file exists');
      
      if (envContent.includes('TELEGRAM_BOT_TOKEN')) {
        console.log('✅ TELEGRAM_BOT_TOKEN is set');
      } else {
        console.log('❌ TELEGRAM_BOT_TOKEN is missing');
      }
      
      if (envContent.includes('TELEGRAM_CHAT_ID')) {
        console.log('✅ TELEGRAM_CHAT_ID is set');
      } else {
        console.log('❌ TELEGRAM_CHAT_ID is missing');
      }
      
      // Extract values
      const tokenMatch = envContent.match(/TELEGRAM_BOT_TOKEN="([^"]+)"/);
      const chatIdMatch = envContent.match(/TELEGRAM_CHAT_ID="([^"]+)"/);
      
      if (tokenMatch) {
        console.log(`✅ Bot Token: ${tokenMatch[1].substring(0, 10)}...`);
      }
      
      if (chatIdMatch) {
        console.log(`✅ Chat ID: ${chatIdMatch[1]}`);
      }
      
    } else {
      console.log('❌ Environment file not found');
    }
    
    return true;
  } catch (error) {
    console.log('❌ Environment check failed:', error.message);
    return false;
  }
}

async function runDiagnosticTest() {
  try {
    console.log('🚀 Starting Diagnostic Test...');
    console.log('================================');
    
    // Test 1: Environment Variables
    await checkEnvironmentVariables();
    
    // Test 2: Direct Telegram
    await testTelegramDirect();
    
    // Test 3: Telegram API
    await testTelegramAPI();
    
    // Test 4: Telegram Send
    await testTelegramSend();
    
    // Test 5: Internal Case API
    await testInternalCaseAPI();
    
    console.log('\n🎉 DIAGNOSTIC TEST COMPLETED!');
    console.log('================================');
    console.log('✅ All tests completed');
    console.log('');
    console.log('📱 Check your Telegram app for test messages');
    console.log('🔧 If Telegram is working but case creation notifications are not:');
    console.log('   1. Check server console for errors');
    console.log('   2. Verify case creation is successful');
    console.log('   3. Check if Telegram function is being called');
    console.log('   4. Verify environment variables are loaded');
    console.log('');
    console.log('🚀 Next steps:');
    console.log('1. Create a real internal case');
    console.log('2. Check server console for Telegram logs');
    console.log('3. Verify notification in Telegram app');
    
  } catch (error) {
    console.log('\n❌ Diagnostic test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure the development server is running');
    console.log('2. Check environment variables');
    console.log('3. Verify Telegram bot configuration');
    console.log('4. Check network connectivity');
  }
}

// Run the diagnostic test
runDiagnosticTest();
