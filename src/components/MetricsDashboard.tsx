// src/components/MetricsDashboard.tsx
'use client';

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, LineChart, Line
} from "recharts";

type Metric = {
  name: string;
  target: number;      // target percentage (0–100)
  achieved: number;    // actual percentage (0–100)
  hint?: string;       // small helper text
  trend?: number[];    // optional sparkline data (0–100)
};

const METRICS: Metric[] = [
  { name: "Rent Bands",    target: 80, achieved: 78, hint: "Closer is better",            trend: [70, 72, 73, 75, 77, 78] },
  { name: "Refurb Totals", target: 20, achieved: 22, hint: "Lower is better vs target",  trend: [28, 26, 25, 24, 23, 22] },
  { name: "EPC Match",     target: 95, achieved: 94, hint: "Higher is better",           trend: [90, 91, 92, 92, 93, 94] },
];

/* --------------------------- Helpers --------------------------- */

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(m.matches);
    const onChange = () => setReduced(m.matches);
    m.addEventListener?.("change", onChange);
    return () => m.removeEventListener?.("change", onChange);
  }, []);
  return reduced;
}

function DeltaBadge({ achieved, target }: { achieved: number; target: number }) {
  const diff = Math.round((achieved - target) * 10) / 10;
  const positive = diff >= 0;
  const neutral = diff === 0;
  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        neutral
          ? "bg-slate-100 text-slate-700"
          : positive
          ? "bg-emerald-100 text-emerald-700"
          : "bg-amber-100 text-amber-700",
      ].join(" ")}
      title={`Delta vs target: ${diff > 0 ? "+" : ""}${diff}%`}
    >
      {!neutral && (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          {positive ? <path d="M12 5l7 7H5l7-7z"/> : <path d="M12 19l-7-7h14l-7 7z"/>}
        </svg>
      )}
      {neutral ? "on target" : `${diff > 0 ? "+" : ""}${diff}%`}
    </span>
  );
}

/** Minimal sparkline for trend */
function Spark({ values }: { values: number[] | undefined }) {
  if (!values?.length) return null;
  const data = values.map((v, i) => ({ x: i, y: v }));
  return (
    <div className="h-6 w-24">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 3, right: 0, left: 0, bottom: 0 }}>
          <Line
            type="monotone"
            dataKey="y"
            stroke="#0ea5e9"
            dot={false}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Clean tooltip */
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

/* --------------------------- Component --------------------------- */

export default function MetricsDashboard() {
  const reducedMotion = useReducedMotion();

  return (
    <section className="section">
      <div className="container">
        <h2 className="heading-2">Beta Accuracy Goals</h2>
        <p className="small mt-1 text-slate-600">
          PropVisions is in active beta. These are our accuracy targets, updated as pilots progress.
        </p>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {METRICS.map((m) => (
            <Card key={m.name} className="card p-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <h3 className="card-title">{m.name}</h3>
                    <DeltaBadge achieved={m.achieved} target={m.target} />
                  </div>
                  <Spark values={m.trend} />
                </div>
                {m.hint && <p className="small text-slate-500 mt-1">{m.hint}</p>}

                {/* Progress-style bar with target marker */}
                <div className="h-48 mt-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        {
                          name: m.name,
                          achieved: m.achieved,
                          remainder: Math.max(0, 100 - m.achieved),
                          target: m.target,
                        },
                      ]}
                      margin={{ top: 10, right: 12, bottom: 0, left: 12 }}
                    >
                      {/* Pretty gradients + subtle background pattern */}
                      <defs>
                        <linearGradient id="ach-g" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#38bdf8" />
                          <stop offset="100%" stopColor="#0284c7" />
                        </linearGradient>
                        <linearGradient id="rem-g" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#cbd5e1" />
                          <stop offset="100%" stopColor="#e2e8f0" />
                        </linearGradient>
                        <pattern id="track" width="6" height="6" patternUnits="userSpaceOnUse">
                          <rect width="6" height="6" fill="rgba(148,163,184,0.16)" />
                          <path d="M0 6L6 0" stroke="rgba(148,163,184,0.18)" strokeWidth="1"/>
                        </pattern>
                      </defs>

                      <XAxis dataKey="name" hide />
                      <YAxis hide domain={[0, 100]} />

                      {/* Target marker (dashed) */}
                      <ReferenceLine
                        x={m.target}
                        ifOverflow="extendDomain"
                        stroke="#10b981"
                        strokeDasharray="4 4"
                        label={{
                          position: "top",
                          value: "target",
                          fill: "#065f46",
                          fontSize: 11,
                          offset: 6,
                        }}
                        xAxisId={0}
                      />

                      <Tooltip cursor={{ fill: "rgba(15,23,42,0.06)" }} content={<Tip />} />

                      {/* Stacked progress: achieved + remainder */}
                      <Bar
                        dataKey="remainder"
                        stackId="p"
                        fill="url(#rem-g)"
                        radius={[8, 8, 8, 8]}
                        barSize={18}
                        background={{ fill: "url(#track)", radius: 8 }}
                        animationDuration={reducedMotion ? 0 : 500}
                        opacity={0.6}
                      />
                      <Bar
                        dataKey="achieved"
                        stackId="p"
                        fill="url(#ach-g)"
                        radius={[8, 8, 8, 8]}
                        barSize={18}
                        animationDuration={reducedMotion ? 0 : 700}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <p className="mt-3 text-sm text-slate-600">
                  Target: <strong>{m.target}%</strong> — Current Beta: <strong>{m.achieved}%</strong>
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
