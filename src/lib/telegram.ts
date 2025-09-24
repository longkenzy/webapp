import axios from 'axios';

interface TelegramMessage {
  chatId: string;
  text: string;
  parseMode?: 'HTML' | 'Markdown';
}

interface CaseTelegramData {
  caseId: string;
  caseType: string;
  caseTitle: string;
  caseDescription?: string;
  requesterName: string;
  requesterEmail: string;
  handlerName?: string;
  priority?: string;
  createdAt: string;
}

// Telegram Bot Configuration
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

// Send message to Telegram
export async function sendTelegramMessage(message: TelegramMessage) {
  try {
    const response = await axios.post(`${TELEGRAM_API_URL}/sendMessage`, {
      chat_id: message.chatId,
      text: message.text,
      parse_mode: message.parseMode || 'HTML'
    });
    
    console.log('✅ Telegram message sent successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Telegram message failed:', error);
    throw error;
  }
}

// Send case created notification to admin
export async function sendCaseCreatedTelegram(caseData: CaseTelegramData) {
  try {
    const adminChatId = TELEGRAM_CHAT_ID;
    
    if (!adminChatId) {
      console.log('⚠️ Telegram Chat ID not configured');
      return;
    }

    const message = generateCaseCreatedMessage(caseData);
    
    await sendTelegramMessage({
      chatId: adminChatId,
      text: message,
      parseMode: 'HTML'
    });
    
    console.log('✅ Case created notification sent to Telegram');
  } catch (error) {
    console.error('❌ Error sending Telegram notification:', error);
    // Don't fail case creation if Telegram fails
  }
}

// Generate HTML message for case created
function generateCaseCreatedMessage(caseData: CaseTelegramData): string {
  const caseTypeEmoji = getCaseTypeEmoji(caseData.caseType);
  const priorityEmoji = getPriorityEmoji(caseData.priority);
  
  // Get the correct case type title
  const caseTypeTitle = getCaseTypeTitle(caseData.caseType);
  
  // Use different format for different case types
  if (caseData.caseType === 'Case nhận hàng') {
    return generateReceivingCaseMessage(caseData, caseTypeTitle);
  } else {
    return generateDefaultCaseMessage(caseData, caseTypeTitle, caseTypeEmoji);
  }
}

// Generate message for receiving cases (simplified format)
function generateReceivingCaseMessage(caseData: CaseTelegramData, caseTypeTitle: string): string {
  // Format product list if description contains product details
  const formattedDescription = formatProductList(caseData.caseDescription);
  
  return `
🚨 <b>${caseTypeTitle}</b>

👨‍💼 <b>Người xử lý:</b> ${caseData.handlerName || 'Chưa xác định'}
📋 <b>Tiêu đề:</b> ${caseData.caseTitle}
📝 <b>Mô tả chi tiết:</b> ${formattedDescription}

📦 <b>Nhận hàng từ cty:</b> ${caseData.requesterName || 'Chưa xác định'}

⏰ <b>Thời gian tạo:</b> ${caseData.createdAt}

🔗 <b>Xem chi tiết:</b> <a href="${process.env.NEXTAUTH_URL}/admin/dashboard">Admin Dashboard</a>
  `.trim();
}

// Generate message for other case types (full format)
function generateDefaultCaseMessage(caseData: CaseTelegramData, caseTypeTitle: string, caseTypeEmoji: string): string {
  return `
🚨 <b>${caseTypeTitle}</b>

👤 <b>Người yêu cầu:</b> ${caseData.requesterName}
👨‍💼 <b>Người xử lý:</b> ${caseData.handlerName || 'Chưa xác định'}

${caseTypeEmoji} <b>Loại Case:</b> ${caseData.caseType}
📋 <b>Tiêu đề:</b> ${caseData.caseTitle}
📝 <b>Mô tả chi tiết:</b> ${caseData.caseDescription || 'Không có mô tả'}

⏰ <b>Thời gian tạo:</b> ${caseData.createdAt}

🔗 <b>Xem chi tiết:</b> <a href="${process.env.NEXTAUTH_URL}/admin/dashboard">Admin Dashboard</a>
  `.trim();
}

// Get emoji for case type
function getCaseTypeEmoji(caseType: string): string {
  const emojiMap: Record<string, string> = {
    'Case nội bộ': '🏢',
    'Case giao hàng': '🚚',
    'Case nhận hàng': '📦',
    'Case bảo trì': '🔧',
    'Case bảo hành': '🛡️',
    'Case sự cố': '⚠️',
    'Case triển khai': '🚀'
  };
  
  return emojiMap[caseType] || '📋';
}

