import type { NextApiRequest, NextApiResponse } from 'next';

type Body = {
  runId?: string;
  section?: string;
  metric?: string;
  vote?: 1 | -1;
  payload?: Record<string, any>;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  const { runId, section, metric, vote, payload } = (req.body || {}) as Body;

  if (!runId || !section || !metric || !(vote === 1 || vote === -1)) {
    return res.status(400).json({ ok: false, error: 'Missing or invalid fields' });
  }

  // ---- Option A: Log (default) ----
  // eslint-disable-next-line no-console
  console.log('[feedback]', { runId, section, metric, vote, payload, at: new Date().toISOString() });

  // ---- Option B: Supabase persistence (uncomment + configure) ----
  // const { createClient } = await import('@supabase/supabase-js');
  // const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  // const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  // const supabase = createClient(supabaseUrl, supabaseKey);
  // const { error } = await supabase.from('feedback').insert({
  //   run_id: runId,
  //   section,
  //   metric,
  //   vote,
  //   payload: payload ?? null,
  // });
  // if (error) return res.status(500).json({ ok: false, error: error.message });

  return res.status(200).json({ ok: true });
}
