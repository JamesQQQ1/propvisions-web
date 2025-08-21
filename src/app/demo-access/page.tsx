// src/app/demo-access/page.tsx
'use client';

import { useState } from 'react';

export default function DemoAccess() {
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    const res = await fetch('/api/demo-auth', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ key }),
    });
    const json = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) { setErr(json?.error || 'Invalid key'); return; }
    const params = new URLSearchParams(window.location.search);
    const next = params.get('next') || '/demo';
    window.location.href = next;
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl shadow p-6 border">
        <h1 className="text-xl font-semibold mb-2">Enter access key</h1>
        <p className="text-sm text-neutral-600 mb-4">This gate protects the live demo.</p>
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="password"
            className="w-full border rounded p-2"
            placeholder="Access key"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            required
          />
          <button
            type="submit"
            className="w-full rounded-lg p-2 bg-black text-white disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Checking…' : 'Unlock demo'}
          </button>
        </form>
        {err && <p className="text-sm text-red-600 mt-3">{err}</p>}
        <p className="text-xs text-neutral-500 mt-4">Need a key? Email hello@propertyvisions.com</p>
      </div>
    </main>
  );
}
