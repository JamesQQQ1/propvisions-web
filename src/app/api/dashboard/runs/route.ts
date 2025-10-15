// src/app/api/dashboard/runs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, RUNS_TABLE } from '@/lib/supabase-server';
import { parseFilters } from '@/utils/filters';
import { normalizeStatus } from '@/types/dashboard';
import type { RunsResult } from '@/types/dashboard';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filters = parseFilters(Object.fromEntries(searchParams));

    // Build base query
    let query = supabaseAdmin
      .from(RUNS_TABLE)
      .select('*', { count: 'exact' });

    // Apply date filters
    if (filters.from) {
      query = query.gte('started_at', filters.from);
    }
    if (filters.to) {
      query = query.lt('started_at', filters.to + 'T23:59:59');
    }

    // Apply other filters
    if (filters.status) {
      const normalized = normalizeStatus(filters.status);
      if (normalized === 'success') {
        query = query.or('status.eq.completed,status.eq.success');
      } else if (normalized === 'failed') {
        query = query.eq('status', 'failed');
      } else if (normalized === 'processing') {
        query = query.eq('status', 'processing');
      } else if (normalized === 'queued') {
        query = query.is('status', null);
      }
    }
    if (filters.run_id) {
      query = query.eq('run_id', filters.run_id);
    }
    if (filters.property_id) {
      query = query.eq('property_id', filters.property_id);
    }
    if (filters.prop_no) {
      query = query.eq('prop_no', filters.prop_no);
    }
    if (filters.q) {
      // Free-text search on url
      query = query.or(`url.ilike.%${filters.q}%`);
    }

    // Pagination
    const offset = filters.offset || 0;
    const limit = filters.limit || 25;
    query = query.range(offset, offset + limit - 1);

    // Order by most recent first
    query = query.order('started_at', { ascending: false, nullsFirst: false });

    const { data: runs, error, count } = await query;
    if (error) throw error;

    const response: RunsResult = {
      runs: runs || [],
      total: count || 0,
    };

    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('Error in /api/dashboard/runs:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
