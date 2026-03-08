const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Setting up auth-server...\n');

// Check if .env exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
    console.log('Creating .env file from .env.example...');
    const envExample = fs.readFileSync(path.join(__dirname, '.env.example'), 'utf8');
    fs.writeFileSync(envPath, envExample);
    console.log('✓ .env file created. Please fill in your Google OAuth credentials.\n');
} else {
    console.log('✓ .env file already exists.\n');
}

// Install dependencies
console.log('Installing dependencies...');
try {
    execSync('npm install', { stdio: 'inherit', cwd: __dirname });
    console.log('\n✓ Dependencies installed successfully!\n');
} catch (error) {
    console.error('\n✗ Error installing dependencies:', error.message);
    process.exit(1);
}

console.log('Setup complete!');
console.log('\nNext steps:');
console.log('1. Edit .env file and add your Google OAuth credentials');
console.log('2. Run: npm start');
console.log('3. Make sure your Google OAuth redirect URI is: http://localhost:8000/auth/google/callback\n');

