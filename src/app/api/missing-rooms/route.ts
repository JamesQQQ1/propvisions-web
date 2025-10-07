// app/api/missing-rooms/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getMissingRoomRequests } from '@/lib/supabase/queries';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const propertyId = searchParams.get('property_id');

  if (!propertyId || typeof propertyId !== 'string' || propertyId.trim() === '') {
    return NextResponse.json(
      { error: 'Missing or invalid property_id parameter' },
      { status: 400 }
    );
  }

  try {
    const requests = await getMissingRoomRequests(propertyId);
    return NextResponse.json(requests);
  } catch (error) {
    console.error('[api/missing-rooms] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch missing room requests' },
      { status: 500 }
    );
  }
}
