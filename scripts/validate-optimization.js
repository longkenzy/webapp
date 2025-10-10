#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Project Optimization...\n');

// Check if optimization files exist
const optimizationFiles = [
  'src/lib/api-middleware.ts',
  'src/lib/case-helpers.ts',
  'src/lib/query-optimization.ts',
  'src/app/api/health/route.ts'
];

console.log('✅ Checking optimization files:');
optimizationFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`   ✓ ${file}`);
  } else {
    console.log(`   ✗ ${file} - MISSING`);
  }
});

// Check if unused files were removed
const removedFiles = [
  'public/file.svg',
  'public/globe.svg',
  'public/next.svg',
  'public/vercel.svg',
  'public/window.svg'
];

console.log('\n🗑️  Checking removed files:');
removedFiles.forEach(file => {
  if (!fs.existsSync(file)) {
    console.log(`   ✓ ${file} - REMOVED`);
  } else {
    console.log(`   ✗ ${file} - STILL EXISTS`);
  }
});

// Check package.json for removed dependencies
console.log('\n📦 Checking package.json dependencies:');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const removedDeps = ['swr', 'dayjs', 'node-fetch', 'csv-parser'];

removedDeps.forEach(dep => {
  if (!packageJson.dependencies[dep]) {
    console.log(`   ✓ ${dep} - REMOVED`);
  } else {
    console.log(`   ✗ ${dep} - STILL EXISTS`);
  }
});

// Check for API routes using new middleware
console.log('\n🔧 Checking API routes optimization:');
const optimizedRoutes = [
  'src/app/api/employees/list/route.ts',
  'src/app/api/dashboard/cases/route.ts',
  'src/app/api/internal-cases/route.ts'
];

optimizedRoutes.forEach(route => {
  if (fs.existsSync(route)) {
    const content = fs.readFileSync(route, 'utf8');
    if (content.includes('withAuth') || content.includes('withErrorHandling')) {
      console.log(`   ✓ ${route} - OPTIMIZED`);
    } else {
      console.log(`   ⚠️  ${route} - NOT FULLY OPTIMIZED`);
    }
  }
});

// Performance recommendations
console.log('\n🚀 Performance Recommendations:');
console.log('   • Run `npm install` to update dependencies');
console.log('   • Test API endpoints: node scripts/test-api-endpoints.js');
console.log('   • Monitor `/api/health` endpoint for performance metrics');
console.log('   • Check API_MIGRATION_GUIDE.md for response format changes');
console.log('   • Consider implementing rate limiting for production');
console.log('   • Add request validation with Zod schemas');

console.log('\n⚠️  Important Notes:');
console.log('   • API response format has changed to standardized format');
console.log('   • Some frontend files may need manual fixes');
console.log('   • Use src/lib/api-client.ts for new API calls');

console.log('\n✨ Optimization validation complete!');