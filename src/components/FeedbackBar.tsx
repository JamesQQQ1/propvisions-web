'use client';

import { useState } from 'react';

type Props = {
  runId: string | null | undefined;
  propertyId: string | null | undefined;
  module: 'rent' | 'refurb' | 'epc' | 'financials';
  targetId?: string | null;   // e.g. refurb row id
  targetKey?: string | null;  // optional sub-field
  compact?: boolean;
};

export default function FeedbackBar({
  runId,
  propertyId,
  module,
  targetId = null,
  targetKey = null,
  compact,
}: Props) {
  const [choice, setChoice] = useState<'up' | 'down' | null>(null);
  const [busy, setBusy] = useState(false);

  async function send(vote: 'up' | 'down') {
    setChoice(vote);
    if (!runId || !propertyId) return;

    setBusy(true);
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          run_id: runId,
          property_id: propertyId,
          module,
          kind: 'thumb',
          target_id: targetId,
          target_key: targetKey,
          vote,
        }),
      });
      // Tell any metrics widgets to refresh
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('metrics:refresh'));
      }
    } catch {
      // ignore
    } finally {
      setBusy(false);
    }
  }

  const base = 'inline-flex items-center gap-1 rounded-md border px-2 py-1';

  return (
    <div className="mt-3 flex items-center gap-2 text-xs sm:text-sm">
      {!compact && <span className="text-slate-600">Was this accurate?</span>}
      <button
        type="button"
        onClick={() => send('up')}
        disabled={busy}
        className={`${base} ${choice === 'up' ? 'bg-green-50 border-green-200 text-green-700' : 'hover:bg-slate-50'}`}
        aria-pressed={choice === 'up'}
      >
        <span aria-hidden>👍</span> Yes
      </button>
      <button
        type="button"
        onClick={() => send('down')}
        disabled={busy}
        className={`${base} ${choice === 'down' ? 'bg-red-50 border-red-200 text-red-700' : 'hover:bg-slate-50'}`}
        aria-pressed={choice === 'down'}
      >
        <span aria-hidden>👎</span> No
      </button>
      {choice && (
        <span className="ml-2 text-slate-500">
          {choice === 'up' ? 'Thanks!' : 'Noted — we’ll use this to improve.'}
        </span>
      )}
    </div>
  );
}
