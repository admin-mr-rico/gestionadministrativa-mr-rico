const fs = require('fs');
const path = require('path');

// Intentar cargar variables desde un archivo .env local si existe
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const parts = trimmed.split('=');
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
    process.env[key] = val;
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL_LOCAL || process.env.SUPABASE_URL_LOCAL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_LOCAL || process.env.SUPABASE_ANON_KEY_LOCAL || '';

const outputPath = path.join(__dirname, 'env.js');
const contents = `window.SUPABASE_URL = '${supabaseUrl.replace(/'/g, "\\'")}';\nwindow.SUPABASE_ANON_KEY = '${supabaseAnonKey.replace(/'/g, "\\'")}';\n`;

fs.writeFileSync(outputPath, contents, { encoding: 'utf8' });
console.log('Generated env.js with Supabase configuration.');
