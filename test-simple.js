// Simple test to check if Node.js is working
console.log('✅ Node.js is working!');
console.log('📦 Current directory:', __dirname);
console.log('🟢 Ready to install dependencies');

// Check if we can import required modules
try {
    require('express');
    console.log('✅ Express is installed');
} catch (e) {
    console.log('❌ Express is not installed. Run: npm install express');
}

try {
    require('mysql2');
    console.log('✅ MySQL2 is installed');
} catch (e) {
    console.log('❌ MySQL2 is not installed. Run: npm install mysql2');
}