// src/components/MetricsDashboard.tsx
'use client';

import { Card, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

// ✅ Explicit typing for the data array
const data: Array<{ name: string; target: number; achieved: number }> = [
  { name: "Rent Bands", target: 80, achieved: 78 },
  { name: "Refurb Totals", target: 20, achieved: 22 }, // variance
  { name: "EPC Match", target: 95, achieved: 94 },
];

export default function MetricsDashboard() {
  return (
    <section className="my-12">
      <h2 className="text-2xl font-bold mb-4">Beta Accuracy Goals</h2>
      <p className="text-slate-600 mb-6">
        PropVisions is in active beta. These are our accuracy targets, updated as pilots progress.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data.map((m) => (
          <Card key={m.name} className="p-4">
            <CardContent>
              <h3 className="font-semibold text-lg mb-2">{m.name}</h3>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={[m]}>
                  <XAxis dataKey="name" hide />
                  <YAxis hide domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="achieved" fill="#0A7AA6" />
                  <Bar dataKey="target" fill="#25AB54" />
                </BarChart>
              </ResponsiveContainer>
              <p className="mt-2 text-sm text-slate-600">
                Target: {m.target}% — Current Beta: {m.achieved}%
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
