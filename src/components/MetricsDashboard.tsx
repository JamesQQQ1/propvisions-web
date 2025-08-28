// src/components/MetricsDashboard.tsx
'use client';

import { Card, CardContent } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line
} from "recharts";

/* ---------------------- Data ---------------------- */

type Metric = {
  name: string;
  target: number;      // 0–100
  achieved: number;    // 0–100
  hint: string;        // one-liner explaining the metric
  trend?: number[];    // small sparkline (0–100)
};

const METRICS: Metric[] = [
  {
    name: "Rent Bands",
    target: 80,
    achieved: 78,
    hint: "How closely our rent estimate bands match local market outcomes.",
    trend: [70, 72, 73, 75, 77, 78],
  },
  {
    name: "Refurb Totals",
    target: 20,
    achieved: 22,
    hint: "Average variance (%) of predicted vs final refurb cost. Lower is better.",
    trend: [28, 26, 25, 24, 23, 22],
  },
  {
    name: "EPC Match",
    target: 95,
    achieved: 94,
    hint: "Share of listings where our scraped EPC data matches the register.",
    trend: [90, 91, 92, 92, 93, 94],
  },
];

/* ---------------------- UI bits ---------------------- */

function DeltaBadge({ achieved, target }: { achieved: number; target: number }) {
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
      <div>achieved: <strong>{a}%</strong></div>
      <div>target:   <strong>{t}%</strong></div>
      <div style={{ marginTop: 2, color: diff === 0 ? "#334155" : diff > 0 ? "#065f46" : "#9a3412" }}>
        delta: <strong>{diff > 0 ? "+" : ""}{diff}%</strong>
      </div>
    </div>
  );
}

/* ---------------------- Component ---------------------- */

export default function MetricsDashboard() {
  return (
    <section className="section">
      <div className="container">
        <h2 className="heading-2">Beta Accuracy Goals</h2>
        <p className="small mt-1 text-slate-600">
          Where our beta stands vs. internal targets. Each metric updates as pilot runs complete.
        </p>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {METRICS.map((m) => {
            const chartData = [{ label: m.name, achieved: m.achieved, target: m.target }];
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
                  <p className="small text-slate-500 mt-1">{m.hint}</p>

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

                        <Tooltip cursor={{ fill: "rgba(15,23,42,0.06)" }} content={<Tip />} />

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
                    Target: <strong>{m.target}%</strong> — Current Beta: <strong>{m.achieved}%</strong>
                  </div>

                  {/* Micro-legend */}
                  <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <span className="inline-block h-2 w-2 rounded-full" style={{ background: "linear-gradient(90deg,#34d399,#059669)" }} />
                      Target
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="inline-block h-2 w-2 rounded-full" style={{ background: "linear-gradient(90deg,#38bdf8,#0284c7)" }} />
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
            <strong>How to read this:</strong> each card compares current beta performance (“Achieved”) against our internal
            target band (“Target”). The sparkline shows recent movement from pilot runs.
            <span className="ml-1">All figures are normalised to 0–100.</span>
          </p>
        </div>
      </div>
    </section>
  );
}
