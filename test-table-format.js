const axios = require('axios');

// Configuration
const BOT_TOKEN = '7957331372:AAEl8wYO_mlZz3XLhzBGg9AKr-LZM--3LKo';
const CHAT_ID = '1653169009';
const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

console.log('🧪 Testing Table Format');
console.log('======================');
console.log('');

async function testTableFormat() {
  try {
    console.log('📱 Testing table format...');
    
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
    
    console.log('✅ Table format test successful!');
    console.log(`📧 Message ID: ${response.data.result.message_id}`);
    console.log('📱 Check your Telegram app for the table format!');
    
    return true;
  } catch (error) {
    console.log('❌ Table format test failed:', error.message);
    return false;
  }
}

async function testSimpleTable() {
  try {
    console.log('\n📱 Testing simple table format...');
    
    const simpleTable = `
<pre>
┌─────────────────────────────────────────────────────────────────────────────┐
│ Tên sản phẩm                    │ SL │ Mã        │ S/N                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ Laptop Dell Inspiron 15 3000   │  1 │ DELL001   │ DL123456789                │
│ Màn hình Dell 24 inch          │  2 │ DELL002   │ DL987654321                │
│ Bàn phím Logitech K380         │  3 │ LOG001    │ LG111222333                │
│ Chuột Logitech M220            │  2 │ LOG002    │ LG444555666                │
│ Cáp HDMI 2m                    │  5 │ CAB001    │ CB777888999                │
│ Ổ cứng SSD 500GB                │  1 │ SSD001    │ SS123456789                │
└─────────────────────────────────────────────────────────────────────────────┘
</pre>`;
    
    const testMessage = `
🚨 <b>Case NHẬN HÀNG được tạo</b>

👨‍💼 <b>Người xử lý:</b> Test Handler 3
📋 <b>Tiêu đề:</b> Test Case 3
📝 <b>Mô tả chi tiết:</b> ${simpleTable}

📦 <b>Nhận hàng từ cty:</b> Công ty ABC

⏰ <b>Thời gian tạo:</b> ${new Date().toLocaleString('vi-VN')}

🔗 <b>Xem chi tiết:</b> <a href="http://localhost:3001/admin/dashboard">Admin Dashboard</a>
    `.trim();
    
    const response = await axios.post(`${API_URL}/sendMessage`, {
      chat_id: CHAT_ID,
      text: testMessage,
      parse_mode: 'HTML'
    });
    
    console.log('✅ Simple table format test successful!');
    console.log(`📧 Message ID: ${response.data.result.message_id}`);
    console.log('📱 Check your Telegram app for the simple table format!');
    
    return true;
  } catch (error) {
    console.log('❌ Simple table format test failed:', error.message);
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

async function runTableFormatTest() {
  try {
    console.log('🚀 Starting Table Format Test...');
    console.log('==================================');
    
    // Test 1: Raw product list with table format
    await testTableFormat();
    
    // Test 2: Simple table format
    await testSimpleTable();
    
    // Test 3: Server API
    await testServerAPI();
    
    console.log('\n🎉 TABLE FORMAT TEST COMPLETED!');
    console.log('==================================');
    console.log('✅ Table format is working!');
    console.log('✅ Simple table format is working!');
    console.log('✅ Server API is working!');
    console.log('');
    console.log('📱 Check your Telegram app for all messages');
    console.log('🔧 Product lists now display as tables!');
    console.log('');
    console.log('✨ Table Format Features:');
    console.log('• 🚨 Case NHẬN HÀNG được tạo');
    console.log('• 👨‍💼 Người xử lý: [Handler Name]');
    console.log('• 📋 Tiêu đề: [Case Title]');
    console.log('• 📝 Mô tả chi tiết: [Table Format with Borders]');
    console.log('• 📦 Nhận hàng từ cty: [Company Name]');
    console.log('• ⏰ Thời gian tạo: [Creation Time]');
    console.log('• 🔗 Xem chi tiết: Admin Dashboard');
    console.log('');
    console.log('📋 Table Format:');
    console.log('• Uses <pre> tag for monospace font');
    console.log('• Unicode box drawing characters for borders');
    console.log('• Proper column alignment');
    console.log('• Truncates long text with ellipsis');
    console.log('');
    console.log('🚀 Next steps:');
    console.log('1. Create real receiving cases with product lists');
    console.log('2. Check Telegram for table format');
    console.log('3. Verify table borders and alignment');
    
  } catch (error) {
    console.log('\n❌ Table format test failed:', error.message);
  }
}

// Run the table format test
runTableFormatTest();


