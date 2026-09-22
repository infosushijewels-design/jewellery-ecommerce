import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envFile = fs.readFileSync(path.resolve('.env.local'), 'utf-8');
const env = Object.fromEntries(
  envFile.split('\n').filter(Boolean).map(line => {
    const [k, ...v] = line.split('=');
    return [k.trim(), v.join('=').trim()];
  })
);

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL.trim();
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.trim();

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdmin() {
  const { data, error } = await supabase.auth.signUp({
    email: 'admin@sushijewels.com',
    password: 'AdminPassword123!',
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
