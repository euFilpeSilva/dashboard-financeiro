const fs = require('fs');
const path = require('path');

const outPath = path.join(__dirname, '..', 'src', 'assets', 'runtime-env.json');

const env = {
  firebase: {
    apiKey: process.env.FIREBASE_API_KEY || 'REPLACE_WITH_YOUR_KEY',
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || 'REPLACE_WITH_YOUR_AUTH_DOMAIN',
    projectId: process.env.FIREBASE_PROJECT_ID || 'REPLACE_WITH_YOUR_PROJECT_ID',
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'REPLACE_WITH_YOUR_STORAGE_BUCKET',
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || 'REPLACE_WITH_YOUR_MESSAGING_SENDER_ID',
    appId: process.env.FIREBASE_APP_ID || 'REPLACE_WITH_YOUR_APP_ID',
    measurementId: process.env.FIREBASE_MEASUREMENT_ID || 'REPLACE_WITH_YOUR_MEASUREMENT_ID'
  },
  enableAnalytics: process.env.ENABLE_ANALYTICS === 'true',
  enableDebug: process.env.ENABLE_DEBUG === 'true'
};

fs.writeFileSync(outPath, JSON.stringify(env, null, 2));
console.log('Wrote runtime env to', outPath);
