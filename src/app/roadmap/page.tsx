// src/app/roadmap/page.tsx
import { ReactNode, useState } from "react";

export default function RoadmapPage() {
  return (
    <div className="section">
      <div className="container grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 space-y-6">
          <h1 className="heading-2">Roadmap</h1>
          <p className="small text-slate-600">Sequenced delivery with accuracy hardening and operational reliability.</p>

          <RoadmapTimeline />

          <h2 className="heading-2 mt-8">Current limitations</h2>
          <Accordion
            items={[
              {
                title: "Portal coverage (Rightmove/Zoopla)",
                content: (
                  <div className="space-y-2 small text-slate-700">
                    <p>
                      Not enabled in the public demo due to partner/API restrictions. Launch plan includes unified search across sources,
                      de-duplication and canonical records by address+agent+media.
                    </p>
                    <p className="text-slate-500">Demo supports many agent/auction URLs and other compatible pages.</p>
                  </div>
                )
              },
              {
                title: "Accuracy bands & confidence",
                content: (
                  <div className="space-y-2 small text-slate-700">
                    <p>Confidence reflects listing quality and regional nuance. Wider bands prompt manual checks.</p>
                    <p>User edits become priors to narrow bands over time.</p>
                  </div>
                )
              },
              {
                title: "Mortgage module",
                content: (
                  <div className="space-y-2 small text-slate-700">
                    <p>Today: standard assumptions included in cash-flow.</p>
                    <p>Coming: IO/repayment products, fees, ERC modelling, and forward-rate scenarios with DSCR/ICR.</p>
                  </div>
                )
              },
            ]}
          />
        </div>

        <aside className="lg:col-span-5">
          <div className="card p-6 space-y-3">
            <h3 className="card-title">Why PropVisions is different</h3>
            <ul className="small text-slate-700 space-y-2 list-disc pl-5">
              <li><strong>Automation across the flow</strong>: ingestion → analysis → reporting → alerts</li>
              <li><strong>Transparency by default</strong>: each figure maps to a line-item & assumption</li>
              <li><strong>Human-in-the-loop</strong>: your edits improve local priors</li>
              <li><strong>Shareable outputs</strong>: lender-ready PDF & Excel</li>
            </ul>
          </div>

          <div className="rounded-2xl bg-slate-50 border p-6 mt-6">
            <div className="font-semibold">Join the beta cohort</div>
            <div className="small text-slate-600 mt-1">Lock in pricing and influence the roadmap for your patch.</div>
            <a className="btn btn-primary mt-4 inline-block" href="/book-demo">Book a demo</a>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* Timeline */
function RoadmapTimeline() {
  const items = [
    {
      tag: "Now (Beta)",
      points: [
        "URL→analysis for agent/auction pages",
        "Refurb from photos (room bands, confidence)",
        "Rent bands & ROI with transparent inputs",
        "PDF/Excel exports",
        "Alerts & logging"
      ],
      status: "active",
    },
    {
      tag: "Launch (Public)",
      points: [
        "Unified search across sources",
        "Compliant Rightmove/Zoopla integrations",
        "De-duplication & canonical records"
      ],
      status: "next",
    },
    {
      tag: "Q2",
      points: [
        "Off-market module & compliant outreach",
        "Status-change watcher (new/price drop/returning)",
        "Saved searches & daily digests"
      ],
      status: "planned",
    },
    {
      tag: "Q3",
      points: [
        "Mortgage: IO/repayment, fees, ERCs",
        "Forward-rate scenarios & DSCR/ICR",
        "Remortgage timing assistant"
      ],
      status: "planned",
    },
  ] as const;

  return (
    <div className="space-y-5">
      {items.map((it, idx) => (
        <div key={it.tag} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className={`w-3 h-3 rounded-full ${idx === 0 ? "bg-emerald-500" : "bg-slate-300"}`} />
            {idx < items.length - 1 && <div className="w-px flex-1 bg-slate-200 mt-1" />}
          </div>
          <div className="flex-1 card p-4">
            <div className="small font-semibold">{it.tag}</div>
            <ul className="mt-2 small text-slate-700 list-disc pl-5 space-y-1">
              {it.points.map((p, i) => <li key={i}>{p}</li>)}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}

/* Accordion */
function Accordion({ items }: { items: Array<{ title: string; content: ReactNode }> }) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  return (
    <div className="space-y-3">
      {items.map((it, i) => {
        const open = i === openIdx;
        return (
          <div key={it.title} className="rounded-xl border">
            <button className="w-full flex items-center justify-between px-4 py-3 text-left" onClick={() => setOpenIdx(open ? null : i)} aria-expanded={open}>
              <span className="font-medium">{it.title}</span>
              <span className={`transition-transform ${open ? "rotate-180" : ""}`} aria-hidden>▾</span>
            </button>
            <div className={`px-4 overflow-hidden transition-[max-height,opacity] duration-300 ${open ? "max-h-[320px] opacity-100 pb-4" : "max-h-0 opacity-0"}`}>
              {it.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}
