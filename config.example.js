// Oracle11 Configuration
// Copy this file to config.js and fill in your values

const CONFIG = {
  // JSONBin.io settings
  JSONBIN_API_KEY: 'YOUR_JSONBIN_API_KEY',
  JSONBIN_BIN_ID: 'YOUR_JSONBIN_BIN_ID',

  // Admin password hash (SHA-256 of your chosen password)
  // Generate with: crypto.subtle.digest('SHA-256', new TextEncoder().encode('your-password'))
  //   .then(h => console.log(Array.from(new Uint8Array(h)).map(b => b.toString(16).padStart(2,'0')).join('')))
  ADMIN_PASSWORD_HASH: 'YOUR_ADMIN_PASSWORD_SHA256_HASH',

  // App settings
  APP_NAME: 'Oracle11',
  APP_TITLE: 'Secret Santa Oracle'
};

// Freeze config to prevent accidental modification
Object.freeze(CONFIG);
