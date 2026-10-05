import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

/**
 * Creates the store's admin login in Supabase Auth.
 *
 * Credentials are read from the environment — NEVER hardcode them in this file:
 *   ADMIN_EMAIL=...        (in .env.local)
 *   ADMIN_PASSWORD=...     (in .env.local)
 * .env.local is git-ignored. Run from the frontend folder:  node create_admin.mjs
 * These two variables are only used by this one-off script; the website's admin login does not read them,
 * so they do NOT need to be added to Vercel.
 */

// Load .env.local without overriding variables that are already set in the environment.
function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;
  for (const rawLine of fs.readFileSync(file, 'utf-8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}
loadEnvFile(path.resolve('.env.local'));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
const adminEmail = process.env.ADMIN_EMAIL?.trim();
const adminPassword = process.env.ADMIN_PASSWORD; // used as-is; never logged

const missing = [
  ['NEXT_PUBLIC_SUPABASE_URL', supabaseUrl],
  ['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', supabaseKey],
  ['ADMIN_EMAIL', adminEmail],
  ['ADMIN_PASSWORD', adminPassword],
]
  .filter(([, value]) => !value)
  .map(([name]) => name);
if (missing.length > 0) {
  console.error(`Missing environment variable(s): ${missing.join(', ')}. Add them to .env.local (it is git-ignored).`);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdmin() {
  const { data, error } = await supabase.auth.signUp({
    email: adminEmail,
    password: adminPassword,
    options: {
      data: {
        role: 'admin',
        full_name: 'Sushi Admin'
      }
    }
  });

  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('Success:', data.user?.email);
  }
}

createAdmin();
