import { NextRequest, NextResponse } from 'next/server';
import { testTelegramConfiguration, sendCaseCreatedTelegram, getBotInfo } from '@/lib/telegram';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing Telegram configuration...');
    
    const isValid = await testTelegramConfiguration();
    
    if (isValid) {
      return NextResponse.json({ 
        success: true, 
        message: 'Telegram configuration is valid',
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'Telegram configuration failed',
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Telegram configuration test failed:', error);
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Sending test Telegram notification...');
    
    const testCaseData = {
      caseId: 'test-' + Date.now(),
      caseType: 'Test Case',
      caseTitle: 'Test Telegram Notification',
      requesterName: 'Test User',
      requesterEmail: 'test@smartservices.com.vn',
      handlerName: 'Test Handler',
      createdAt: new Date().toLocaleString('vi-VN')
    };

    await sendCaseCreatedTelegram(testCaseData);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Test Telegram notification sent successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Test Telegram notification failed:', error);
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Get bot info
export async function PUT(request: NextRequest) {
  try {
    console.log('Getting bot info...');
    
    const botInfo = await getBotInfo();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Bot info retrieved successfully',
      data: botInfo,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get bot info failed:', error);
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
