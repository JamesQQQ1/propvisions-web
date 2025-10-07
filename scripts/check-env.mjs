#!/usr/bin/env node
// scripts/check-env.mjs
import { readFileSync } from 'fs';

// Load .env.local
try {
  const env = readFileSync('.env.local', 'utf8');
  env.split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val.length) process.env[key] = val.join('=');
  });
} catch {}

const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

const missing = required.filter(k => !process.env[k]);

if (missing.length > 0) {
  console.error('❌ Missing required env vars:', missing.join(', '));
  console.error('\nAdd to Vercel:\n  Project Settings → Environment Variables\n  Select all environments (Production, Preview, Development)\n');
  process.exit(1);
}

console.log('✅ All required Supabase env vars present');
console.log('  URL:', process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 40) + '...');
console.log('  Anon:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 20) + '...');
console.log('  Service:', process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 20) + '...');
console.log('  Realtime:', process.env.NEXT_PUBLIC_REALTIME_ENABLED || 'disabled');
