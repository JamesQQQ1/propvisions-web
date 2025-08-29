'use client';

import { useEffect } from 'react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type ModuleStat = { n: number; approval: number | null } | undefined;
type ApiResp = {
  windowDays: number;
  moduleApproval?: {
    rent?: ModuleStat;
    refurb?: ModuleStat;
    epc?: ModuleStat;
    financials?: ModuleStat;
  };
};

export default function MetricsCards({ propertyId }: { propertyId?: string | null }) {
  const url = propertyId
    ? `/api/metrics?property_id=${propertyId}&days=90`
    : `/api/metrics?days=90`;

  const { data, mutate } = useSWR<ApiResp>(url, fetcher, { revalidateOnFocus: false });

  // Refresh when any feedback is submitted
  useEffect(() => {
    const handler = () => mutate();
    window.addEventListener('metrics:refresh', handler);
    return () => window.removeEventListener('metrics:refresh', handler);
  }, [mutate]);

  const card = (title: string, val?: number | null, n?: number) => {
    const label = val == null ? 'Not enough data' : `${Math.round(val * 100)}% approval`;
    const sub =
      typeof n === 'number' ? `n=${n} · last ${data?.windowDays ?? 90}d` : '';
    return (
      <div className="rounded-xl border p-4 bg-white shadow-sm">
        <div className="text-sm text-slate-500">{title}</div>
        <div className="mt-2 text-2xl font-semibold text-slate-800">{label}</div>
        <div className="mt-1 text-xs text-slate-500">{sub}</div>
      </div>
    );
  };

  const m = data?.moduleApproval || {};

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {card('Rent Bands', m?.rent?.approval ?? null, m?.rent?.n)}
      {card('Refurb Totals', m?.refurb?.approval ?? null, m?.refurb?.n)}
      {card('EPC Match', m?.epc?.approval ?? null, m?.epc?.n)}
    </section>
  );
}
