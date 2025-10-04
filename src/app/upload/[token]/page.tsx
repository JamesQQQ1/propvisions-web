// src/app/upload/[token]/page.tsx
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';

/* ---------- server config ---------- */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/* ---------- types ---------- */
type MissingRoomRequest = {
  id: string;
  property_id: string;
  room_key: string;
  room_label: string | null;
  floor: string | null;
  kind: 'room' | 'epc' | 'roof';
  token_expires_at: string;
  status: string | null;
};

type PropertyLite = {
  property_title?: string | null;
  title?: string | null;          // fallback if your column is named 'title'
  address?: string | null;
  postcode?: string | null;
  cover_image_url?: string | null;
};

/* ---------- server helpers ---------- */
async function getRequestAndProperty(token: string) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const { data, error } = await supabase
    .from('missing_room_requests')
    .select('id, property_id, room_key, room_label, floor, kind, token_expires_at, status')
    .eq('token', token)
    .maybeSingle<MissingRoomRequest>();

  if (error || !data) return null;

  const expires = new Date(data.token_expires_at).getTime();
  const ok = ['pending', 'emailed', 'uploaded', 'processing'].includes(data.status || '');
  if (!ok || Date.now() > expires) return null;

  // Try to fetch a few property details (best-effort; page still works without)
  let prop: PropertyLite | null = null;
  try {
    const { data: p } = await supabase
      .from('properties')
      .select('property_title, title, address, postcode, cover_image_url')
      .eq('property_id', data.property_id)
      .maybeSingle<PropertyLite>();
    if (p) prop = p;
  } catch {
    /* ignore — not fatal */
  }

  return { req: data, prop };
}

/* ---------- client component for previews/drag&drop ---------- */
function cx(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(' ');
}

function DisplayAddress({ prop }: { prop: PropertyLite | null }) {
  if (!prop) return null;
  const name = prop.property_title || prop.title;
  const line = [prop.address, prop.postcode].filter(Boolean).join(', ');
  if (!name && !line) return null;
  return (
    <div className="mt-3 text-sm text-slate-600">
      {name && <div className="font-medium text-slate-800">{name}</div>}
      {line && <div className="">{line}</div>}
    </div>
  );
}

function CoverImage({ url }: { url?: string | null }) {
  if (!url) return null;
  return (
    <div className="mt-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt="Property cover"
        className="w-full h-40 object-cover rounded-lg border border-slate-200"
      />
    </div>
  );
}

/* We embed a tiny client-side uploader shell for previews & validation */
function UploadShell({ token }: { token: string }) {
  'use client';
  import React from 'react';
  const [files, setFiles] = React.useState<File[]>([]);
  const [dragOver, setDragOver] = React.useState(false);
  const MAX_FILES = 5;
  const MAX_MB = 20;

  function acceptFiles(list: FileList | File[]) {
    const arr = Array.from(list).slice(0, MAX_FILES);
    const filtered = arr.filter(f => f.type.startsWith('image/'));
    setFiles(filtered);
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) acceptFiles(e.target.files);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (e.dataTransfer.files?.length) acceptFiles(e.dataTransfer.files);
  }

  function onDrag(e: React.DragEvent<HTMLDivElement>, over: boolean) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(over);
  }

  function humanSize(bytes: number) {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  }

  const tooMany = files.length > MAX_FILES;
  const tooLarge = files.some(f => f.size > MAX_MB * 1024 * 1024);

  return (
    <form
      className="mt-6 space-y-5"
      action="/api/upload"
      method="post"
      encType="multipart/form-data"
    >
      <input type="hidden" name="token" value={token} />

      {/* drag & drop zone */}
      <div
        onDragEnter={(e) => onDrag(e, true)}
        onDragOver={(e) => onDrag(e, true)}
        onDragLeave={(e) => onDrag(e, false)}
        onDrop={onDrop}
        className={cx(
          'rounded-lg border border-dashed p-4 transition bg-slate-50',
          dragOver ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:bg-slate-100'
        )}
      >
        <label className="block text-sm font-medium mb-2 text-slate-700">
          Drag & drop images here, or click to choose (up to 5)
        </label>

        <input
          type="file"
          name="files"
          accept="image/*,.heic,.heif"
          multiple
          required
          onChange={onInputChange}
          className="block w-full text-sm text-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
        />

        <p className="text-xs text-slate-500 mt-2">
          Tip: 1–3 clear angles is perfect. Include flooring, corners, and any fixtures (sinks, windows, radiators).
        </p>
        <p className="text-xs text-slate-500">
          Mobile: you can use your camera directly. HEIC is supported.
        </p>

        {/* previews */}
        {files.length > 0 && (
          <div className="mt-4">
            <div className="text-sm text-slate-700 mb-2">
              {files.length} selected {files.length === 1 ? 'file' : 'files'}
            </div>
            <ul className="grid grid-cols-3 gap-3">
              {files.map((f, i) => (
                <li key={i} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={URL.createObjectURL(f)}
                    alt={f.name}
                    className="w-full h-24 object-cover rounded-md border border-slate-200"
                  />
                  <div className="mt-1 text-[11px] text-slate-600 truncate">{f.name}</div>
                  <div className="text-[10px] text-slate-400">{humanSize(f.size)}</div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {(tooMany || tooLarge) && (
          <div className="mt-3 text-sm text-red-600">
            {tooMany && <div>Max {MAX_FILES} images.</div>}
            {tooLarge && <div>Each image must be &lt; {MAX_MB} MB.</div>}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={tooMany || tooLarge || files.length === 0}
        className={cx(
          'w-full py-2.5 px-4 rounded-md text-white font-medium transition',
          tooMany || tooLarge || files.length === 0
            ? 'bg-slate-300 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700'
        )}
      >
        Upload Photos
      </button>

      <p className="text-xs text-slate-400 text-center">
        Secure upload link • expires automatically once processed
      </p>
    </form>
  );
}

/* ---------- server component (page) ---------- */
export default async function UploadPage({ params }: { params: { token: string } }) {
  const data = await getRequestAndProperty(params.token).catch(() => null);
  if (!data) return notFound();

  const { req, prop } = data;
  const title = req.room_label || 'Room Photo Upload';
  const subtitle = req.floor ? `${req.kind} • ${req.floor}` : req.kind;

  return (
    <main className="mx-auto max-w-md p-8 min-h-screen flex flex-col justify-center">
      <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-6">
        <h1 className="text-2xl font-semibold text-slate-900">Upload Photos: {title}</h1>
        <p className="text-slate-600 mt-1">{subtitle}</p>

        <DisplayAddress prop={prop} />
        <CoverImage url={prop?.cover_image_url} />

        <p className="text-sm text-slate-500 mt-4">
          These photos help our AI accurately assess refurbishment costs and room condition.
          Please take clear photos showing the full space — ideally from a corner to capture two walls and the floor.
        </p>

        {/* Client-side enhanced uploader */}
        <UploadShell token={params.token} />
      </div>
    </main>
  );
}
