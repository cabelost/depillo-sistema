
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = '';
const supabaseKey = '';

let supabaseInstance = null;
if (supabaseUrl && supabaseKey) {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseKey);
  } catch (error) {
    console.error("Error creating Supabase client:", error);
  }
}

export const supabase = supabaseInstance;
