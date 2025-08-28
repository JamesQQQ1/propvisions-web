'use client';

import { Card, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

type Metric = { name: string; target: number; achieved: number };

const data: Metric[] = [
  { name: "Rent Bands",   target: 80, achieved: 76 },
  { name: "Refurb Totals", target: 80, achieved: 80 },
  { name: "EPC Match",     target: 95, achieved: 93 },
];

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
                <h3 className="card-title mb-3">{m.name}</h3>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[m]} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
                      <XAxis dataKey="name" hide />
                      <YAxis hide domain={[0, 100]} />
                      {/* Clean, white tooltip; light hover cursor */}
                      <Tooltip
                        cursor={{ fill: "rgba(15,23,42,0.06)" }}
                        contentStyle={{
                          background: "#ffffff",
                          border: "1px solid #e2e8f0",
                          borderRadius: "12px",
                          padding: "8px 10px",
                        }}
                        labelFormatter={() => m.name}
                        formatter={(value: number, key) => {
                          const label = key === "achieved" ? "achieved" : "target";
                          return [`${value}`, label];
                        }}
                      />
                      <Bar dataKey="achieved" fill="#0A7AA6" />
                      <Bar dataKey="target"   fill="#25AB54" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  Target: {m.target}% — Current Beta: {m.achieved}%
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
