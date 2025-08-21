// src/app/page.tsx
import Link from "next/link"
import type { ReactNode } from "react"

const YT_ID = process.env.NEXT_PUBLIC_DEMO_YOUTUBE_ID
const HAS_YT = !!YT_ID

export default function LandingPage() {
  return (
    <div className="bg-white">
      {/* HERO */}
      <section className="section">
        <div className="container grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6">
            <span className="badge">
              <Dot color="#10b981" />
              Live demo — no sign-up
            </span>

            <h1 className="heading-hero">
              From URL to <span className="text-gradient">investor-ready ROI</span> in minutes
            </h1>

            <p className="subhead">
              Paste a Rightmove/Zoopla/auction link. PropertyScout extracts the facts, estimates refurb costs,
              and computes full financials with clear assumptions — exportable to PDF & Excel.
            </p>

            <div className="flex flex-wrap gap-3">
              {/* 🔑 changed to /demo-access */}
              <Link href="/demo-access" className="btn btn-primary">
                Try the live demo <ArrowRight />
              </Link>
              <a href="#walkthrough" className="btn btn-outline">
                Watch the walkthrough <Play />
              </a>
            </div>

            {/* Micro stats */}
            <div className="flex flex-wrap items-center gap-5 small">
              <Chip color="emerald">~30s</Chip><span>Time to first pass</span>
              <Chip color="sky">PDF • Excel</Chip><span>Exports</span>
              <Chip color="violet">Line-items</Chip><span>Transparency</span>
            </div>

            {/* Trust row */}
            <div className="mt-6 grid grid-cols-3 sm:grid-cols-6 gap-4 items-center opacity-70">
              {["Agents", "Investors", "Auctions", "Lenders", "Analysts", "Sourcers"].map((label) => (
                <div
                  key={label}
                  className="h-8 rounded-md border border-slate-200 grid place-items-center text-[11px] text-slate-500"
                >
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Hero video frame */}
          <div className="lg:col-span-5">
            <div className="card overflow-hidden">
              <div className="card-header">Product walkthrough</div>
              <div className="aspect-video w-full bg-black">
                {HAS_YT ? (
                  <iframe
                    className="h-full w-full"
                    src={`https://www.youtube.com/embed/${YT_ID}?rel=0`}
                    title="PropertyScout demo"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : (
                  <video
                    className="h-full w-full"
                    controls
                    playsInline
                    preload="metadata"
                    poster="/demo-poster.jpg"
                  >
                    <source src="/demo.mp4" type="video/mp4" />
                  </video>
                )}
              </div>
              <div className="card-footer">
                <span className="small">2-minute overview of the core flow.</span>
                {/* 🔑 changed to /demo-access */}
                <Link href="/demo-access" className="link">
                  Open the live demo →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section">
        <div className="container">
          <h2 className="heading-2">How PropertyScout works</h2>
          <p className="small mt-1 text-slate-600">
            A compressed pipeline from link → analysis → client-ready pack.
          </p>

          <ol className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map((s, i) => (
              <li key={s.title} className="card p-6 relative">
                <span className="step-index">{i + 1}</span>
                <div className="flex items-start gap-3">
                  <div className="icon-wrap">{s.icon}</div>
                  <div>
                    <h3 className="card-title">{s.title}</h3>
                    <p className="card-text">{s.desc}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-3 small">
            <Pill>Scrape & structure</Pill>
            <ArrowDivider />
            <Pill>Images → refurb lines</Pill>
            <ArrowDivider />
            <Pill>Fees/taxes/voids</Pill>
            <ArrowDivider />
            <Pill>Cash-flow & ROI</Pill>
            <ArrowDivider />
            <Pill>PDF & Excel exports</Pill>
          </div>
        </div>
      </section>

      {/* WHAT YOU GET */}
      <section className="section">
        <div className="container grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7 space-y-4">
            <h2 className="heading-2">What you get from a single URL</h2>
            <ul className="mt-3 space-y-3 small text-slate-700">
              <ListItem bold="Post-refurb valuation." text="Value after works, with the assumptions surfaced." />
              <ListItem
                bold="Refurb cost breakdown."
                text="Room-by-room and by category (paint, floor, electrics, plumbing, damp, structure)."
              />
              <ListItem
                bold="Financials."
                text="Stamp duty, fees, interest, voids, management, and net income with ROI and yield."
              />
              <ListItem bold="Exports." text="A polished PDF deck and an Excel with every line item." />
              <ListItem bold="Comparables (when available)." text="Basic comps for sales and rental to sanity-check the numbers." />
              <ListItem bold="Scenario tweaks." text="Adjust rates, voids, maintenance, and rerun instantly." />
            </ul>

            <div className="mt-4 flex gap-3">
              {/* 🔑 changed to /demo-access */}
              <Link href="/demo-access" className="btn btn-primary">
                Paste a URL <ArrowRight />
              </Link>
              <a href="#faq" className="btn btn-outline">
                Read FAQs
              </a>
            </div>
          </div>

          {/* Snapshot card */}
          <div className="lg:col-span-5">
            <div className="card p-5">
              <div className="flex items-center justify-between">
                <span className="small font-medium text-slate-900">Financial snapshot</span>
                <span className="badge badge-emerald">
                  <Spark /> Auto-computed
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                {[
                  ["Post-refurb value", "£245,000"],
                  ["Total refurb", "£18,600"],
                  ["Net yield (yr 1)", "8.4%"],
                  ["Annual net", "£12,140"],
                ].map(([k, v]) => (
                  <div key={k} className="metric">
                    <div className="metric-label">{k}</div>
                    <div className="metric-value">{v}</div>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-xl border">
                <div className="flex items-center justify-between px-3 py-2 small">
                  <span className="font-medium text-slate-900">Refurb (by room)</span>
                  <span className="text-slate-500">4 items</span>
                </div>
                <div className="divide-y">
                  {[
                    ["Kitchen", "£7,900"],
                    ["Bathroom", "£4,150"],
                    ["Bedroom (x2)", "£3,400"],
                    ["Electrics (partial)", "£3,150"],
                  ].map(([room, total]) => (
                    <div
                      key={room}
                      className="flex items-center justify-between px-3 py-2 text-sm"
                    >
                      <span>{room}</span>
                      <span className="font-medium">{total}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-end">
                <button className="link small">Open full model →</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE DEEP DIVE */}
      <section className="section">
        <div className="container">
          <h2 className="heading-2">Deep-dive on the core modules</h2>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <article key={f.title} className="card p-6">
                <div className="flex items-start gap-3">
                  <div className="icon-wrap">{f.icon}</div>
                  <div>
                    <h3 className="card-title">{f.title}</h3>
                    <p className="card-text">{f.desc}</p>
                  </div>
                </div>
                <ul className="mt-4 list-disc pl-5 small text-slate-600 space-y-1">
                  {f.points.map((p, idx) => (
                    <li key={idx}>{p}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* COMPARISON */}
      <section className="section">
        <div className="container">
          <h2 className="heading-2">Manual workflow vs PropertyScout</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm border rounded-xl overflow-hidden">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <th className="p-3 text-left">Dimension</th>
                  <th className="p-3 text-left">Manual / spreadsheets</th>
                  <th className="p-3 text-left">PropertyScout</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {COMPARISON.map((row) => (
                  <tr key={row.dim}>
                    <td className="p-3 font-medium">{row.dim}</td>
                    <td className="p-3 text-slate-700">{row.manual}</td>
                    <td className="p-3">{row.ps}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* WHO IT’S FOR */}
      <section className="section">
        <div className="container">
          <h2 className="heading-2">Built for speed across your pipeline</h2>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {AUDIENCES.map((a) => (
              <div key={a.title} className="card p-6">
                <div className="flex items-start gap-3">
                  <div className="icon-wrap">{a.icon}</div>
                  <div>
                    <h3 className="card-title">{a.title}</h3>
                    <p className="card-text">{a.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECURITY / COMPLIANCE */}
      <section className="section">
        <div className="container card p-6">
          <h2 className="heading-2">Data handling & privacy</h2>
          <ul className="mt-3 small text-slate-700 space-y-2 list-disc pl-5">
            <li>
              <strong>GDPR-aligned design:</strong> clear user consent flows, minimal personal data by default.
            </li>
            <li>
              <strong>Export control:</strong> you choose what to share — PDFs and spreadsheets are generated on demand.
            </li>
            <li>
              <strong>Transparency:</strong> every financial figure links back to a line item and assumption.
            </li>
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="section">
        <div className="container">
          <h2 className="heading-2">FAQs</h2>
          <dl className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {FAQS.map((f) => (
              <div key={f.q} className="card p-5">
                <dt className="font-semibold">{f.q}</dt>
                <dd className="small mt-1 text-slate-700">{f.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="section">
        <div className="container">
          <div className="cta">
            <div>
              <h3 className="heading-cta">See your deal in minutes</h3>
              <p className="cta-copy">
                Paste a URL, get valuation, refurb lines, and ROI — ready to share.
              </p>
            </div>
            {/* 🔑 changed to /demo-access */}
            <Link href="/demo-access" className="btn btn-onColor">
              Open the live demo <ArrowRight />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

/* ----------------- helpers & icons ----------------- */

function Chip({ color = "emerald", children }: { color?: "emerald" | "sky" | "violet"; children: ReactNode }) {
  const cls = "chip " + (color === "emerald" ? "chip-emerald" : color === "sky" ? "chip-sky" : "chip-violet")
  return <span className={cls}>{children}</span>
}

function ListItem({ bold, text }: { bold: string; text: string }) {
  return (
    <li className="flex items-start gap-2">
      <Check />
      <span>
        <strong>{bold}</strong> {text}
      </span>
    </li>
  )
}

function Pill({ children }: { children: ReactNode }) {
  return <span className="inline-flex items-center rounded-full border px-3 py-1 small">{children}</span>
}

function ArrowDivider() {
  return (
    <span className="hidden lg:flex items-center justify-center text-slate-400">
      <ArrowRight />
    </span>
  )
}

/* ----------------- tiny icons ----------------- */

function ArrowRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path d="M5 12h14m-6-6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function Play() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 5v14l11-7-11-7z" />
    </svg>
  )
}
function Check() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function Spark() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8L12 2z" />
    </svg>
  )
}
function Dot({ color = "#16a34a" }: { color?: string }) {
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden>
      <circle cx="4" cy="4" r="4" fill={color} />
    </svg>
  )
}

/* ----------------- data ----------------- */

const STEPS = [
  {
    title: "Paste a URL",
    desc: "Rightmove, Zoopla, auctions… if it’s public and structured, we can ingest it.",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M4 7h16M4 12h10M4 17h7" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "We fetch & compute",
    desc: "Extraction, refurb model, fee math, rents/values check — computed in seconds.",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M12 3v6m0 6v6M3 12h6m6 0h6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "You export & share",
    desc: "Outputs designed for investors, lenders, and partners.",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M4 4h16v16H4z" />
      </svg>
    ),
  },
]

const FEATURES = [
  {
    title: "Refurb engine",
    desc: "Room-by-room costing, with configurable bands and contingency logic.",
    points: ["Auto-detects kitchens/baths", "Handles damp & structural", "Custom bands per investor"],
    icon: <Spark />,
  },
  {
    title: "Financial stack",
    desc: "Covers purchase → exit, with yields, ROIs, and sensitivity toggles.",
    points: ["Stamp duty, legal, survey", "Void assumptions", "Variable leverage"],
    icon: <Spark />,
  },
  {
    title: "Export suite",
    desc: "Client-ready docs, instantly shareable.",
    points: ["Polished PDF deck", "Excel with line items", "White-label options"],
    icon: <Spark />,
  },
]

const COMPARISON = [
  { dim: "Speed", manual: "Hours of spreadsheets", ps: "Minutes" },
  { dim: "Transparency", manual: "Ad hoc, hidden formulas", ps: "Every assumption visible" },
  { dim: "Credibility", manual: "Error-prone, inconsistent", ps: "Consistent, repeatable, backed by data" },
  { dim: "Shareability", manual: "Messy files", ps: "Clean PDF & Excel" },
]

const AUDIENCES = [
  { title: "Investors", desc: "Quick appraisals, apples-to-apples comparisons.", icon: <Spark /> },
  { title: "Agents & sourcers", desc: "Professional packs to share with buyers.", icon: <Spark /> },
  { title: "Lenders", desc: "Consistent inputs for credit models.", icon: <Spark /> },
]

const FAQS = [
  {
    q: "Can I export the analysis?",
    a: "Yes — polished PDF for clients, Excel for your deep dive.",
  },
  {
    q: "How accurate are refurb estimates?",
    a: "They’re broad bands, tuned by room type and investor settings. Always validate before offers.",
  },
  {
    q: "Do you store my URLs?",
    a: "Only transiently for computation. No resale or secondary use.",
  },
  {
    q: "Can I customise assumptions?",
    a: "Yes — yields, voids, fees, maintenance are all tweakable.",
  },
]
