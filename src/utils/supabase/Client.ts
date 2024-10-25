import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SECRET || '';

if (supabaseUrl === '' || supabaseKey === '') {
  throw new Error('Supabase URL or Key not set');
}

export function serviceClient() {
  return createClient(supabaseUrl, supabaseKey);
}
