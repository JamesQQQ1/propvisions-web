#!/usr/bin/env node
// scripts/check-env-usage.cjs
const { execSync, readFileSync } = require('node:fs');
const fs = require('node:fs');

function grep(pattern) {
  try {
    return execSync(pattern, { stdio: 'pipe', encoding: 'utf8' }).toString().trim();
  } catch {
    return '';
  }
}

function isClientComponent(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.includes("'use client'") || content.includes('"use client"');
  } catch {
    return false;
  }
}

const candidates = [
  grep(`grep -r "createClient(" src/app src/components 2>/dev/null | grep -v ".next" | grep -v "/api/" | grep -v "route.ts" || true`),
]
  .filter(Boolean)
  .flatMap(s => s.split('\n'))
  .filter(Boolean)
  .map(line => {
    const [filePath] = line.split(':');
    return { line, filePath };
  })
  .filter(({ filePath }) => isClientComponent(filePath))
  .map(({ line }) => line);

const offenders = candidates;

if (offenders.length) {
  console.error('\n[ERROR] Forbidden Supabase usage in FE files:\n' + offenders.join('\n'));
  process.exit(1);
}

console.log('[OK] FE Supabase usage clean.');
