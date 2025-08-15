#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔐 Setting up environment variables...\n');

const envPath = path.join(__dirname, '../.env');
const envExamplePath = path.join(__dirname, '../env.example');

if (fs.existsSync(envPath)) {
  console.log('✅ .env file already exists');
} else {
  try {
    // Copy from env.example
    if (fs.existsSync(envExamplePath)) {
      const exampleContent = fs.readFileSync(envExamplePath, 'utf8');
      fs.writeFileSync(envPath, exampleContent);
      console.log('✅ Created .env file from env.example');
      console.log('📝 Please edit .env and add your actual API keys');
    } else {
      // Create basic .env file
      const basicEnv = `# Environment Variables
# Add your API keys here

# Pexels API for city images
PEXELS_API_KEY=your_pexels_api_key_here
`;
      fs.writeFileSync(envPath, basicEnv);
      console.log('✅ Created basic .env file');
      console.log('📝 Please edit .env and add your actual API keys');
    }
  } catch (error) {
    console.error('❌ Error creating .env file:', error.message);
    process.exit(1);
  }
}

console.log('\n📋 Next steps:');
console.log('1. Edit .env file and add your actual API keys');
console.log('2. For Netlify: Go to Site settings > Environment variables');
console.log('3. Add PEXELS_API_KEY with your actual API key');
console.log('\n🔒 Remember: Never commit .env files to version control!');
