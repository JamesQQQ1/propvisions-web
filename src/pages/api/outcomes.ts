import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const {
      property_id,
      run_id,
      observed_at,
      achieved_rent_gbp,
      refurb_invoice_total_gbp,
      epc_register_rating,
      epc_register_match,
      actual_mortgage_rate_percent,
      completion_date,
      notes,
    } = req.body || {};

    if (!property_id) return res.status(400).json({ error: 'Missing property_id' });

    const { error } = await supabase.from('property_outcomes').insert({
      property_id,
      run_id: run_id ?? null,
      observed_at: observed_at ?? null,
      achieved_rent_gbp: achieved_rent_gbp ?? null,
      refurb_invoice_total_gbp: refurb_invoice_total_gbp ?? null,
      epc_register_rating: epc_register_rating ?? null,
      epc_register_match: typeof epc_register_match === 'boolean' ? epc_register_match : null,
      actual_mortgage_rate_percent: actual_mortgage_rate_percent ?? null,
      completion_date: completion_date ?? null,
      notes: notes ?? null,
    });

    if (error) return res.status(500).json({ error: error.message });

    // Refresh any open pages
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('metrics:refresh'));
    }

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error('outcomes error:', e);
    return res.status(500).json({ error: 'Server error' });
  }
}
