// src/app/api/dashboard/errors/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { parseFilters } from '@/utils/filters';
import type { ErrorsResult, ErrorFamily } from '@/types/dashboard';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filters = parseFilters(Object.fromEntries(searchParams));

    // Build base query for paginated errors
    let errorsQuery = supabaseAdmin
      .from('pipeline_errors')
      .select('*', { count: 'exact' });

    // Apply date filters
    if (filters.from) {
      errorsQuery = errorsQuery.gte('created_at', filters.from);
    }
    if (filters.to) {
      errorsQuery = errorsQuery.lt('created_at', filters.to + 'T23:59:59');
    }

    // Apply other filters
    if (filters.error_code) {
      errorsQuery = errorsQuery.eq('error_code', filters.error_code);
    }
    if (filters.stage) {
      if (Array.isArray(filters.stage)) {
        errorsQuery = errorsQuery.in('stage', filters.stage);
      } else {
        errorsQuery = errorsQuery.eq('stage', filters.stage);
      }
    }
    if (filters.run_id) {
      errorsQuery = errorsQuery.eq('run_id', filters.run_id);
    }
    if (filters.property_id) {
      errorsQuery = errorsQuery.eq('property_id', filters.property_id);
    }
    if (filters.prop_no) {
      errorsQuery = errorsQuery.eq('prop_no', filters.prop_no);
    }
    if (filters.q) {
      // Free-text search on error_url or message_short
      errorsQuery = errorsQuery.or(`error_url.ilike.%${filters.q}%,message_short.ilike.%${filters.q}%`);
    }

    // Pagination
    const offset = filters.offset || 0;
    const limit = filters.limit || 25;
    errorsQuery = errorsQuery
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false, nullsFirst: false });

    const { data: errors, error: errorsError, count } = await errorsQuery;
    if (errorsError) throw errorsError;

    // Build aggregation query for by_code and by_stage
    let aggregationQuery = supabaseAdmin
      .from('pipeline_errors')
      .select('error_code, stage');

    if (filters.from) {
      aggregationQuery = aggregationQuery.gte('created_at', filters.from);
    }
    if (filters.to) {
      aggregationQuery = aggregationQuery.lt('created_at', filters.to + 'T23:59:59');
    }
    if (filters.error_code) {
      aggregationQuery = aggregationQuery.eq('error_code', filters.error_code);
    }
    if (filters.stage) {
      if (Array.isArray(filters.stage)) {
        aggregationQuery = aggregationQuery.in('stage', filters.stage);
      } else {
        aggregationQuery = aggregationQuery.eq('stage', filters.stage);
      }
    }
    if (filters.run_id) {
      aggregationQuery = aggregationQuery.eq('run_id', filters.run_id);
    }
    if (filters.property_id) {
      aggregationQuery = aggregationQuery.eq('property_id', filters.property_id);
    }
    if (filters.prop_no) {
      aggregationQuery = aggregationQuery.eq('prop_no', filters.prop_no);
    }

    const { data: allErrors, error: aggError } = await aggregationQuery;
    if (aggError) throw aggError;

    // Group by error_code
    const errorCodeMap = new Map<string, number>();
    allErrors?.forEach(e => {
      if (e.error_code) {
        errorCodeMap.set(e.error_code, (errorCodeMap.get(e.error_code) || 0) + 1);
      }
    });

    const by_code: ErrorFamily[] = Array.from(errorCodeMap.entries())
      .map(([error_code, count]) => ({ error_code, count }))
      .sort((a, b) => b.count - a.count);

    // Group by stage
    const stageMap = new Map<string, number>();
    allErrors?.forEach(e => {
      if (e.stage) {
        stageMap.set(e.stage, (stageMap.get(e.stage) || 0) + 1);
      }
    });

    const by_stage = Array.from(stageMap.entries())
      .map(([stage, count]) => ({ stage, count }))
      .sort((a, b) => b.count - a.count);

    const response: ErrorsResult = {
      errors: errors || [],
      total: count || 0,
      by_code,
      by_stage,
    };

    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('Error in /api/dashboard/errors:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
