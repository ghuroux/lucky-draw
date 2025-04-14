// Script to find and fix all route handlers with the params.id warning
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Directory to search for route handlers
const appDir = path.join(__dirname, 'app');

// Find all route.ts files
const findRouteFiles = () => {
  try {
    // Find route files with dynamic params in any directory
    const result = execSync('find app -type f -name "route.ts" | grep -E "\\[\\w+\\]"', { encoding: 'utf8' });
    return result.split('\n').filter(Boolean);
  } catch (error) {
    console.error('Error finding route files:', error);
    return [];
  }
};

// Find all page.tsx files with dynamic routes
const findPageFiles = () => {
  try {
    // Find page files with dynamic params in any directory
    const result = execSync('find app -type f -name "page.tsx" | grep -E "\\[\\w+\\]"', { encoding: 'utf8' });
    return result.split('\n').filter(Boolean);
  } catch (error) {
    console.error('Error finding page files:', error);
    return [];
  }
};

// Process a file to fix params usage
const fixParamsInFile = (filePath) => {
  try {
    console.log(`Processing file: ${filePath}`);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Patterns to find and replace
    
    // Pattern 1: const { id } = await params;
    const pattern1 = /const\s*{\s*(\w+)\s*}\s*=\s*await\s*params\s*;/g;
    
    // Pattern 2: const { id } = params;
    const pattern2 = /const\s*{\s*(\w+)\s*}\s*=\s*params\s*;/g;
    
    // Pattern 3: const eventId = parseInt(params.id); or Number(params.id);
    const pattern3 = /(const\s+\w+\s*=\s*(parseInt|Number)\s*\()\s*params\.(\w+)\s*(\)\s*;)/g;
    
    // Pattern 4: params.id inside a function directly
    const pattern4 = /(?<!const\s+\w+\s*=\s*(parseInt|Number)\s*\()params\.(\w+)(?!\s*=)/g;
    
    // Extract parameter name from file path
    const paramMatch = filePath.match(/\[(\w+)\]/);
    const paramName = paramMatch ? paramMatch[1] : 'id';
    
    // Get route name from file path for logging
    const routeName = filePath.split('/').slice(-3, -1).join('/');
    
    // Replace with correct pattern adding logging
    const replacement1 = (match, group1) => {
      return `const ${group1} = params.${group1};\nconsole.log("${routeName} - Using params.${group1}:", ${group1});`;
    };
    
    const replacement2 = (match, group1) => {
      return `const ${group1} = params.${group1};\nconsole.log("${routeName} - Using params.${group1}:", ${group1});`;
    };
    
    const replacement3 = (match, part1, func, param, part2) => {
      return `${part1}params.${param}${part2}\nconsole.log("${routeName} - Using params.${param}:", params.${param});`;
    };
    
    const replacement4 = (match, g1, param) => {
      // Don't replace params.id inside object/array destructuring or assignments
      if (match.includes('=') || match.includes(',')) {
        return match;
      }
      return `params.${param}`;
    };
    
    // Apply replacements
    let newContent = content
      .replace(pattern1, replacement1)
      .replace(pattern2, replacement2)
      .replace(pattern3, replacement3)
      .replace(pattern4, replacement4);
    
    // Check if anything changed
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`✅ Fixed params usage in ${filePath}`);
      return true;
    } else {
      console.log(`⏭️ No issues found in ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
    return false;
  }
};

// Main function
const main = () => {
  console.log('🔍 Finding route handler files...');
  const routeFiles = findRouteFiles();
  console.log(`Found ${routeFiles.length} route handler files`);
  
  console.log('🔍 Finding page files...');
  const pageFiles = findPageFiles();
  console.log(`Found ${pageFiles.length} page files`);
  
  const allFiles = [...routeFiles, ...pageFiles];
  
  console.log('\n🔧 Processing files to fix params usage...');
  let fixedCount = 0;
  
  allFiles.forEach(file => {
    const fixed = fixParamsInFile(file);
    if (fixed) fixedCount++;
  });
  
  console.log(`\n✨ Done! Fixed params usage in ${fixedCount} out of ${allFiles.length} files.`);
};

// Run the script
main(); 