// src/app/api/dashboard/ingest/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { parseFilters } from '@/utils/filters';
import { normalizeStatus } from '@/types/dashboard';
import type { IngestResult, IngestJobWithHandoff } from '@/types/dashboard';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filters = parseFilters(Object.fromEntries(searchParams));

    // Build base query
    let query = supabaseAdmin
      .from('ingest_jobs')
      .select('*', { count: 'exact' });

    // Apply date filters
    if (filters.from) {
      query = query.gte('created_at', filters.from);
    }
    if (filters.to) {
      query = query.lt('created_at', filters.to + 'T23:59:59');
    }

    // Apply other filters
    if (filters.batch_label) {
      query = query.eq('batch_label', filters.batch_label);
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
    query = query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false, nullsFirst: false });

    const { data: ingestJobs, error, count } = await query;
    if (error) throw error;

    // For each ingest job, calculate handoff_latency_sec
    // We need to find the first stage run for each run_id
    const jobsWithHandoff: IngestJobWithHandoff[] = [];

    for (const job of ingestJobs || []) {
      let handoff_latency_sec: number | null = null;

      if (job.run_id && job.created_at) {
        // Get the first stage run for this run_id
        const { data: stageRuns, error: stageError } = await supabaseAdmin
          .from('pipeline_stage_runs')
          .select('started_at')
          .eq('run_id', job.run_id)
          .not('started_at', 'is', null)
          .order('started_at', { ascending: true })
          .limit(1);

        if (!stageError && stageRuns && stageRuns.length > 0) {
          const firstStageStarted = stageRuns[0].started_at;
          if (firstStageStarted) {
            // Calculate latency in seconds
            const jobCreated = new Date(job.created_at).getTime();
            const stageStarted = new Date(firstStageStarted).getTime();
            handoff_latency_sec = (stageStarted - jobCreated) / 1000;
          }
        }
      }

      jobsWithHandoff.push({
        ...job,
        handoff_latency_sec,
      });
    }

    const response: IngestResult = {
      jobs: jobsWithHandoff,
      total: count || 0,
    };

    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('Error in /api/dashboard/ingest:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
