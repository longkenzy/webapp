#!/usr/bin/env node

// Script to check timezone configuration
console.log('=== Timezone Check ===');
console.log('TZ Environment Variable:', process.env.TZ || 'Not set');
console.log('Date.now():', new Date().toISOString());
console.log('Date.toString():', new Date().toString());
console.log('Date.toLocaleString():', new Date().toLocaleString('vi-VN'));

// Check if we're in the correct timezone
const now = new Date();
const utcOffset = now.getTimezoneOffset();
const hoursOffset = Math.abs(utcOffset / 60);
const sign = utcOffset <= 0 ? '+' : '-';

console.log('UTC Offset:', `${sign}${hoursOffset} hours`);
console.log('Expected offset for Asia/Ho_Chi_Minh: +7 hours');

if (utcOffset === -420) { // -420 minutes = +7 hours
  console.log('✅ Timezone is correctly set to Asia/Ho_Chi_Minh');
} else {
  console.log('❌ Timezone is NOT set to Asia/Ho_Chi_Minh');
  console.log('Please set TZ=Asia/Ho_Chi_Minh environment variable');
}
