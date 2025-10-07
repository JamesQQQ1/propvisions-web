// app/api/runs/[runId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getRunById } from '@/server/repo/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { runId: string } }
) {
  const { runId } = params;

  if (!runId) {
    return NextResponse.json({ error: 'Missing runId' }, { status: 400 });
  }

  const run = await getRunById(runId);

  if (!run) {
    return NextResponse.json({ error: 'Run not found' }, { status: 404 });
  }

  return NextResponse.json({ run });
}
