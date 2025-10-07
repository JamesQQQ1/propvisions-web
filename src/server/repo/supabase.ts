// server/repo/supabase.ts - Server-only data access layer
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_KEY) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (server)');
}

const supabase: SupabaseClient = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

// Types
export interface PropertyRow {
  property_id: string;
  property_title?: string | null;
  address?: string | null;
  postcode?: string | null;
  property_type?: string | null;
  tenure?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  receptions?: number | null;
  listing_url?: string | null;
  listing_images?: string[] | null;
  floorplan_urls?: string[] | null;
  epc_image_urls?: string[] | null;
  images_map?: Record<string, string> | null;
  price_gbp?: number | null;
  guide_price_gbp?: number | null;
  asking_price_gbp?: number | null;
  purchase_price_gbp?: number | null;
  monthly_rent_gbp?: number | null;
  annual_rent_gbp?: number | null;
  property_total_without_vat?: number | null;
  property_total_with_vat?: number | null;
  scenarios?: any;
  summary?: any;
  [key: string]: any;
}

export interface RunRow {
  run_id: string;
  property_id?: string | null;
  status?: string | null;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface MissingRoomRequestRow {
  id: string;
  property_id: string;
  room_name: string;
  upload_url?: string | null;
  token?: string | null;
  token_expires_at?: string | null;
  status?: string | null;
  created_at: string;
  updated_at: string;
}

// Queries
export async function getPropertyById(propertyId: string): Promise<PropertyRow | null> {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('property_id', propertyId)
    .maybeSingle();

  if (error) {
    console.error('[repo] getPropertyById error:', error);
    return null;
  }

  return data;
}

export async function getRunById(runId: string): Promise<RunRow | null> {
  const { data, error } = await supabase
    .from('runs')
    .select('*')
    .eq('run_id', runId)
    .maybeSingle();

  if (error) {
    console.error('[repo] getRunById error:', error);
    return null;
  }

  return data;
}

export async function getRunsByPropertyId(propertyId: string): Promise<RunRow[]> {
  const { data, error } = await supabase
    .from('runs')
    .select('*')
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[repo] getRunsByPropertyId error:', error);
    return [];
  }

  return data || [];
}

export async function getMissingRoomRequests(
  propertyId: string,
  onlyPending = true
): Promise<MissingRoomRequestRow[]> {
  let query = supabase
    .from('missing_room_requests')
    .select('*')
    .eq('property_id', propertyId);

  if (onlyPending) {
    query = query.eq('status', 'pending');
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('[repo] getMissingRoomRequests error:', error);
    return [];
  }

  return data || [];
}

// Re-export client for legacy compatibility
export { supabase };
