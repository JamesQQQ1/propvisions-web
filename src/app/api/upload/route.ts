import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BUCKET = process.env.SUPABASE_UPLOAD_BUCKET || 'property-images';
const N8N_WEBHOOK = process.env.N8N_ROOM_UPLOAD_WEBHOOK!;

export const runtime = 'nodejs'; // ensure Node runtime for formData/file uploads

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const token = String(form.get('token') || '').trim();
    const files = form.getAll('files') as File[];

    if (!token || files.length === 0) {
      return NextResponse.json({ error: 'Token and at least one file are required.' }, { status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // 1) Lookup request row
    const { data: row, error: rowErr } = await supabase
      .from('missing_room_requests')
      .select('id, property_id, room_key, room_label, floor, kind, token_expires_at, status')
      .eq('token', token)
      .maybeSingle();

    if (rowErr || !row) {
      return NextResponse.json({ error: 'Invalid token.' }, { status: 404 });
    }
    const expired = Date.now() > +new Date(row.token_expires_at);
    const okStatus = ['pending','emailed','uploaded','processing'].includes(row.status || '');
    if (expired || !okStatus) {
      return NextResponse.json({ error: 'Link expired or request closed.' }, { status: 410 });
    }

    // 2) Upload files to Storage
    const basePath = `${row.property_id}/${encodeURIComponent(row.room_key)}/${row.id}`;
    const publicUrls: string[] = [];

    for (const f of files.slice(0, 5)) {
      // force a safe filename
      const ext = (f.name?.split('.').pop() || 'jpg').toLowerCase();
      const key = `${basePath}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

      const arrayBuffer = await f.arrayBuffer();
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(key, new Uint8Array(arrayBuffer), {
          cacheControl: '3600',
          upsert: false,
          contentType: f.type || 'image/jpeg',
        });

      if (upErr) {
        return NextResponse.json({ error: 'Upload failed', details: upErr.message }, { status: 500 });
      }

      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(key);
      if (pub?.publicUrl) publicUrls.push(pub.publicUrl);
    }

    if (publicUrls.length === 0) {
      return NextResponse.json({ error: 'No files stored.' }, { status: 500 });
    }

    // 3) Update request row -> uploaded
    await supabase
      .from('missing_room_requests')
      .update({ status: 'uploaded' })
      .eq('id', row.id);

    // 4) Fire n8n webhook with minimal payload (room-only subworkflow)
    await fetch(N8N_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        request_id: row.id,
        property_id: row.property_id,
        room_key: row.room_key,          // e.g., "bedroom::bedroom 2" or "extra::epc_walls"
        kind: row.kind,                  // 'room' | 'epc' | 'roof'
        images: publicUrls               // array of newly uploaded URLs
      })
    }).catch(() => { /* don’t block user on webhook network errors */ });

    // 5) Respond – you can redirect to a “thank you” page
    return NextResponse.json({ ok: true, uploaded: publicUrls.length, urls: publicUrls });

  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 });
  }
}
