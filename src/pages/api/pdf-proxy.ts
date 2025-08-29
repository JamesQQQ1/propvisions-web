import type { NextApiRequest, NextApiResponse } from 'next'

/**
 * Streams a remote PDF through your own domain so it can be embedded in an <iframe>.
 * - Forwards Range headers for partial content (PDF viewers rely on this)
 * - Forces Content-Disposition:inline so the browser renders instead of downloading
 * - Removes X-Frame-Options/Frame-Options to avoid embed blocks
 * - Sets no-store to avoid stale caching during dev
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store');

  const urlParam = Array.isArray(req.query.url) ? req.query.url[0] : req.query.url;
  const url = (urlParam || '').toString();

  // Validate URL
  try {
    const u = new URL(url);
    if (!/^https?:$/i.test(u.protocol)) throw new Error('Only http(s) allowed');
  } catch {
    return res.status(400).json({ error: 'Invalid or missing ?url=' });
  }

  try {
    // Forward Range header if present for partial content support
    const range = req.headers.range as string | undefined;

    const upstream = await fetch(url, {
      // Pass Range through for 206 responses
      headers: range ? { Range: range } : undefined,
      // Avoid caching here; you can adjust for prod if you want
      cache: 'no-store',
    });

    // Status should be 200 or 206 for ranged requests
    res.status(upstream.status);

    // Copy headers but normalize for inline PDF rendering
    const headers = new Headers(upstream.headers);
    headers.set('Content-Type', 'application/pdf');
    headers.set('Content-Disposition', 'inline');
    headers.delete('X-Frame-Options');
    headers.delete('Frame-Options');

    // Re-emit all headers (important for Accept-Ranges / Content-Range)
    headers.forEach((v, k) => res.setHeader(k, v));

    // Stream the body to the client
    if (!upstream.body) {
      return res.status(502).json({ error: 'Upstream returned no body' });
    }
    // @ts-ignore: Node 18 stream piping
    upstream.body.pipe(res);
  } catch (err: any) {
    console.error('pdf-proxy error:', err);
    return res.status(500).json({ error: 'Failed to fetch PDF' });
  }
}
