import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Supabaseと通信するための「合鍵」を持ったクライアントを作成
export const supabase = createClient(supabaseUrl, supabaseAnonKey);