import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { loadEnv } from 'vite';

// Check emitted JavaScript, not just the presence of an environment file.
const env = loadEnv('production', process.cwd(), 'VITE_');
const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY;
if (!url || !key || url.includes('YOUR_PROJECT')) {
  throw new Error('Production Supabase configuration is missing. Refusing to deploy demo mode.');
}
const directory = 'dist/assets';
const javascript = readdirSync(directory).filter(name => name.endsWith('.js'))
  .map(name => readFileSync(join(directory, name), 'utf8')).join('\n');
if (!javascript.includes(url) || !javascript.includes(key)) {
  throw new Error('Built site is missing its Supabase connection. Deployment blocked.');
}
console.log('Production bundle contains the configured Supabase URL and public key.');
