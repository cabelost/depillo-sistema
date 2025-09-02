import { createClient } from '@supabase/supabase-js';

const supabaseUrl = '';
const supabaseKey = '';

export const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;