#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing API response format issues...\n');

// Files that need to be fixed
const filesToFix = [
  'src/app/admin/receiving-cases/page.tsx',
  'src/app/admin/delivery-cases/CreateDeliveryCaseModal.tsx',
  'src/app/admin/receiving-cases/CreateReceivingCaseModal.tsx',
  'src/app/user/work/receiving/CreateReceivingCaseModal.tsx'
];

// Pattern to find and replace
const patterns = [
  {
    // Pattern 1: Direct usage of response.json() result
    find: /const (\w+) = await response\.json\(\);\s*set\w+\(\1\.map/g,
    replace: (match, varName) => {
      return `const ${varName}Result = await response.json();
        const ${varName} = ${varName}Result.data || ${varName}Result;
        set${varName.charAt(0).toUpperCase() + varName.slice(1)}(${varName}.map`;
    }
  },
  {
    // Pattern 2: Direct assignment
    find: /const (\w+) = await response\.json\(\);\s*if \(\1 && Array\.isArray\(\1\)\)/g,
    replace: (match, varName) => {
      return `const ${varName}Result = await response.json();
        const ${varName} = ${varName}Result.data || ${varName}Result;
        if (${varName} && Array.isArray(${varName}))`;
    }
  }
];

filesToFix.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    console.log(`📝 Fixing ${filePath}...`);
    
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Apply manual fixes for common patterns
    if (content.includes('const employees = await response.json();')) {
      content = content.replace(
        'const employees = await response.json();',
        'const employeesResult = await response.json();\n        const employees = employeesResult.data || employeesResult;'
      );
      modified = true;
    }
    
    if (content.includes('const data = await response.json();') && content.includes('setEmployees(data')) {
      content = content.replace(
        /const data = await response\.json\(\);\s*setEmployees\(data/g,
        'const dataResult = await response.json();\n        const data = dataResult.data || dataResult;\n        setEmployees(data'
      );
      modified = true;
    }
    
    if (content.includes('const receiversData = await receiversResponse.json();')) {
      content = content.replace(
        'const receiversData = await receiversResponse.json();',
        'const receiversResult = await receiversResponse.json();\n        const receiversData = receiversResult.data || receiversResult;'
      );
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`   ✓ Fixed ${filePath}`);
    } else {
      console.log(`   ⚠️  No changes needed for ${filePath}`);
    }
  } else {
    console.log(`   ✗ File not found: ${filePath}`);
  }
});

console.log('\n✨ API response format fixes complete!');
console.log('\n📋 Manual fixes may still be needed for:');
console.log('   • Complex response handling patterns');
console.log('   • Custom error handling logic');
console.log('   • Files with multiple API calls');
console.log('\n💡 Consider using the new apiClient from src/lib/api-client.ts for new code!');