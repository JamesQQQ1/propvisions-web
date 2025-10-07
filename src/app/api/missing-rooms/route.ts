// app/api/missing-rooms/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getMissingRoomRequests } from '@/server/repo/supabase';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const propertyId = searchParams.get('property_id');
  const status = searchParams.get('status');

  if (!propertyId || typeof propertyId !== 'string' || propertyId.trim() === '') {
    return NextResponse.json(
      { error: 'Missing or invalid property_id parameter' },
      { status: 400 }
    );
  }

  const onlyPending = status === 'pending' || !status;
  const items = await getMissingRoomRequests(propertyId, onlyPending);

  return NextResponse.json({ items });
}
