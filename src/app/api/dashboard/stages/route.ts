// src/app/api/dashboard/stages/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { parseFilters } from '@/utils/filters';
import { normalizeStatus } from '@/types/dashboard';
import type { StagesResult, StageStats } from '@/types/dashboard';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filters = parseFilters(Object.fromEntries(searchParams));

    // Build base query
    let query = supabaseAdmin
      .from('pipeline_stage_runs')
      .select('*', { count: 'exact' });

    // Apply date filters
    if (filters.from) {
      query = query.gte('started_at', filters.from);
    }
    if (filters.to) {
      query = query.lt('started_at', filters.to + 'T23:59:59');
    }

    // Apply other filters
    if (filters.stage) {
      if (Array.isArray(filters.stage)) {
        query = query.in('stage', filters.stage);
      } else {
        query = query.eq('stage', filters.stage);
      }
    }
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
    if (filters.prop_no) {
      query = query.eq('prop_no', filters.prop_no);
    }

    // Check if raw mode
    if (filters.raw === '1') {
      // Return paginated raw rows
      const offset = filters.offset || 0;
      const limit = filters.limit || 25;
      query = query
        .range(offset, offset + limit - 1)
        .order('started_at', { ascending: false, nullsFirst: false });

      const { data: rows, error, count } = await query;
      if (error) throw error;

      const response: StagesResult = {
        stats: [],
        rows: rows || [],
        total: count || 0,
      };

      return NextResponse.json(response, {
        headers: { 'Cache-Control': 'no-store' },
      });
    }

    // Otherwise, return aggregated stats
    const { data: stageRuns, error } = await query;
    if (error) throw error;

    // Group by stage and calculate stats
    const stageMap = new Map<string, {
      durations: number[];
      successCount: number;
      totalCount: number;
    }>();

    stageRuns?.forEach(sr => {
      if (!sr.stage) return;

      if (!stageMap.has(sr.stage)) {
        stageMap.set(sr.stage, { durations: [], successCount: 0, totalCount: 0 });
      }

      const entry = stageMap.get(sr.stage)!;
      entry.totalCount += 1;

      if (sr.duration_sec !== null) {
        entry.durations.push(sr.duration_sec);
      }

      const normalized = normalizeStatus(sr.status);
      if (normalized === 'success') {
        entry.successCount += 1;
      }
    });

    const stats: StageStats[] = Array.from(stageMap.entries()).map(([stage, data]) => {
      const sortedDurations = data.durations.sort((a, b) => a - b);
      const avg_duration_sec = data.durations.length > 0
        ? data.durations.reduce((sum, d) => sum + d, 0) / data.durations.length
        : 0;
      const p95_duration_sec = sortedDurations.length > 0
        ? sortedDurations[Math.floor(sortedDurations.length * 0.95)]
        : null;
      const success_rate = data.totalCount > 0
        ? (data.successCount / data.totalCount) * 100
        : 0;

      return {
        stage,
        avg_duration_sec,
        p95_duration_sec,
        success_rate,
        total_count: data.totalCount,
      };
    });

    const response: StagesResult = {
      stats,
    };

    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('Error in /api/dashboard/stages:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
