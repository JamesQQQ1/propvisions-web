export type Vote = 1 | -1;

export type FeedbackPayload = {
  runId: string;
  section: string; // e.g. "financials"
  metric: string;  // e.g. "assumptions" | "outputs" | "rent_band"
  vote: Vote;
  payload?: Record<string, any>;
};

export async function sendVote(data: FeedbackPayload) {
  const res = await fetch('/api/outcomes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    // eslint-disable-next-line no-console
    console.error('Feedback send failed', err);
    throw new Error(err?.error || 'Feedback send failed');
  }
  return (await res.json()) as { ok: boolean };
}
