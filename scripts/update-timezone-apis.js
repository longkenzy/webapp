#!/usr/bin/env node

// Script to update all API endpoints with timezone conversion
const fs = require('fs');
const path = require('path');

const apiFiles = [
  'src/app/api/maintenance-cases/route.ts',
  'src/app/api/maintenance-cases/[id]/route.ts',
  'src/app/api/internal-cases/route.ts',
  'src/app/api/internal-cases/[id]/route.ts',
  'src/app/api/incidents/route.ts',
  'src/app/api/incidents/[id]/route.ts',
  'src/app/api/warranties/route.ts',
  'src/app/api/warranties/[id]/route.ts',
  'src/app/api/deployment-cases/route.ts',
  'src/app/api/deployment-cases/[id]/route.ts',
  'src/app/api/delivery-cases/route.ts',
  'src/app/api/delivery-cases/[id]/route.ts'
];

function updateFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Add import if not exists
    if (!content.includes('import { convertToVietnamTime }')) {
      const importRegex = /import.*from.*["']@\/lib\/[^"']*["'];/g;
      const lastImport = [...content.matchAll(importRegex)].pop();
      if (lastImport) {
        const insertPos = lastImport.index + lastImport[0].length;
        content = content.slice(0, insertPos) + 
          '\nimport { convertToVietnamTime } from "@/lib/date-utils";' + 
          content.slice(insertPos);
      }
    }
    
    // Replace startDate/endDate assignments
    content = content.replace(
      /startDate:\s*startDate/g,
      'startDate: startDate ? convertToVietnamTime(startDate) : null'
    );
    
    content = content.replace(
      /endDate:\s*endDate\s*\|\|\s*null/g,
      'endDate: endDate ? convertToVietnamTime(endDate) : null'
    );
    
    content = content.replace(
      /updateData\.startDate\s*=\s*startDate/g,
      'updateData.startDate = convertToVietnamTime(startDate)'
    );
    
    content = content.replace(
      /updateData\.endDate\s*=\s*endDate\s*\|\|\s*null/g,
      'updateData.endDate = endDate ? convertToVietnamTime(endDate) : null'
    );
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ Updated ${filePath}`);
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
  }
}

console.log('🔄 Updating API endpoints with timezone conversion...');
apiFiles.forEach(updateFile);
console.log('✅ All files updated!');
