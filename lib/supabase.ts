import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Client-side Supabase client (for use in components)
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Server-side Supabase client with Clerk authentication
export async function getSupabaseServer() {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error('User not authenticated');
  }

  // Create a Supabase client with custom auth header
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        // Pass Clerk user ID as a custom claim for RLS
        'x-user-id': userId,
      },
    },
  });

  return { supabase, userId };
}