// app/api/properties/[propertyId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPropertyById } from '@/server/repo/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { propertyId: string } }
) {
  const { propertyId } = params;

  if (!propertyId) {
    return NextResponse.json({ error: 'Missing propertyId' }, { status: 400 });
  }

  const property = await getPropertyById(propertyId);

  if (!property) {
    return NextResponse.json({ error: 'Property not found' }, { status: 404 });
  }

  return NextResponse.json({ property });
}
