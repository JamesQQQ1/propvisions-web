// lib/supabase/queries.ts
import { supabaseAdmin } from '../supabase-server';

export interface MissingRoomRequest {
  id: string;
  property_id: string;
  room_name: string;
  upload_url: string | null;
  token: string | null;
  token_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch missing room requests for a given property_id
 * Returns requests where upload has not been completed (upload_url is still present)
 */
export async function getMissingRoomRequests(
  propertyId: string
): Promise<MissingRoomRequest[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('missing_room_requests')
      .select('*')
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[getMissingRoomRequests] Supabase error:', error);
      return [];
    }

    return (data || []) as MissingRoomRequest[];
  } catch (err) {
    console.error('[getMissingRoomRequests] Unexpected error:', err);
    return [];
  }
}

/**
 * Check if a token is expired
 */
export function isTokenExpired(tokenExpiresAt: string | null): boolean {
  if (!tokenExpiresAt) return true;

  try {
    const expiryDate = new Date(tokenExpiresAt);
    return expiryDate <= new Date();
  } catch {
    return true;
  }
}
