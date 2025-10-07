// app/api/runs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getRunsByPropertyId } from '@/server/repo/supabase';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const propertyId = searchParams.get('property_id');

  if (!propertyId) {
    return NextResponse.json({ error: 'Missing property_id' }, { status: 400 });
  }

  const runs = await getRunsByPropertyId(propertyId);

  return NextResponse.json({ runs });
}
