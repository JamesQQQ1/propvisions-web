// app/api/upload/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BUCKET = process.env.SUPABASE_UPLOAD_BUCKET || 'property-images';
const N8N_WEBHOOK = process.env.N8N_ROOM_UPLOAD_WEBHOOK!;

type RequestRow = {
  id: string;
  property_id: string;
  room_key: string;
  room_label: string | null;
  floor: string | null;
  kind: 'room' | 'epc' | 'roof';
  token_expires_at: string;
  status: string | null;
};

function decodePathPart(s: string) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

async function fireWebhookOnce(payload: any, tries = 0): Promise<void> {
  try {
    const res = await fetch(N8N_WEBHOOK, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`n8n ${res.status}`);
  } catch (err) {
    if (tries >= 2) throw err;
    await new Promise((r) => setTimeout(r, 1000 * (tries + 1)));
    return fireWebhookOnce(payload, tries + 1);
  }
}

export async function POST(req: Request) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Supabase env missing' }, { status: 500 });
  }
  if (!N8N_WEBHOOK) {
    return NextResponse.json({ error: 'N8N_ROOM_UPLOAD_WEBHOOK not set' }, { status: 500 });
  }

  try {
    const form = await req.formData();
    const token = String(form.get('token') || '').trim();
    const files = form.getAll('files') as File[];

    if (!token || files.length === 0) {
      return NextResponse.json(
        { error: 'Token and at least one file are required.' },
        { status: 400 },
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // 1) Lookup request
    const { data: row, error: rowErr } = await supabase
      .from('missing_room_requests')
      .select(
        'id, property_id, room_key, room_label, floor, kind, token_expires_at, status',
      )
      .eq('token', token)
      .maybeSingle<RequestRow>();

    if (rowErr || !row) {
      return NextResponse.json({ error: 'Invalid token.' }, { status: 404 });
    }

    const expired = Date.now() > +new Date(row.token_expires_at);
    const okStatus = ['pending', 'emailed', 'uploaded', 'processing'].includes(
      row.status || '',
    );
    if (expired || !okStatus) {
      return NextResponse.json(
        { error: 'Link expired or request closed.' },
        { status: 410 },
      );
    }

    // 2) Upload to Storage
    const basePath = `${row.property_id}/${row.room_key}/${row.id}`;
    const publicUrls: string[] = [];
    const storagePaths: string[] = [];

    for (const f of files.slice(0, 5)) {
      const ext = (f.name?.split('.').pop() || 'jpg').toLowerCase();
      const key = `${basePath}/${Date.now()}_${Math.random()
        .toString(36)
        .slice(2)}.${ext}`;

      const arrayBuffer = await f.arrayBuffer();
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(key, new Uint8Array(arrayBuffer), {
          cacheControl: '3600',
          upsert: false,
          contentType: f.type || 'image/jpeg',
        });

      if (upErr) {
        return NextResponse.json(
          { error: 'Upload failed', details: upErr.message },
          { status: 500 },
        );
      }

      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(key);
      if (pub?.publicUrl) {
        publicUrls.push(pub.publicUrl);
        const anchor = '/storage/v1/object/public/';
        const idx = pub.publicUrl.indexOf(anchor);
        storagePaths.push(
          idx !== -1
            ? decodePathPart(pub.publicUrl.substring(idx + anchor.length))
            : `${BUCKET}/${key}`,
        );
      }
    }

    if (publicUrls.length === 0) {
      return NextResponse.json({ error: 'No files stored.' }, { status: 500 });
    }

    // 3) Transition request -> processing
    await supabase
      .from('missing_room_requests')
      .update({ status: 'processing', updated_at: new Date().toISOString() })
      .eq('id', row.id);

    // 4) Insert per-image rows
    const uploadRows = storagePaths.map((storage_path, i) => ({
      request_id: row.id,
      property_id: row.property_id,
      room_key: row.room_key,
      kind: row.kind,
      public_url: publicUrls[i],
      storage_path,
      status: 'queued',
    }));

    const { data: inserted, error: insErr } = await supabase
      .from('missing_room_uploads')
      .insert(uploadRows)
      .select();

    if (insErr) {
      return NextResponse.json(
        { error: 'DB insert failed', details: insErr.message },
        { status: 500 },
      );
    }

    // 5) Fire n8n once per image
    const basePayload = {
      request_id: row.id,
      property_id: row.property_id,
      room_key: row.room_key,
      room_label: row.room_label,
      floor: row.floor,
      kind: row.kind,
    };

    await Promise.all(
      inserted.map((u: any, idx: number) =>
        fireWebhookOnce({
          ...basePayload,
          upload_id: u.id,
          public_url: u.public_url,
          storage_path: u.storage_path,
          ordinal: idx + 1,
          total: inserted.length,
          images: [u.public_url],
        }).catch(async (err) => {
          await supabase
            .from('missing_room_uploads')
            .update({
              status: 'failed',
              error: String(err),
              updated_at: new Date().toISOString(),
            })
            .eq('id', u.id);
        }),
      ),
    );

    // ✅ Redirect to success page (303 prevents re-POST on refresh)
    const successUrl = new URL(`/upload/success?count=${publicUrls.length}`, req.url);
    return NextResponse.redirect(successUrl, { status: 303 });
  } catch (e: any) {
    console.error('UPLOAD_API_ERR', e);
    const errorUrl = new URL(
      `/upload/error?msg=${encodeURIComponent(e?.message || 'Upload failed')}`,
      req.url,
    );
    return NextResponse.redirect(errorUrl, { status: 303 });
  }
}
