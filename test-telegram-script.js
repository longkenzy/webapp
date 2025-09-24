const axios = require('axios');

// Telegram Bot Configuration
const BOT_TOKEN = '7957331372:AAEl8wYO_mlZz3XLhzBGg9AKr-LZM--3LKo';
const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

console.log('📱 Testing Telegram Bot Configuration');
console.log('=====================================');
console.log('');

console.log('🔧 Current Configuration:');
console.log(`   Bot Token: ${BOT_TOKEN.substring(0, 10)}...`);
console.log(`   API URL: ${API_URL}`);
console.log('');

async function getBotInfo() {
  try {
    console.log('🤖 Getting bot info...');
    const response = await axios.get(`${API_URL}/getMe`);
    console.log('✅ Bot info retrieved successfully:');
    console.log(`   Bot ID: ${response.data.result.id}`);
    console.log(`   Bot Name: ${response.data.result.first_name}`);
    console.log(`   Bot Username: @${response.data.result.username}`);
    console.log(`   Can Join Groups: ${response.data.result.can_join_groups}`);
    console.log(`   Can Read All Group Messages: ${response.data.result.can_read_all_group_messages}`);
    console.log(`   Supports Inline Queries: ${response.data.result.supports_inline_queries}`);
    return response.data.result;
  } catch (error) {
    console.log('❌ Error getting bot info:', error.message);
    throw error;
  }
}

async function getUpdates() {
  try {
    console.log('\n📬 Getting recent updates...');
    const response = await axios.get(`${API_URL}/getUpdates`);
    const updates = response.data.result;
    
    if (updates.length === 0) {
      console.log('⚠️ No recent messages found');
      console.log('💡 To get your Chat ID:');
      console.log('   1. Send a message to your bot');
      console.log('   2. Run this script again');
      return null;
    }
    
    console.log(`✅ Found ${updates.length} recent update(s)`);
    
    // Extract unique chat IDs
    const chatIds = [...new Set(updates.map(update => update.message?.chat?.id).filter(Boolean))];
    
    if (chatIds.length > 0) {
      console.log('\n📋 Available Chat IDs:');
      chatIds.forEach((chatId, index) => {
        const chat = updates.find(u => u.message?.chat?.id === chatId)?.message?.chat;
        console.log(`   ${index + 1}. Chat ID: ${chatId}`);
        console.log(`      Type: ${chat?.type}`);
        console.log(`      Title: ${chat?.title || chat?.first_name || 'N/A'}`);
        console.log(`      Username: @${chat?.username || 'N/A'}`);
      });
      
      return chatIds[0]; // Return first chat ID
    }
    
    return null;
  } catch (error) {
    console.log('❌ Error getting updates:', error.message);
    throw error;
  }
}

async function sendTestMessage(chatId) {
  try {
    console.log(`\n📤 Sending test message to Chat ID: ${chatId}...`);
    
    const testMessage = `
🧪 <b>Test Telegram Bot</b>

✅ Telegram configuration is working!
⏰ <b>Test time:</b> ${new Date().toLocaleString('vi-VN')}
🤖 <b>Bot:</b> SmartServices Bot
💬 <b>Admin:</b> ${chatId}

Nếu bạn nhận được tin nhắn này, Telegram notification đã hoạt động!

---
SmartServices - Hệ thống quản lý Case
Test message được gửi tự động
    `.trim();
    
    const response = await axios.post(`${API_URL}/sendMessage`, {
      chat_id: chatId,
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

async function sendCaseNotification(chatId) {
  try {
    console.log(`\n📋 Sending case notification to Chat ID: ${chatId}...`);
    
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
      chat_id: chatId,
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

async function runTest() {
  try {
    // Get bot info
    const botInfo = await getBotInfo();
    
    // Get updates to find chat ID
    const chatId = await getUpdates();
    
    if (!chatId) {
      console.log('\n❌ No Chat ID found');
      console.log('💡 Please send a message to your bot first');
      return;
    }
    
    // Send test message
    await sendTestMessage(chatId);
    
    // Send case notification
    await sendCaseNotification(chatId);
    
    console.log('\n🎉 SUCCESS! Telegram Bot is working!');
    console.log('📱 Please check your Telegram app for messages');
    console.log(`💬 Chat ID to use: ${chatId}`);
    console.log('\n🔧 Update your env.development:');
    console.log(`TELEGRAM_CHAT_ID="${chatId}"`);
    
  } catch (error) {
    console.log('\n❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check if bot token is correct');
    console.log('2. Check if bot is not blocked');
    console.log('3. Send a message to the bot first');
    console.log('4. Check network connection');
  }
}

// Run the test
runTest();
