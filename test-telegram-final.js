const axios = require('axios');

// Telegram Bot Configuration
const BOT_TOKEN = '7957331372:AAEl8wYO_mlZz3XLhzBGg9AKr-LZM--3LKo';
const CHAT_ID = '1653169009';
const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

console.log('📱 Testing Telegram Bot with Chat ID');
console.log('====================================');
console.log('');

console.log('🔧 Configuration:');
console.log(`   Bot Token: ${BOT_TOKEN.substring(0, 10)}...`);
console.log(`   Chat ID: ${CHAT_ID}`);
console.log(`   API URL: ${API_URL}`);
console.log('');

async function testBotInfo() {
  try {
    console.log('🤖 Getting bot info...');
    const response = await axios.get(`${API_URL}/getMe`);
    const bot = response.data.result;
    
    console.log('✅ Bot info:');
    console.log(`   Bot ID: ${bot.id}`);
    console.log(`   Bot Name: ${bot.first_name}`);
    console.log(`   Bot Username: @${bot.username}`);
    console.log(`   Can Join Groups: ${bot.can_join_groups}`);
    
    return bot;
  } catch (error) {
    console.log('❌ Error getting bot info:', error.message);
    throw error;
  }
}

async function testChatInfo() {
  try {
    console.log('\n💬 Testing chat info...');
    const response = await axios.get(`${API_URL}/getChat`, {
      params: { chat_id: CHAT_ID }
    });
    
    const chat = response.data.result;
    console.log('✅ Chat info:');
    console.log(`   Chat ID: ${chat.id}`);
    console.log(`   Chat Type: ${chat.type}`);
    console.log(`   Chat Title: ${chat.title || chat.first_name || 'N/A'}`);
    console.log(`   Chat Username: @${chat.username || 'N/A'}`);
    
    return chat;
  } catch (error) {
    console.log('❌ Error getting chat info:', error.message);
    throw error;
  }
}

async function sendTestMessage() {
  try {
    console.log('\n📤 Sending test message...');
    
    const testMessage = `
🧪 <b>Test Telegram Bot</b>

✅ Telegram configuration is working!
⏰ <b>Test time:</b> ${new Date().toLocaleString('vi-VN')}
🤖 <b>Bot:</b> @itwebss_bot
💬 <b>Chat ID:</b> ${CHAT_ID}

Nếu bạn nhận được tin nhắn này, Telegram notification đã hoạt động!

---
SmartServices - Hệ thống quản lý Case
Test message được gửi tự động
    `.trim();
    
    const response = await axios.post(`${API_URL}/sendMessage`, {
      chat_id: CHAT_ID,
      text: testMessage,
      parse_mode: 'HTML'
    });
    
    console.log('✅ Test message sent successfully!');
    console.log(`📧 Message ID: ${response.data.result.message_id}`);
    console.log(`📧 Chat ID: ${response.data.result.chat.id}`);
    console.log(`📧 Date: ${new Date(response.data.result.date * 1000).toLocaleString('vi-VN')}`);
    
    return response.data.result;
  } catch (error) {
    console.log('❌ Error sending test message:', error.message);
    throw error;
  }
}

async function sendCaseNotification() {
  try {
    console.log('\n📋 Sending case notification...');
    
    const caseMessage = `
🚨 <b>Case Mới Được Tạo</b>

🏢 <b>Loại Case:</b> Case nội bộ
📋 <b>Tiêu đề:</b> Test Case Notification
👤 <b>Người tạo:</b> Test User
📧 <b>Email:</b> test@smartservices.com.vn
👨‍💼 <b>Người xử lý:</b> Admin User
⏰ <b>Thời gian:</b> ${new Date().toLocaleString('vi-VN')}

🔗 <b>Xem chi tiết:</b> <a href="http://localhost:3000/admin/dashboard">Admin Dashboard</a>

---
SmartServices - Hệ thống quản lý Case
    `.trim();
    
    const response = await axios.post(`${API_URL}/sendMessage`, {
      chat_id: CHAT_ID,
      text: caseMessage,
      parse_mode: 'HTML'
    });
    
    console.log('✅ Case notification sent successfully!');
    console.log(`📧 Message ID: ${response.data.result.message_id}`);
    
    return response.data.result;
  } catch (error) {
    console.log('❌ Error sending case notification:', error.message);
    throw error;
  }
}

async function sendMultipleCaseTypes() {
  try {
    console.log('\n📊 Sending multiple case type notifications...');
    
    const caseTypes = [
      { type: 'Case nội bộ', emoji: '🏢' },
      { type: 'Case giao hàng', emoji: '🚚' },
      { type: 'Case nhận hàng', emoji: '📦' },
      { type: 'Case bảo trì', emoji: '🔧' },
      { type: 'Case bảo hành', emoji: '🛡️' },
      { type: 'Case sự cố', emoji: '⚠️' },
      { type: 'Case triển khai', emoji: '🚀' }
    ];
    
    for (let i = 0; i < caseTypes.length; i++) {
      const caseType = caseTypes[i];
      
      const message = `
🚨 <b>Case Mới Được Tạo</b>

${caseType.emoji} <b>Loại Case:</b> ${caseType.type}
📋 <b>Tiêu đề:</b> Test ${caseType.type} - ${i + 1}
👤 <b>Người tạo:</b> Test User ${i + 1}
📧 <b>Email:</b> test${i + 1}@smartservices.com.vn
👨‍💼 <b>Người xử lý:</b> Admin User
⏰ <b>Thời gian:</b> ${new Date().toLocaleString('vi-VN')}

🔗 <b>Xem chi tiết:</b> <a href="http://localhost:3000/admin/dashboard">Admin Dashboard</a>

---
SmartServices - Hệ thống quản lý Case
      `.trim();
      
      await axios.post(`${API_URL}/sendMessage`, {
        chat_id: CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      });
      
      console.log(`✅ ${caseType.type} notification sent`);
      
      // Wait 1 second between messages
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('✅ All case type notifications sent successfully!');
  } catch (error) {
    console.log('❌ Error sending multiple case notifications:', error.message);
    throw error;
  }
}

async function runCompleteTest() {
  try {
    console.log('🚀 Starting Complete Telegram Test...');
    console.log('=====================================');
    
    // Test 1: Bot Info
    await testBotInfo();
    
    // Test 2: Chat Info
    await testChatInfo();
    
    // Test 3: Send Test Message
    await sendTestMessage();
    
    // Test 4: Send Case Notification
    await sendCaseNotification();
    
    // Test 5: Send Multiple Case Types
    await sendMultipleCaseTypes();
    
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('=====================================');
    console.log('✅ Telegram Bot is working perfectly!');
    console.log('✅ Chat ID is valid and accessible');
    console.log('✅ Messages are being sent successfully');
    console.log('✅ All case type notifications are working');
    console.log('');
    console.log('📱 Please check your Telegram app for all messages');
    console.log('🔧 Your Telegram notification system is ready!');
    console.log('');
    console.log('🚀 Next steps:');
    console.log('1. Test with real case creation in the system');
    console.log('2. Verify notifications in Telegram app');
    console.log('3. Configure production environment if needed');
    
  } catch (error) {
    console.log('\n❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check if bot token is correct');
    console.log('2. Check if chat ID is correct');
    console.log('3. Check if bot is not blocked');
    console.log('4. Check network connection');
    console.log('5. Verify bot permissions');
  }
}

// Run the complete test
runCompleteTest();