// Get case type title
function getCaseTypeTitle(caseType: string): string {
  const titleMap: Record<string, string> = {
    'Case nội bộ': 'Case NỘI BỘ được tạo',
    'Case giao hàng': 'Case GIAO HÀNG được tạo',
    'Case nhận hàng': 'Case NHẬN HÀNG được tạo',
    'Case bảo trì': 'Case BẢO TRÌ được tạo',
    'Case bảo hành': 'Case BẢO HÀNH được tạo',
    'Case sự cố': 'Case SỰ CỐ được tạo',
    'Case triển khai': 'Case TRIỂN KHAI được tạo'
  };
  
  return titleMap[caseType] || 'Case được tạo';
}

// Get emoji for priority
function getPriorityEmoji(priority?: string): string {
  if (!priority) return '';
  
  const priorityMap: Record<string, string> = {
    'HIGH': '🔴',
    'MEDIUM': '🟡',
    'LOW': '🟢'
  };
  
  return priorityMap[priority.toUpperCase()] || '⚪';
}

// Format product list for better display
function formatProductList(description?: string): string {
  if (!description) return 'Không có mô tả';
  
  // Check if description contains product list patterns
  const productPatterns = [
    /sản phẩm/i,
    /danh sách/i,
    /hàng hóa/i,
    /thiết bị/i,
    /máy móc/i,
    /linh kiện/i
  ];
  
  const hasProducts = productPatterns.some(pattern => pattern.test(description));
  
  if (hasProducts) {
    // Format as table-like structure using monospace
    const lines = description.split('\n').filter(line => line.trim());
    const productLines = lines.filter(line => {
      const trimmed = line.trim();
      return trimmed && !trimmed.startsWith('•') && !trimmed.startsWith('-') && 
             (trimmed.includes('|') || trimmed.includes('SL:') || trimmed.includes('Mã:') || trimmed.includes('S/N:'));
    });
    
    if (productLines.length > 0) {
      // Create table header
      const tableHeader = `
<pre>
┌─────────────────────────────────────────────────────────────────────────────┐
│ Tên sản phẩm                    │ SL │ Mã        │ S/N                        │
├─────────────────────────────────────────────────────────────────────────────┤`;
      
      // Create table rows
      const tableRows = productLines.map(line => {
        const trimmed = line.trim();
        // Parse the line to extract product info
        const parts = trimmed.split('|').map(p => p.trim());
        const productName = parts[0] || '';
        const sl = parts[1]?.replace('SL:', '').trim() || '1';
        const ma = parts[2]?.replace('Mã:', '').trim() || '-';
        const sn = parts[3]?.replace('S/N:', '').trim() || '-';
        
        // Format each row with proper spacing
        const name = productName.length > 25 ? productName.substring(0, 22) + '...' : productName.padEnd(25);
        const slFormatted = sl.padStart(2);
        const maFormatted = ma.length > 8 ? ma.substring(0, 5) + '...' : ma.padEnd(8);
        const snFormatted = sn.length > 20 ? sn.substring(0, 17) + '...' : sn.padEnd(20);
        
        return `│ ${name} │ ${slFormatted} │ ${maFormatted} │ ${snFormatted} │`;
      });
      
      // Create table footer
      const tableFooter = `
└─────────────────────────────────────────────────────────────────────────────┘
</pre>`;
      
      return tableHeader + tableRows.join('\n') + tableFooter;
    } else {
      // Fallback to bullet points if no structured data
      const formattedLines = lines.map(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('•') && !trimmed.startsWith('-')) {
          return `• ${trimmed}`;
        }
        return trimmed;
      });
      return formattedLines.join('\n');
    }
  }
  
  return description;
}

// Test Telegram configuration
export async function testTelegramConfiguration() {
  try {
    console.log('🔧 Testing Telegram configuration...');
    console.log('Bot Token:', TELEGRAM_BOT_TOKEN ? 'Set' : 'Missing');
    console.log('Chat ID:', TELEGRAM_CHAT_ID ? 'Set' : 'Missing');
    
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.log('❌ Missing configuration');
      throw new Error('Telegram configuration missing');
    }
    
    const testMessage = `
🧪 <b>Test Telegram Bot</b>

✅ Telegram configuration is working!
⏰ <b>Test time:</b> ${new Date().toLocaleString('vi-VN')}
🤖 <b>Bot:</b> SmartServices Bot
💬 <b>Admin:</b> ${TELEGRAM_CHAT_ID}

Nếu bạn nhận được tin nhắn này, Telegram notification đã hoạt động!
    `.trim();
    
    console.log('📤 Sending test message...');
    await sendTelegramMessage({
      chatId: TELEGRAM_CHAT_ID,
      text: testMessage,
      parseMode: 'HTML'
    });
    
    console.log('✅ Telegram test successful');
    return true;
  } catch (error) {
    console.error('❌ Telegram test failed:', error);
    return false;
  }
}

// Get bot info
export async function getBotInfo() {
  try {
    const response = await axios.get(`${TELEGRAM_API_URL}/getMe`);
    return response.data;
  } catch (error) {
    console.error('❌ Error getting bot info:', error);
    throw error;
  }
}
