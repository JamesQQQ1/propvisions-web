// src/app/api/dashboard/batches/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    // Fetch distinct batch labels from ingest_jobs
    const { data: batches, error } = await supabaseAdmin
      .from('ingest_jobs')
      .select('batch_label, created_at')
      .not('batch_label', 'is', null)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Deduplicate and sort by most recent
    const uniqueBatches = Array.from(
      new Map(
        batches?.map(b => [b.batch_label, b.created_at])
      ).entries()
    ).map(([batch_label, created_at]) => ({ batch_label, created_at }))
     .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
     .slice(0, 100); // Limit to 100 most recent

    return NextResponse.json(
      { batches: uniqueBatches },
      { headers: { 'Cache-Control': 'public, max-age=60' } }
    );
  } catch (error) {
    console.error('Error in /api/dashboard/batches:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error', batches: [] },
      { status: 500 }
    );
  }
}
