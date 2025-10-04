// RENDERS THE FORM ONLY — NO API HANDLERS HERE
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function getRequest(token: string) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const { data, error } = await supabase
    .from('missing_room_requests')
    .select('id, property_id, room_key, room_label, floor, kind, token_expires_at, status')
    .eq('token', token)
    .maybeSingle();

  if (error || !data) return null;

  const expires = new Date(data.token_expires_at).getTime();
  const ok = ['pending','emailed','uploaded','processing'].includes(data.status || '');
  if (!ok || Date.now() > expires) return null;

  return data;
}

export default async function UploadPage({ params }: { params: { token: string } }) {
  const req = await getRequest(params.token).catch(() => null);
  if (!req) return notFound();

  const title = req.room_label || 'Photo';
  const subtitle = req.floor ? `${req.kind} • ${req.floor}` : req.kind;

  return (
    <main className="mx-auto max-w-lg p-6">
      <h1 className="text-2xl font-semibold">Upload: {title}</h1>
      <p className="text-slate-600 mt-1">{subtitle}</p>

      <form className="mt-5 space-y-3" action="/api/upload" method="post" encType="multipart/form-data">
        <input type="hidden" name="token" value={params.token} />
        <div className="rounded border p-3">
          <label className="block text-sm font-medium mb-1">Photos (1–5)</label>
          <input type="file" name="files" accept="image/*" multiple required className="block w-full" />
          <p className="text-xs text-slate-500 mt-1">Tip: 1–3 photos; stand in a corner; include floor + two walls.</p>
        </div>
        <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white">Upload</button>
      </form>
    </main>
  );
}
