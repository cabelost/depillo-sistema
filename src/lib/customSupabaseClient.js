import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iwecndfujvacbrdiwlmd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3ZWNuZGZ1anZhY2JyZGl3bG1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2NzkyMzEsImV4cCI6MjA2OTI1NTIzMX0.OoV9oTrmEnqqqCN4dB5ORvsr4PmgD4Dij7NwliGvFFg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);