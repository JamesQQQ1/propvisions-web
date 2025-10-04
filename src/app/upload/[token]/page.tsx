export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import UploadShell from '@/components/UploadShell';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

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
  title?: string | null;
  address?: string | null;
  postcode?: string | null;
  cover_image_url?: string | null;
};

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
  const ok = ['pending','emailed','uploaded','processing'].includes(data.status || '');
  if (!ok || Date.now() > expires) return null;

  let prop: PropertyLite | null = null;
  try {
    const { data: p } = await supabase
      .from('properties')
      .select('property_title, title, address, postcode, cover_image_url')
      .eq('property_id', data.property_id)
      .maybeSingle<PropertyLite>();
    if (p) prop = p;
  } catch { /* ignore */ }

  return { req: data, prop };
}

function DisplayAddress({ prop }: { prop: PropertyLite | null }) {
  if (!prop) return null;
  const name = prop.property_title || prop.title;
  const line = [prop.address, prop.postcode].filter(Boolean).join(', ');
  if (!name && !line) return null;
  return (
    <div className="mt-3 text-sm text-slate-600">
      {name && <div className="font-medium text-slate-800">{name}</div>}
      {line && <div>{line}</div>}
    </div>
  );
}

function CoverImage({ url }: { url?: string | null }) {
  if (!url) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="Property cover" className="mt-4 w-full h-40 object-cover rounded-lg border border-slate-200" />;
}

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

        <UploadShell token={params.token} />
      </div>
    </main>
  );
}
