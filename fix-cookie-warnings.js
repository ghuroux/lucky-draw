// Script to find and fix cookie handling issues in auth files
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Directory to search for auth files
const appDir = path.join(__dirname, 'app');

// Find all auth-related files
const findAuthFiles = () => {
  try {
    // Find files with auth or supabase in the name in lib directory
    const result = execSync('find app/lib -type f -name "*.ts" | grep -E "(auth|supabase)"', { encoding: 'utf8' });
    return result.split('\n').filter(Boolean);
  } catch (error) {
    console.error('Error finding auth files:', error);
    return [];
  }
};

// Process a file to fix cookie usage
const fixCookieUsageInFile = (filePath) => {
  try {
    console.log(`Processing file: ${filePath}`);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Patterns to find and replace
    
    // Pattern 1: cookies() used directly without storing
    const pattern1 = /cookies\(\)(\.get|\[)/g;
    // Pattern 2: createServerComponentClient with direct cookies()
    const pattern2 = /createServerComponentClient\(\{\s*cookies:\s*\(\)\s*=>\s*cookies\(\)/g;
    
    // Replace with correct pattern
    const replacement1 = `cookieStore$1`;
    const replacement2 = `createServerComponentClient({ cookies: () => cookieStore`;
    
    // Add cookieStore declaration if needed
    const cookieStoreDeclaration = `const cookieStore = cookies();\n`;
    
    // Check if we have a cookies import
    const hasCookiesImport = /import.*cookies.*from.*next\/headers/.test(content);
    
    // Apply replacements
    let newContent = content;
    
    // Add cookie store declaration if needed
    if ((pattern1.test(content) || pattern2.test(content)) && hasCookiesImport) {
      // Reset pattern RegExp
      pattern1.lastIndex = 0;
      pattern2.lastIndex = 0;
      
      // Find first function in the file that uses cookies()
      const functionMatch = content.match(/export\s+(?:async\s+)?function\s+(\w+)/);
      if (functionMatch) {
        const functionName = functionMatch[1];
        const functionPos = content.indexOf(`function ${functionName}`);
        const functionBodyPos = content.indexOf('{', functionPos) + 1;
        
        // Insert cookieStore declaration at the beginning of the function body
        newContent = 
          content.substring(0, functionBodyPos) + 
          '\n  ' + cookieStoreDeclaration + '  ' + 
          content.substring(functionBodyPos);
      }
    }
    
    // Apply replacements
    newContent = newContent
      .replace(pattern1, replacement1)
      .replace(pattern2, replacement2);
    
    // Check if anything changed
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`✅ Fixed cookie usage in ${filePath}`);
      return true;
    } else {
      console.log(`⏭️ No cookie issues found in ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
    return false;
  }
};

// Main function
const main = () => {
  console.log('🔍 Finding auth-related files...');
  const authFiles = findAuthFiles();
  console.log(`Found ${authFiles.length} auth-related files`);
  
  console.log('\n🔧 Processing files to fix cookie usage...');
  let fixedCount = 0;
  
  authFiles.forEach(file => {
    const fixed = fixCookieUsageInFile(file);
    if (fixed) fixedCount++;
  });
  
  console.log(`\n✨ Done! Fixed cookie usage in ${fixedCount} out of ${authFiles.length} files.`);
};

// Run the script
main(); 