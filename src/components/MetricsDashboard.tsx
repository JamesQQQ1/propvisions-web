'use client';

import { Card, CardContent } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";

type Metric = { name: string; target: number; achieved: number; hint?: string };

const data: Metric[] = [
  { name: "Rent Bands",    target: 80, achieved: 78, hint: "Closer is better" },
  { name: "Refurb Totals", target: 20, achieved: 22, hint: "Lower is better vs target" },
  { name: "EPC Match",     target: 95, achieved: 94, hint: "Higher is better" },
];

// simple, clean tooltip
function Tip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const a = payload.find((p: any) => p.dataKey === "achieved")?.value ?? 0;
  const t = payload.find((p: any) => p.dataKey === "target")?.value ?? 0;
  const diff = Math.round((a - t) * 10) / 10;
  const sign = diff > 0 ? "+" : diff < 0 ? "–" : "±";
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
      <div>target: <strong>{t}%</strong></div>
      <div style={{ color: diff === 0 ? "#334155" : diff > 0 ? "#065f46" : "#9a3412" }}>
        delta: <strong>{sign.replace("–","-")}{Math.abs(diff)}%</strong>
      </div>
    </div>
  );
}

export default function MetricsDashboard() {
  return (
    <section className="section">
      <div className="container">
        <h2 className="heading-2">Beta Accuracy Goals</h2>
        <p className="small mt-1 text-slate-600">
          PropVisions is in active beta. These are our accuracy targets, updated as pilots progress.
        </p>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {data.map((m) => (
            <Card key={m.name} className="card p-0">
              <CardContent className="p-6">
                <div className="flex items-baseline justify-between">
                  <h3 className="card-title">{m.name}</h3>
                  {m.hint && <span className="small text-slate-500">{m.hint}</span>}
                </div>

                <div className="h-44 mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[m]} margin={{ top: 8, right: 12, bottom: 0, left: 12 }}>
                      {/* defs = nice gradients */}
                      <defs>
                        <linearGradient id="gAch" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#0ea5e9" />
                          <stop offset="100%" stopColor="#0369a1" />
                        </linearGradient>
                        <linearGradient id="gTarget" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#34d399" />
                          <stop offset="100%" stopColor="#059669" />
                        </linearGradient>
                      </defs>

                      <XAxis dataKey="name" hide />
                      <YAxis hide domain={[0, 100]} />

                      {/* target marker */}
                      <ReferenceLine
                        x={m.target}
                        ifOverflow="extendDomain"
                        stroke="#10b981"
                        strokeDasharray="3 3"
                        label={{
                          position: "top",
                          value: "Target",
                          fill: "#065f46",
                          fontSize: 11,
                          offset: 6,
                        }}
                        xAxisId={0}
                      />

                      <Tooltip cursor={{ fill: "rgba(15,23,42,0.06)" }} content={<Tip />} />

                      {/* achieved bar drawn over a faint track */}
                      <Bar
                        dataKey="target"
                        fill="url(#gTarget)"
                        radius={[8, 8, 8, 8]}
                        barSize={16}
                        background={{ fill: "rgba(148,163,184,0.2)", radius: 8 }}
                        animationDuration={500}
                        opacity={0.35}
                      />
                      <Bar
                        dataKey="achieved"
                        fill="url(#gAch)"
                        radius={[8, 8, 8, 8]}
                        barSize={16}
                        animationDuration={650}
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
