'use client';

import { useCallback, useEffect, useState } from 'react';

type Props = {
  runId: string | null | undefined;
  propertyId: string | null | undefined;
  module: 'rent' | 'refurb' | 'epc' | 'financials';
  targetId?: string | null;   // e.g. refurb row id
  targetKey?: string | null;  // optional sub-field (e.g. 'assumptions' | 'outputs')
  compact?: boolean;
  className?: string;
};

export default function FeedbackBar({
  runId,
  propertyId,
  module,
  targetId = null,
  targetKey = null,
  compact,
  className = '',
}: Props) {
  const [choice, setChoice] = useState<'up' | 'down' | null>(null);
  const [busy, setBusy] = useState(false);

  const send = useCallback(async (vote: 'up' | 'down') => {
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
      // notify widgets to refresh (same event name you already used)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('metrics:refresh'));
      }
    } catch {
      // ignore network errors for now
    } finally {
      setBusy(false);
    }
  }, [runId, propertyId, module, targetId, targetKey]);

  // Keyboard a11y: left/right arrows toggle when focused
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (document.activeElement?.getAttribute('data-fb-root') !== 'true') return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); send('down'); }
      if (e.key === 'ArrowRight') { e.preventDefault(); send('up'); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [send]);

  const base = 'inline-flex items-center gap-1 rounded-md border px-2 py-1 transition';
  const root  = `mt-3 flex items-center gap-2 text-xs sm:text-sm ${className}`;

  return (
    <div className={root} tabIndex={0} data-fb-root="true" aria-label="Feedback bar">
      {!compact && <span className="text-slate-600 dark:text-slate-400">Was this accurate?</span>}
      <button
        type="button"
        onClick={() => send('up')}
        disabled={busy}
        className={`${base} ${choice === 'up'
          ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
          : 'hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
        }`}
        aria-pressed={choice === 'up'}
        aria-label="Thumbs up"
      >
        <span aria-hidden>👍</span> {!compact && 'Yes'}
      </button>
      <button
        type="button"
        onClick={() => send('down')}
        disabled={busy}
        className={`${base} ${choice === 'down'
          ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
          : 'hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
        }`}
        aria-pressed={choice === 'down'}
        aria-label="Thumbs down"
      >
        <span aria-hidden>👎</span> {!compact && 'No'}
      </button>
      {choice && (
        <span className="ml-2 text-slate-500 dark:text-slate-400" role="status" aria-live="polite">
          {choice === 'up' ? 'Thanks!' : "Noted — we'll use this to improve."}
        </span>
      )}
    </div>
  );
}
