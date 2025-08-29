// src/components/MetricsDashboard.tsx
'use client';

import { useEffect, useMemo } from "react";
import useSWR from "swr";
import { Card, CardContent } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line
} from "recharts";

/* ---------------------- Types ---------------------- */

type ModuleStat = { n: number; approval: number | null } | undefined;

type MetricsApi = {
  windowDays: number;
  moduleApproval?: {
    rent?: ModuleStat;
    refurb?: ModuleStat;
    epc?: ModuleStat;
    financials?: ModuleStat;
  };
  refurbPerRoom?: Record<string, { n: number; approval: number | null }>;
  // When you later wire outcomes, these will be numbers (e.g., 0.18 for 18% MAPE)
  rent_mape: number | null;
  refurb_mape: number | null;
  epc_accuracy: number | null;
};

type MetricCard = {
  name: string;
  target: number;            // 0–100 target
  achieved: number | null;   // 0–100 live value (null -> not enough data)
  hint: string;              // one-liner explaining the metric
  trend?: number[];          // optional sparkline (not live yet)
  n?: number;                // sample size
};

/* ---------------------- Config ---------------------- */
/** Targets you showed in your static component */
const TARGETS = {
  rentBandsPct: 80,      // % inside band
  refurbAccuracyPct: 80, // % accuracy proxy (100 - mape*100) OR approval%
  epcMatchPct: 95,       // % match
};

/** How to fetch the API */
const fetcher = (url: string) => fetch(url).then((r) => r.json());

/* ---------------------- Small UI bits ---------------------- */

function DeltaBadge({ achieved, target }: { achieved: number | null; target: number }) {
  if (achieved == null) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-700">
        not enough data
      </span>
    );
  }
  const diff = Math.round((achieved - target) * 10) / 10;
  const neutral = diff === 0;
  const up = diff > 0;
  const cls = neutral
    ? "bg-slate-100 text-slate-700"
    : up
      ? "bg-emerald-100 text-emerald-700"
      : "bg-amber-100 text-amber-700";

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {!neutral && (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          {up ? <path d="M12 5l7 7H5l7-7z" /> : <path d="M12 19l-7-7h14l-7 7z" />}
        </svg>
      )}
      {neutral ? "on target" : `${diff > 0 ? "+" : ""}${diff}%`}
    </span>
  );
}

function Spark({ values }: { values?: number[] }) {
  if (!values?.length) return null;
  const data = values.map((v, i) => ({ x: i, y: v }));
  return (
    <div className="h-6 w-24">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 3, right: 0, left: 0, bottom: 0 }}>
          <Line type="monotone" dataKey="y" stroke="#0ea5e9" dot={false} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function Tip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const a = payload.find((p: any) => p.dataKey === "achieved")?.value ?? 0;
  const t = payload.find((p: any) => p.dataKey === "target")?.value ?? 0;
  const diff = Math.round((a - t) * 10) / 10;
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        padding: "8px 10px",
        boxShadow: "0 4px 14px rgba(15,23,42,0.06)",
        fontSize: 12,
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
      <div>achieved: <strong>{Math.round(a)}%</strong></div>
      <div>target:   <strong>{Math.round(t)}%</strong></div>
      <div style={{ marginTop: 2, color: diff === 0 ? "#334155" : diff > 0 ? "#065f46" : "#9a3412" }}>
        delta: <strong>{diff > 0 ? "+" : ""}{diff}%</strong>
      </div>
    </div>
  );
}

/* ---------------------- Live Component ---------------------- */
/**
 * Props:
 * - propertyId: if provided, shows metrics for that property only; otherwise global window
 * - days: rolling window (defaults 90)
 */
