// src/app/api/dashboard/overview/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, RUNS_TABLE } from '@/lib/supabase-server';
import { parseFilters } from '@/utils/filters';
import { normalizeStatus } from '@/types/dashboard';
import type { OverviewResponse, OverviewTotals, StageDuration, ErrorFamily, TimeseriesPoint } from '@/types/dashboard';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filters = parseFilters(Object.fromEntries(searchParams));

    // Build base query with date filters
    let runsQuery = supabaseAdmin
      .from(RUNS_TABLE)
      .select('run_id, status, duration_sec, started_at');

    if (filters.from) {
      runsQuery = runsQuery.gte('started_at', filters.from);
    }
    if (filters.to) {
      runsQuery = runsQuery.lt('started_at', filters.to + 'T23:59:59');
    }

    // Apply additional filters
    if (filters.batch_label) {
      // Note: batch_label would need to be on pipeline_runs table or joined
      // For now, we'll skip this filter on runs table
    }
    if (filters.status) {
      const normalized = normalizeStatus(filters.status);
      if (normalized === 'success') {
        runsQuery = runsQuery.or('status.eq.completed,status.eq.success');
      } else if (normalized === 'failed') {
        runsQuery = runsQuery.eq('status', 'failed');
      } else if (normalized === 'processing') {
        runsQuery = runsQuery.eq('status', 'processing');
      } else if (normalized === 'queued') {
        runsQuery = runsQuery.is('status', null);
      }
    }
    if (filters.run_id) {
      runsQuery = runsQuery.eq('run_id', filters.run_id);
    }
    if (filters.property_id) {
      runsQuery = runsQuery.eq('property_id', filters.property_id);
    }
    if (filters.prop_no) {
      runsQuery = runsQuery.eq('prop_no', filters.prop_no);
    }

    const { data: runs, error: runsError } = await runsQuery;
    if (runsError) throw runsError;

    // Calculate totals
    const totalRuns = runs?.length || 0;
    const successRuns = runs?.filter(r => {
      const norm = normalizeStatus(r.status);
      return norm === 'success';
    }).length || 0;
    const successRate = totalRuns > 0 ? (successRuns / totalRuns) * 100 : 0;

    // Calculate p50 and p95 duration
    const durations = runs
      ?.map(r => r.duration_sec)
      .filter((d): d is number => d !== null && d !== undefined)
      .sort((a, b) => a - b) || [];

    const p50_duration_sec = durations.length > 0
      ? durations[Math.floor(durations.length * 0.5)]
      : null;
    const p95_duration_sec = durations.length > 0
      ? durations[Math.floor(durations.length * 0.95)]
      : null;

    const totals: OverviewTotals = {
      total_runs: totalRuns,
      success_rate: successRate,
      p50_duration_sec,
      p95_duration_sec,
      avg_handoff_latency_sec: null, // Will be calculated after stage durations
      top_stage_by_time: null, // Will be calculated after stage durations
    };

    // Get stage durations
    let stagesQuery = supabaseAdmin
      .from('pipeline_stage_runs')
      .select('stage, duration_sec');

    if (filters.from) {
      stagesQuery = stagesQuery.gte('started_at', filters.from);
    }
    if (filters.to) {
      stagesQuery = stagesQuery.lt('started_at', filters.to + 'T23:59:59');
    }
    if (filters.stage) {
      if (Array.isArray(filters.stage)) {
        stagesQuery = stagesQuery.in('stage', filters.stage);
      } else {
        stagesQuery = stagesQuery.eq('stage', filters.stage);
      }
    }

    const { data: stageRuns, error: stagesError } = await stagesQuery;
    if (stagesError) throw stagesError;

    // Aggregate stage durations
    const stageMap = new Map<string, number[]>();
    stageRuns?.forEach(sr => {
      if (sr.stage && sr.duration_sec !== null) {
        if (!stageMap.has(sr.stage)) {
          stageMap.set(sr.stage, []);
        }
        stageMap.get(sr.stage)!.push(sr.duration_sec);
      }
    });

    const stage_durations: StageDuration[] = Array.from(stageMap.entries()).map(([stage, durations]) => ({
      stage,
      avg_duration_sec: durations.reduce((sum, d) => sum + d, 0) / durations.length,
    }));

    // Calculate top stage by time (total time spent across all runs)
    const top_stage_by_time = stage_durations.length > 0
      ? stage_durations.reduce((max, curr) => curr.avg_duration_sec > max.avg_duration_sec ? curr : max).stage
      : null;

    // Calculate avg handoff latency (ingest_jobs.created_at -> first pipeline_stage_run.started_at)
    let ingestQuery = supabaseAdmin
      .from('ingest_jobs')
      .select('created_at, run_id')
      .not('run_id', 'is', null);

    if (filters.from) {
      ingestQuery = ingestQuery.gte('created_at', filters.from);
    }
    if (filters.to) {
      ingestQuery = ingestQuery.lt('created_at', filters.to + 'T23:59:59');
    }

    const { data: ingestJobs, error: ingestError } = await ingestQuery.limit(500);
    if (ingestError) console.error('Error fetching ingest jobs for handoff latency:', ingestError);

    let avg_handoff_latency_sec: number | null = null;
    if (ingestJobs && ingestJobs.length > 0) {
      const runIds = ingestJobs.map(j => j.run_id).filter((id): id is string => !!id);
      if (runIds.length > 0) {
        const { data: firstStages } = await supabaseAdmin
          .from('pipeline_stage_runs')
          .select('run_id, started_at')
          .in('run_id', runIds)
          .order('started_at', { ascending: true });

        if (firstStages && firstStages.length > 0) {
          const handoffLatencies: number[] = [];
          ingestJobs.forEach(job => {
            const firstStage = firstStages.find(s => s.run_id === job.run_id);
            if (firstStage && job.created_at && firstStage.started_at) {
              const created = new Date(job.created_at).getTime();
              const started = new Date(firstStage.started_at).getTime();
              const diff = (started - created) / 1000; // seconds
              if (diff >= 0) handoffLatencies.push(diff);
            }
          });
          avg_handoff_latency_sec = handoffLatencies.length > 0
            ? handoffLatencies.reduce((sum, l) => sum + l, 0) / handoffLatencies.length
            : null;
        }
      }
    }

    // Get top errors
    let errorsQuery = supabaseAdmin
      .from('pipeline_errors')
      .select('error_code');

    if (filters.from) {
      errorsQuery = errorsQuery.gte('created_at', filters.from);
    }
    if (filters.to) {
      errorsQuery = errorsQuery.lt('created_at', filters.to + 'T23:59:59');
    }
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

    const { data: errors, error: errorsError } = await errorsQuery;
    if (errorsError) throw errorsError;

    // Count by error_code
    const errorCodeMap = new Map<string, number>();
    errors?.forEach(e => {
      if (e.error_code) {
        errorCodeMap.set(e.error_code, (errorCodeMap.get(e.error_code) || 0) + 1);
      }
    });

    const top_errors: ErrorFamily[] = Array.from(errorCodeMap.entries())
      .map(([error_code, count]) => ({ error_code, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Build timeseries
    const timeseriesMap = new Map<string, { runs: number; success: number; failed: number }>();
    runs?.forEach(r => {
      if (r.started_at) {
        const date = r.started_at.split('T')[0];
        if (!timeseriesMap.has(date)) {
          timeseriesMap.set(date, { runs: 0, success: 0, failed: 0 });
        }
        const entry = timeseriesMap.get(date)!;
        entry.runs += 1;
        const norm = normalizeStatus(r.status);
        if (norm === 'success') {
          entry.success += 1;
        } else if (norm === 'failed') {
          entry.failed += 1;
        }
      }
    });

    const timeseries: TimeseriesPoint[] = Array.from(timeseriesMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Update totals with calculated KPIs
    totals.avg_handoff_latency_sec = avg_handoff_latency_sec;
    totals.top_stage_by_time = top_stage_by_time;

    const response: OverviewResponse = {
      totals,
      stage_durations,
      top_errors,
      timeseries,
    };

    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('Error in /api/dashboard/overview:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
