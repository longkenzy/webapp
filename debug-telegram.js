const axios = require('axios');

// Test direct Telegram API
async function testDirectTelegram() {
  try {
    console.log('🔧 Testing direct Telegram API...');
    
    const BOT_TOKEN = '7957331372:AAEl8wYO_mlZz3XLhzBGg9AKr-LZM--3LKo';
    const CHAT_ID = '1653169009';
    const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;
    
    console.log('Bot Token:', BOT_TOKEN.substring(0, 10) + '...');
    console.log('Chat ID:', CHAT_ID);
    console.log('API URL:', API_URL);
    
    // Test getMe first
    console.log('\n🤖 Testing getMe...');
    const meResponse = await axios.get(`${API_URL}/getMe`);
    console.log('✅ Bot info:', meResponse.data.result);
    
    // Test sendMessage
    console.log('\n📤 Testing sendMessage...');
    const messageResponse = await axios.post(`${API_URL}/sendMessage`, {
      chat_id: CHAT_ID,
      text: '🧪 Direct API Test - ' + new Date().toLocaleString('vi-VN'),
      parse_mode: 'HTML'
    });
    console.log('✅ Message sent:', messageResponse.data.result);
    
    return true;
  } catch (error) {
    console.error('❌ Direct Telegram test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

// Test environment variables
function testEnvironmentVariables() {
  console.log('\n🔧 Testing environment variables...');
  
  // Check if we can read the env file
  const fs = require('fs');
  const path = require('path');
  
  const envPath = path.join(__dirname, 'env.development');
  
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    console.log('✅ Environment file exists');
    
    // Extract values
    const tokenMatch = envContent.match(/TELEGRAM_BOT_TOKEN="([^"]+)"/);
    const chatIdMatch = envContent.match(/TELEGRAM_CHAT_ID="([^"]+)"/);
    
    if (tokenMatch) {
      console.log('✅ Bot Token found:', tokenMatch[1].substring(0, 10) + '...');
    } else {
      console.log('❌ Bot Token not found');
    }
    
    if (chatIdMatch) {
      console.log('✅ Chat ID found:', chatIdMatch[1]);
    } else {
      console.log('❌ Chat ID not found');
    }
    
    return true;
  } else {
    console.log('❌ Environment file not found');
    return false;
  }
}

// Test server API
async function testServerAPI() {
  try {
    console.log('\n🌐 Testing server API...');
    
    const response = await axios.get('http://localhost:3001/api/test-telegram');
    console.log('✅ Server API response:', response.data);
    
    return true;
  } catch (error) {
    console.error('❌ Server API test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

async function runDebugTest() {
  console.log('🐛 Telegram Debug Test');
  console.log('=====================');
  
  // Test 1: Environment Variables
  testEnvironmentVariables();
  
  // Test 2: Direct Telegram API
  await testDirectTelegram();
  
  // Test 3: Server API
  await testServerAPI();
  
  console.log('\n🎯 Debug Summary:');
  console.log('==================');
  console.log('1. Check if environment variables are loaded correctly');
  console.log('2. Check if direct Telegram API works');
  console.log('3. Check if server API has issues');
  console.log('4. Check server console for detailed error logs');
}

runDebugTest();