export default function MetricsDashboard({
  propertyId,
  days = 90,
}: {
  propertyId?: string | null;
  days?: number;
}) {
  const url = propertyId
    ? `/api/metrics?property_id=${propertyId}&days=${days}`
    : `/api/metrics?days=${days}`;

  const { data, mutate } = useSWR<MetricsApi>(url, fetcher, { revalidateOnFocus: false });

  // Auto-refresh when any feedback is submitted (FeedbackBar dispatches this)
  useEffect(() => {
    const handler = () => mutate();
    window.addEventListener('metrics:refresh', handler);
    return () => window.removeEventListener('metrics:refresh', handler);
  }, [mutate]);

  // Compute achieved% for each card from API response.
  const cards: MetricCard[] = useMemo(() => {
    const m = data?.moduleApproval || {};

    // 1) Rent bands: achieved = approval% if present (0..1 -> 0..100)
    const rentApproval = m.rent?.approval ?? null;
    const rentN = m.rent?.n ?? undefined;
    const rentAchieved = rentApproval == null ? null : Math.round(rentApproval * 100);

    // 2) Refurb totals: if refurb_mape exists, show (100 - mape*100). Otherwise fallback to approval%.
    let refurbAchieved: number | null = null;
    if (data?.refurb_mape != null) {
      refurbAchieved = Math.max(0, Math.min(100, Math.round(100 - data.refurb_mape * 100)));
    } else {
      const refurbApproval = m.refurb?.approval ?? null;
      refurbAchieved = refurbApproval == null ? null : Math.round(refurbApproval * 100);
    }
    const refurbN = m.refurb?.n ?? undefined;

    // 3) EPC match: if epc_accuracy (0..1) exists, show that; else fallback to approval%.
    let epcAchieved: number | null = null;
    if (data?.epc_accuracy != null) {
      epcAchieved = Math.round(data.epc_accuracy * 100);
    } else {
      const epcApproval = m.epc?.approval ?? null;
      epcAchieved = epcApproval == null ? null : Math.round(epcApproval * 100);
    }
    const epcN = m.epc?.n ?? undefined;

    const arr: MetricCard[] = [
      {
        name: "Rent Bands",
        target: TARGETS.rentBandsPct,
        achieved: rentAchieved,
        hint: "Share of cases where achieved rent falls inside our predicted band.",
        trend: undefined,
        n: rentN,
      },
      {
        name: "Refurb Totals",
        target: TARGETS.refurbAccuracyPct,
        achieved: refurbAchieved,
        hint:
          data?.refurb_mape != null
            ? "Accuracy from invoices: 100 - MAPE%. (Higher is better.)"
            : "Live approval rate (thumbs). Will switch to true accuracy once invoices are logged.",
        trend: undefined,
        n: refurbN,
      },
      {
        name: "EPC Match",
        target: TARGETS.epcMatchPct,
        achieved: epcAchieved,
        hint:
          data?.epc_accuracy != null
            ? "Confirmed EPC match rate from register."
            : "Live approval rate (thumbs). Will switch to register-backed accuracy.",
        trend: undefined,
        n: epcN,
      },
    ];

    return arr;
  }, [data]);

  return (
    <section className="section">
      <div className="container">
        <h2 className="heading-2">Beta Accuracy Goals</h2>
        <p className="small mt-1 text-slate-600">
          Live metrics for the last <strong>{data?.windowDays ?? days} days</strong>.
          These update immediately when users submit feedback, and switch to true accuracy when outcomes are available.
        </p>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {cards.map((m) => {
            const chartData = [
              {
                label: m.name,
                achieved: m.achieved ?? 0,
                target: m.target,
              },
            ];
            return (
              <Card key={m.name} className="card p-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <h3 className="card-title">{m.name}</h3>
                      <DeltaBadge achieved={m.achieved} target={m.target} />
                    </div>
                    <Spark values={m.trend} />
                  </div>
                  <p className="small text-slate-500 mt-1">
                    {m.hint}
                    {typeof m.n === 'number' && (
                      <span className="ml-2 text-slate-400">n={m.n}</span>
                    )}
                  </p>

                  {/* Two horizontal bars: Achieved vs Target */}
                  <div className="h-44 mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData}
                        layout="vertical"
                        margin={{ top: 8, right: 16, bottom: 8, left: 16 }}
                      >
                        <defs>
                          <linearGradient id="ach-g" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#38bdf8" />
                            <stop offset="100%" stopColor="#0284c7" />
                          </linearGradient>
                          <linearGradient id="tgt-g" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#34d399" />
                            <stop offset="100%" stopColor="#059669" />
                          </linearGradient>
                        </defs>

                        <XAxis type="number" domain={[0, 100]} hide />
                        <YAxis type="category" dataKey="label" hide />

                        <Tooltip
                          cursor={{ fill: "rgba(15,23,42,0.06)" }}
                          content={<Tip />}
                        />

                        {/* Target (thin bar) */}
                        <Bar
                          dataKey="target"
                          fill="url(#tgt-g)"
                          radius={[10, 10, 10, 10]}
                          barSize={12}
                          background={{ fill: "rgba(148,163,184,0.16)", radius: 10 }}
                        />

                        {/* Achieved (thicker bar overlay) */}
                        <Bar
                          dataKey="achieved"
                          fill="url(#ach-g)"
                          radius={[10, 10, 10, 10]}
                          barSize={18}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-3 text-sm text-slate-600">
                    Target: <strong>{m.target}%</strong> — Current:{" "}
                    <strong>{m.achieved == null ? "—" : `${m.achieved}%`}</strong>
                    {typeof m.n === 'number' && (
                      <span className="ml-2 text-slate-400">n={m.n}</span>
                    )}
                  </div>

                  {/* Micro-legend */}
                  <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ background: "linear-gradient(90deg,#34d399,#059669)" }}
                      />
                      Target
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ background: "linear-gradient(90deg,#38bdf8,#0284c7)" }}
                      />
                      Achieved
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Section explainer */}
        <div className="mt-6 card p-4">
          <p className="small text-slate-600">
            <strong>How this works:</strong> rent/epc cards show approval% now and will switch
            to true accuracy automatically when outcomes are logged (MAPE for rent/refurb,
            register match for EPC). The sparkline is a placeholder; we’ll feed it with time-series
            later.
          </p>
        </div>
      </div>
    </section>
  );
}
