// src/app/upload/[token]/page.tsx
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

  const title = req.room_label || 'Room Photo Upload';
  const subtitle = req.floor ? `${req.kind} • ${req.floor}` : req.kind;

  return (
    <main className="mx-auto max-w-md p-8 min-h-screen flex flex-col justify-center">
      <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-6">
        <h1 className="text-2xl font-semibold text-slate-900">Upload Photos: {title}</h1>
        <p className="text-slate-600 mt-1">{subtitle}</p>

        <p className="text-sm text-slate-500 mt-4">
          These photos help our AI accurately assess refurbishment costs and room condition. 
          Please take clear photos showing the full space — ideally from a corner to capture two walls and the floor.
        </p>

        <form
          className="mt-6 space-y-5"
          action="/api/upload"
          method="post"
          encType="multipart/form-data"
        >
          <input type="hidden" name="token" value={params.token} />

          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 hover:bg-slate-100 transition">
            <label className="block text-sm font-medium mb-2 text-slate-700">
              Upload up to 5 photos
            </label>
            <input
              type="file"
              name="files"
              accept="image/*"
              multiple
              required
              className="block w-full text-sm text-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
            />
            <p className="text-xs text-slate-500 mt-2">
              Tip: 1–3 good angles is perfect. Include flooring, corners, and any fixtures (sinks, windows, etc.).
            </p>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
          >
            Upload Photos
          </button>
        </form>

        <p className="text-xs text-slate-400 text-center mt-6">
          Secure upload link • expires automatically once processed
        </p>
      </div>
    </main>
  );
}
