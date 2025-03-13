/**
 * Script to generate a secure application key
 */
const crypto = require('crypto');

function generateAppKey() {
    const key = crypto.randomBytes(32).toString('base64');
    console.log('Generated APP_KEY:');
    console.log(key);
    console.log('\nAdd this to your .env file:');
    console.log(`APP_KEY="${key}"`);
}

generateAppKey(); 