import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

interface Database {
  public: {
    Tables: {
      clerk_profiles: {
        Row: {
          clerk_user_id: string;
          email: string;
          name: string;
          image_url: string | null;
          role: string;
          locale: string;
          profile: Json;
          subscription: Json;
          onboarding_completed_at: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          clerk_user_id: string;
          email?: string;
          name?: string;
          image_url?: string | null;
          role?: string;
          locale?: string;
          profile?: Json;
          subscription?: Json;
          onboarding_completed_at?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          clerk_user_id?: string;
          email?: string;
          name?: string;
          image_url?: string | null;
          role?: string;
          locale?: string;
          profile?: Json;
          subscription?: Json;
          onboarding_completed_at?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type ClerkProfileRow = Database['public']['Tables']['clerk_profiles']['Row'];
export type ClerkProfileInsert = Database['public']['Tables']['clerk_profiles']['Insert'];

type SupabaseAdmin = SupabaseClient<Database>;

const globalForSupabase = globalThis as unknown as {
  _fitcoreSupabaseAdmin?: SupabaseAdmin;
};

export function getSupabaseAdmin(): SupabaseAdmin | null {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) return null;

  if (!globalForSupabase._fitcoreSupabaseAdmin) {
    globalForSupabase._fitcoreSupabaseAdmin = createClient<Database>(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return globalForSupabase._fitcoreSupabaseAdmin;
}
