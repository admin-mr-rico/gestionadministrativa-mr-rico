const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

const outputPath = path.join(__dirname, 'env.js');
const contents = `window.SUPABASE_URL = '${supabaseUrl.replace(/'/g, "\\'")}';\nwindow.SUPABASE_ANON_KEY = '${supabaseAnonKey.replace(/'/g, "\\'")}';\n`;

fs.writeFileSync(outputPath, contents, { encoding: 'utf8' });
console.log('Generated env.js with Supabase configuration.');
