import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { BrandId } from '../types/brand';

// Tipuri pentru database
export interface Database {
  public: {
    Tables: {
      brands: {
        Row: {
          id: string;
          name: string;
          domain: string;
          theme_config: any;
          features: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          domain: string;
          theme_config: any;
          features: string[];
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          domain?: string;
          theme_config?: any;
          features?: string[];
          created_at?: string;
        };
      };
      prompts: {
        Row: {
          id: string;
          brand_id: string;
          title: string;
          slug: string;
          cognitive_category: string;
          difficulty_tier: string;
          required_tier: string;
          preview_content: string;
          full_content: string;
          implementation_guide: string | null;
          use_cases: any;
          meta_tags: string[];
          cognitive_depth_score: number;
          pattern_complexity: number;
          meaning_layers: string[];
          anti_surface_features: string[];
          base_price_cents: number;
          digital_root: number;
          meta_title: string | null;
          meta_description: string | null;
          keywords: string[];
          created_at: string;
          updated_at: string;
          published_at: string | null;
          is_published: boolean;
          quality_score: number;
        };
        Insert: {
          id?: string;
          brand_id: string;
          title: string;
          slug: string;
          cognitive_category: string;
          difficulty_tier: string;
          required_tier?: string;
          preview_content: string;
          full_content: string;
          implementation_guide?: string | null;
          use_cases?: any;
          meta_tags?: string[];
          cognitive_depth_score: number;
          pattern_complexity: number;
          meaning_layers?: string[];
          anti_surface_features?: string[];
          base_price_cents: number;
          digital_root?: number;
          meta_title?: string | null;
          meta_description?: string | null;
          keywords?: string[];
          created_at?: string;
          updated_at?: string;
          published_at?: string | null;
          is_published?: boolean;
          quality_score?: number;
        };
        Update: {
          id?: string;
          brand_id?: string;
          title?: string;
          slug?: string;
          cognitive_category?: string;
          difficulty_tier?: string;
          required_tier?: string;
          preview_content?: string;
          full_content?: string;
          implementation_guide?: string | null;
          use_cases?: any;
          meta_tags?: string[];
          cognitive_depth_score?: number;
          pattern_complexity?: number;
          meaning_layers?: string[];
          anti_surface_features?: string[];
          base_price_cents?: number;
          digital_root?: number;
          meta_title?: string | null;
          meta_description?: string | null;
          keywords?: string[];
          created_at?: string;
          updated_at?: string;
          published_at?: string | null;
          is_published?: boolean;
          quality_score?: number;
        };
      };
      bundles: {
        Row: {
          id: string;
          brand_id: string;
          name: string;
          description: string;
          price_cents: number;
          features: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          brand_id: string;
          name: string;
          description: string;
          price_cents: number;
          features: string[];
          created_at?: string;
        };
        Update: {
          id?: string;
          brand_id?: string;
          name?: string;
          description?: string;
          price_cents?: number;
          features?: string[];
          created_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          brand_id: string;
          email: string;
          tier: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          brand_id: string;
          email: string;
          tier?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          brand_id?: string;
          email?: string;
          tier?: string;
          created_at?: string;
        };
      };
    };
  };
}

// Client-side client (pentru componente)
export const createClientSideClient = (): SupabaseClient<Database> => {
  return createClientComponentClient<Database>();
};

// Client cu context brand (pentru server-side)
export const createBrandedClient = (brandId: BrandId): SupabaseClient<Database> => {
  const client = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Setează contextul brand-ului pentru RLS
  client.auth.onAuthStateChange((event, session) => {
    if (session) {
      // Setează brand_id în context pentru RLS policies
      client.rpc('set_brand_context', { brand_id: brandId });
    }
  });

  return client;
};

// Client cu service role (pentru admin operations)
export const createServiceClient = (): SupabaseClient<Database> => {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

// Hook pentru a obține clientul cu brand context
export const useSupabaseClient = (brandId: BrandId) => {
  return createBrandedClient(brandId);
};

// Funcții helper pentru brand-specific operations
export const getBrandPrompts = async (client: SupabaseClient<Database>, brandId: BrandId) => {
  const { data, error } = await client
    .from('prompts')
    .select('*')
    .eq('brand_id', brandId)
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const getBrandBundles = async (client: SupabaseClient<Database>, brandId: BrandId) => {
  const { data, error } = await client
    .from('bundles')
    .select('*')
    .eq('brand_id', brandId)
    .order('price_cents', { ascending: true });

  if (error) throw error;
  return data;
};

export const getBrandUsers = async (client: SupabaseClient<Database>, brandId: BrandId) => {
  const { data, error } = await client
    .from('users')
    .select('*')
    .eq('brand_id', brandId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};
