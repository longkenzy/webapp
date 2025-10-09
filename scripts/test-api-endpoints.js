#!/usr/bin/env node

const http = require('http');

console.log('🧪 Testing API endpoints...\n');

// Test endpoints
const endpoints = [
  { path: '/api/health', method: 'GET', description: 'Health check' },
  { path: '/api/employees/list', method: 'GET', description: 'Employees list' }
];

async function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 8080, // Next.js dev server port
      path: endpoint.path,
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            success: res.statusCode < 400,
            data: jsonData,
            endpoint: endpoint.path
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            success: false,
            error: 'Invalid JSON response',
            endpoint: endpoint.path
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({
        status: 0,
        success: false,
        error: error.message,
        endpoint: endpoint.path
      });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        status: 0,
        success: false,
        error: 'Request timeout',
        endpoint: endpoint.path
      });
    });

    req.end();
  });
}

async function runTests() {
  console.log('📡 Testing API endpoints (make sure dev server is running on port 8080)...\n');
  
  for (const endpoint of endpoints) {
    console.log(`Testing ${endpoint.method} ${endpoint.path} - ${endpoint.description}`);
    
    const result = await testEndpoint(endpoint);
    
    if (result.success) {
      console.log(`   ✅ Status: ${result.status}`);
      
      // Check response format for specific endpoints
      if (endpoint.path === '/api/employees/list') {
        if (result.data && result.data.success && Array.isArray(result.data.data)) {
          console.log(`   ✅ Response format: New standardized format`);
          console.log(`   ✅ Data count: ${result.data.data.length} employees`);
        } else if (Array.isArray(result.data)) {
          console.log(`   ⚠️  Response format: Old format (direct array)`);
        } else {
          console.log(`   ❌ Response format: Unexpected format`);
        }
      }
      
      if (endpoint.path === '/api/health') {
        if (result.data && result.data.success) {
          console.log(`   ✅ Health status: ${result.data.data?.status || 'unknown'}`);
        }
      }
    } else {
      console.log(`   ❌ Status: ${result.status}`);
      console.log(`   ❌ Error: ${result.error}`);
    }
    
    console.log('');
  }
  
  console.log('🏁 API endpoint testing complete!');
  console.log('\n💡 If tests fail:');
  console.log('   • Make sure Next.js dev server is running: npm run dev');
  console.log('   • Check if database is connected');
  console.log('   • Verify authentication is working');
}

runTests().catch(console.error);