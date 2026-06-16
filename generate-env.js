const fs = require('fs');
const path = require('path');

// Leer .env local
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const [key, ...valParts] = trimmed.split('=');
    const val = valParts.join('=').trim().replace(/^['"]|['"]$/g, '');
    process.env[key] = val;
  });
}

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('ERROR: SUPABASE_URL y SUPABASE_ANON_KEY son obligatorias en .env o Vercel ENV.');
  process.exit(1);
}

const outputPath = path.join(__dirname, 'env.js');
const contents = `window.SUPABASE_URL = '${supabaseUrl.replace(/'/g, "\\'")}';\nwindow.SUPABASE_ANON_KEY = '${supabaseAnonKey.replace(/'/g, "\\'")}';\n`;

fs.writeFileSync(outputPath, contents, { encoding: 'utf8' });
console.log('✓ Generated env.js');
