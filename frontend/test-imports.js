// Simple test to verify imports work
const fs = require('fs');
const path = require('path');

console.log('Testing module resolution...');

// Check if src directory exists
const srcPath = path.join(__dirname, 'src');
console.log('src directory exists:', fs.existsSync(srcPath));

// Check if lib/api directory exists
const apiPath = path.join(__dirname, 'src/lib/api');
console.log('src/lib/api directory exists:', fs.existsSync(apiPath));

// List api files
if (fs.existsSync(apiPath)) {
  const apiFiles = fs.readdirSync(apiPath);
  console.log('API files:', apiFiles);
}

// Check if stores directory exists
const storesPath = path.join(__dirname, 'src/stores');
console.log('src/stores directory exists:', fs.existsSync(storesPath));

// List store files
if (fs.existsSync(storesPath)) {
  const storeFiles = fs.readdirSync(storesPath);
  console.log('Store files:', storeFiles);
}

console.log('Current working directory:', process.cwd());
console.log('Script directory:', __dirname);
