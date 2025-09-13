import type { NextApiRequest, NextApiResponse } from 'next';
import type { RefurbPayload } from '@/types/refurb';

// This assumes you POST the combined payload here (useful while wiring UI).
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'POST') {
      const body = req.body as { payload?: RefurbPayload };
      if (!body?.payload) return res.status(400).json({ error: 'Missing payload' });
      return res.status(200).json({ payload: body.payload });
    }

    // If you want GET to fetch from Supabase or your n8n endpoint, do it here.
    // For now, just say not implemented:
    return res.status(405).json({ error: 'Use POST with { payload }' });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Server error' });
  }
}
