import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

export const isSupabaseConfigured = () => {
  return Boolean(
    supabaseUrl &&
    supabaseUrl.trim() !== '' &&
    supabaseUrl.startsWith('https://') &&
    supabaseKey &&
    supabaseKey.trim() !== ''
  );
};

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export const getSupabaseConfigStatus = () => {
  return {
    configured: isSupabaseConfigured(),
    url: supabaseUrl ? `${supabaseUrl.slice(0, 18)}...` : 'Not set',
    hasKey: Boolean(supabaseKey)
  };
};
