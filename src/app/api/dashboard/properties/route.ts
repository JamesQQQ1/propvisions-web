// src/app/api/dashboard/properties/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { parseFilters } from '@/utils/filters';
import type { PropertiesResult } from '@/types/dashboard';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filters = parseFilters(Object.fromEntries(searchParams));

    // Build base query - select headline fields only
    let query = supabaseAdmin
      .from('properties')
      .select('property_id, run_id, property_title, address, postcode, guide_price_gbp, monthly_rent_gbp, property_total_with_vat, property_pdf', { count: 'exact' });

    // Note: properties table doesn't have created_at, so date filtering may not apply
    // If there's a way to filter by date (e.g., via joined runs table), it would go here

    // Apply filters
    if (filters.property_id) {
      query = query.eq('property_id', filters.property_id);
    }
    if (filters.run_id) {
      query = query.eq('run_id', filters.run_id);
    }
    if (filters.q) {
      // Free-text search on address or property_title
      query = query.or(`address.ilike.%${filters.q}%,property_title.ilike.%${filters.q}%`);
    }

    // Pagination
    const offset = filters.offset || 0;
    const limit = filters.limit || 25;
    query = query.range(offset, offset + limit - 1);

    // Order by property_id (or another suitable field)
    query = query.order('property_id', { ascending: false });

    const { data: properties, error, count } = await query;
    if (error) throw error;

    const response: PropertiesResult = {
      properties: properties || [],
      total: count || 0,
    };

    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('Error in /api/dashboard/properties:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
