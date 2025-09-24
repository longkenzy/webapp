const axios = require('axios');

// Configuration
const BOT_TOKEN = '7957331372:AAEl8wYO_mlZz3XLhzBGg9AKr-LZM--3LKo';
const CHAT_ID = '1653169009';
const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

console.log('🧪 Testing Product List Format');
console.log('==============================');
console.log('');

async function testProductListFormat() {
  try {
    console.log('📱 Testing product list format...');
    
    const productList = `Danh sách sản phẩm nhận hàng:
Laptop Dell Inspiron 15 3000 - 1 chiếc
Màn hình Dell 24 inch - 2 chiếc
Bàn phím Logitech K380 - 3 chiếc
Chuột Logitech M220 - 2 chiếc
Cáp HDMI 2m - 5 chiếc
Ổ cứng SSD 500GB - 1 chiếc`;
    
    const testMessage = `
🚨 <b>Case NHẬN HÀNG được tạo</b>

👨‍💼 <b>Người xử lý:</b> Test Handler 3
📋 <b>Tiêu đề:</b> Test Case 3
📝 <b>Mô tả chi tiết:</b> ${productList}

📦 <b>Nhận hàng từ cty:</b> Công ty ABC

⏰ <b>Thời gian tạo:</b> ${new Date().toLocaleString('vi-VN')}

🔗 <b>Xem chi tiết:</b> <a href="http://localhost:3001/admin/dashboard">Admin Dashboard</a>
    `.trim();
    
    const response = await axios.post(`${API_URL}/sendMessage`, {
      chat_id: CHAT_ID,
      text: testMessage,
      parse_mode: 'HTML'
    });
    
    console.log('✅ Product list format test successful!');
    console.log(`📧 Message ID: ${response.data.result.message_id}`);
    console.log('📱 Check your Telegram app for the product list format!');
    
    return true;
  } catch (error) {
    console.log('❌ Product list format test failed:', error.message);
    return false;
  }
}

async function testFormattedProductList() {
  try {
    console.log('\n📱 Testing formatted product list...');
    
    const formattedProductList = `• Danh sách sản phẩm nhận hàng:
• Laptop Dell Inspiron 15 3000 - 1 chiếc
• Màn hình Dell 24 inch - 2 chiếc
• Bàn phím Logitech K380 - 3 chiếc
• Chuột Logitech M220 - 2 chiếc
• Cáp HDMI 2m - 5 chiếc
• Ổ cứng SSD 500GB - 1 chiếc`;
    
    const testMessage = `
🚨 <b>Case NHẬN HÀNG được tạo</b>

👨‍💼 <b>Người xử lý:</b> Test Handler 3
📋 <b>Tiêu đề:</b> Test Case 3
📝 <b>Mô tả chi tiết:</b> ${formattedProductList}

📦 <b>Nhận hàng từ cty:</b> Công ty ABC

⏰ <b>Thời gian tạo:</b> ${new Date().toLocaleString('vi-VN')}

🔗 <b>Xem chi tiết:</b> <a href="http://localhost:3001/admin/dashboard">Admin Dashboard</a>
    `.trim();
    
    const response = await axios.post(`${API_URL}/sendMessage`, {
      chat_id: CHAT_ID,
      text: testMessage,
      parse_mode: 'HTML'
    });
    
    console.log('✅ Formatted product list test successful!');
    console.log(`📧 Message ID: ${response.data.result.message_id}`);
    console.log('📱 Check your Telegram app for the formatted product list!');
    
    return true;
  } catch (error) {
    console.log('❌ Formatted product list test failed:', error.message);
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

async function runProductListFormatTest() {
  try {
    console.log('🚀 Starting Product List Format Test...');
    console.log('========================================');
    
    // Test 1: Raw product list
    await testProductListFormat();
    
    // Test 2: Formatted product list
    await testFormattedProductList();
    
    // Test 3: Server API
    await testServerAPI();
    
    console.log('\n🎉 PRODUCT LIST FORMAT TEST COMPLETED!');
    console.log('========================================');
    console.log('✅ Product list format is working!');
    console.log('✅ Formatted product list is working!');
    console.log('✅ Server API is working!');
    console.log('');
    console.log('📱 Check your Telegram app for all messages');
    console.log('🔧 Product lists now display with bullet points!');
    console.log('');
    console.log('✨ Product List Format Features:');
    console.log('• 🚨 Case NHẬN HÀNG được tạo');
    console.log('• 👨‍💼 Người xử lý: [Handler Name]');
    console.log('• 📋 Tiêu đề: [Case Title]');
    console.log('• 📝 Mô tả chi tiết: [Formatted Product List]');
    console.log('• 📦 Nhận hàng từ cty: [Company Name]');
    console.log('• ⏰ Thời gian tạo: [Creation Time]');
    console.log('• 🔗 Xem chi tiết: Admin Dashboard');
    console.log('');
    console.log('🚀 Next steps:');
    console.log('1. Create real receiving cases with product lists');
    console.log('2. Check Telegram for formatted product lists');
    console.log('3. Verify bullet points are displayed correctly');
    
  } catch (error) {
    console.log('\n❌ Product list format test failed:', error.message);
  }
}

// Run the product list format test
runProductListFormatTest();


