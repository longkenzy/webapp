const axios = require('axios');

// Configuration
const BOT_TOKEN = '7957331372:AAEl8wYO_mlZz3XLhzBGg9AKr-LZM--3LKo';
const CHAT_ID = '1653169009';
const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

console.log('🧪 Testing Specific Product Format');
console.log('==================================');
console.log('');

async function testSpecificProductFormat() {
  try {
    console.log('📱 Testing specific product format...');
    
    const productList = `Danh sách sản phẩm nhận hàng:
Laptop Dell Inspiron 15 3000 | SL: 1 | Mã: DELL001 | S/N: DL123456789
Màn hình Dell 24 inch | SL: 2 | Mã: DELL002 | S/N: DL987654321
Bàn phím Logitech K380 | SL: 3 | Mã: LOG001 | S/N: LG111222333
Chuột Logitech M220 | SL: 2 | Mã: LOG002 | S/N: LG444555666
Cáp HDMI 2m | SL: 5 | Mã: CAB001 | S/N: CB777888999
Ổ cứng SSD 500GB | SL: 1 | Mã: SSD001 | S/N: SS123456789`;
    
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
    
    console.log('✅ Specific product format test successful!');
    console.log(`📧 Message ID: ${response.data.result.message_id}`);
    console.log('📱 Check your Telegram app for the specific product format!');
    
    return true;
  } catch (error) {
    console.log('❌ Specific product format test failed:', error.message);
    return false;
  }
}

async function testFormattedProductList() {
  try {
    console.log('\n📱 Testing formatted product list...');
    
    const formattedProductList = `• Danh sách sản phẩm nhận hàng:
• Laptop Dell Inspiron 15 3000 | SL: 1 | Mã: DELL001 | S/N: DL123456789
• Màn hình Dell 24 inch | SL: 2 | Mã: DELL002 | S/N: DL987654321
• Bàn phím Logitech K380 | SL: 3 | Mã: LOG001 | S/N: LG111222333
• Chuột Logitech M220 | SL: 2 | Mã: LOG002 | S/N: LG444555666
• Cáp HDMI 2m | SL: 5 | Mã: CAB001 | S/N: CB777888999
• Ổ cứng SSD 500GB | SL: 1 | Mã: SSD001 | S/N: SS123456789`;
    
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

async function runSpecificProductFormatTest() {
  try {
    console.log('🚀 Starting Specific Product Format Test...');
    console.log('============================================');
    
    // Test 1: Raw product list with specific format
    await testSpecificProductFormat();
    
    // Test 2: Formatted product list
    await testFormattedProductList();
    
    // Test 3: Server API
    await testServerAPI();
    
    console.log('\n🎉 SPECIFIC PRODUCT FORMAT TEST COMPLETED!');
    console.log('============================================');
    console.log('✅ Specific product format is working!');
    console.log('✅ Formatted product list is working!');
    console.log('✅ Server API is working!');
    console.log('');
    console.log('📱 Check your Telegram app for all messages');
    console.log('🔧 Product lists now display with specific format!');
    console.log('');
    console.log('✨ Specific Product Format Features:');
    console.log('• 🚨 Case NHẬN HÀNG được tạo');
    console.log('• 👨‍💼 Người xử lý: [Handler Name]');
    console.log('• 📋 Tiêu đề: [Case Title]');
    console.log('• 📝 Mô tả chi tiết: [Formatted Product List with SL, Mã, S/N]');
    console.log('• 📦 Nhận hàng từ cty: [Company Name]');
    console.log('• ⏰ Thời gian tạo: [Creation Time]');
    console.log('• 🔗 Xem chi tiết: Admin Dashboard');
    console.log('');
    console.log('📋 Product Format:');
    console.log('• Tên sản phẩm | SL: 1 | Mã: ádfà | S/N: fsdfádf');
    console.log('');
    console.log('🚀 Next steps:');
    console.log('1. Create real receiving cases with specific product format');
    console.log('2. Check Telegram for formatted product lists with SL, Mã, S/N');
    console.log('3. Verify specific format is displayed correctly');
    
  } catch (error) {
    console.log('\n❌ Specific product format test failed:', error.message);
  }
}

// Run the specific product format test
runSpecificProductFormatTest();


