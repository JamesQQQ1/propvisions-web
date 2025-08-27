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
            <span className="badge" aria-label="Live demo available">
              <Dot color="#10b981" />
              Live demo — no sign-up
            </span>

            <h1 className="heading-hero">
              From raw listing to <span className="text-gradient">investor-ready ROI</span> — fast, auditable, shareable
            </h1>

            <p className="subhead">
              PropVisions ingests a property link, estimates refurbishment from photos, checks rents and values,
              and computes full-stack financials with <em>every</em> assumption surfaced — exportable to PDF &amp; Excel.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link href="/demo-access" className="btn btn-primary" aria-label="Open PropVisions live demo">
                Try the live demo <ArrowRight />
              </Link>
              <a href="#walkthrough" className="btn btn-outline" aria-label="Watch product walkthrough video">
                Watch the walkthrough <Play />
              </a>
            </div>

            {/* Micro stats */}
            <div className="flex flex-wrap items-center gap-5 small" aria-label="Key product metrics">
              <Chip color="emerald">~30–90s</Chip><span>End-to-end run</span>
              <Chip color="sky">PDF • Excel</Chip><span>Client-ready</span>
              <Chip color="violet">Line-items</Chip><span>Fully traceable</span>
            </div>

            {/* Trust row */}
            <div className="mt-6 grid grid-cols-3 sm:grid-cols-6 gap-4 items-center opacity-70">
              {["Investors", "Agents", "Sourcers", "Auctions", "Lenders", "Analysts"].map((label) => (
                <div
                  key={label}
                  className="h-8 rounded-md border border-slate-200 grid place-items-center text-[11px] text-slate-500"
                  aria-label={label}
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Beta note (transparent) */}
            <div className="mt-2 small text-slate-600">
              <strong>Beta honesty:</strong> Rightmove/Zoopla ingestion is gated due to partner/API restrictions. The demo uses
              agent/auction and open-sourceable pages. Full portal integrations are planned for public launch with compliant APIs,
              de-duplication, and source prioritisation.
            </div>
          </div>

          {/* Hero video frame */}
          <div className="lg:col-span-5">
            <div className="card overflow-hidden">
              <div className="card-header">Product walkthrough</div>
              <div className="aspect-video w-full bg-black" id="walkthrough">
                {HAS_YT ? (
                  <iframe
                    className="h-full w-full"
                    src={`https://www.youtube.com/embed/${YT_ID}?rel=0`}
                    title="PropVisions demo"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                ) : (
                  <video className="h-full w-full" controls playsInline preload="metadata" poster="/demo-poster.jpg">
                    <source src="/demo.mp4" type="video/mp4" />
                  </video>
                )}
              </div>
              <div className="card-footer">
                <span className="small">Two-minute overview of the core flow.</span>
                <Link href="/demo-access" className="link" aria-label="Open the live demo">Open the live demo →</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHAT WORKS TODAY */}
      <section className="section">
        <div className="container grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7 space-y-4">
            <h2 className="heading-2">What works today (live in the demo)</h2>
            <ul className="mt-3 space-y-3 small text-slate-700">
              <ListItem bold="URL → structured data." text="Ingests many agent/auction pages into clean fields (price, layout, images, agent, postcode)." />
              <ListItem bold="Refurb from photos." text="Room-by-room line-items (paint, flooring, electrics, plumbing, damp, structure) with adjustable contingencies." />
              <ListItem bold="Rent & value checks." text="Hybrid approach combining local priors and listing signals to produce rent bands and a post-refurb value." />
              <ListItem bold="Full financials." text="Stamp duty, legals/survey/insurance, voids, management, leverage → net income, yield, ROI." />
              <ListItem bold="Exports." text="Polished PDF deck + Excel with every line item; ready to share with investors and lenders." />
              <ListItem bold="Alerts & logging." text="Run metadata, basic notifications, clean error handling." />
            </ul>

            <div className="mt-4 flex gap-3">
              <Link href="/demo-access" className="btn btn-primary" aria-label="Paste a property URL">
                Try it with a URL <ArrowRight />
              </Link>
              <a href="#limitations" className="btn btn-outline" aria-label="Read current limitations">
                Read current limitations
              </a>
            </div>
          </div>

          {/* Snapshot card */}
          <div className="lg:col-span-5">
            <div className="card p-5">
              <div className="flex items-center justify-between">
                <span className="small font-medium text-slate-900">Financial snapshot (example)</span>
                <span className="badge badge-emerald"><Spark /> Auto-computed</span>
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
                    <div key={room} className="flex items-center justify-between px-3 py-2 text-sm">
                      <span>{room}</span>
                      <span className="font-medium">{total}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-end">
                <button className="link small" type="button" aria-label="Open full financial model">
                  Open full model →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LIMITATIONS & ROADMAP */}
      <section id="limitations" className="section">
        <div className="container grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7 space-y-4">
            <h2 className="heading-2">Current limitations & what’s coming</h2>
            <div className="card p-5 small text-slate-700 space-y-3">
              <div>
                <strong>Portal coverage (Rightmove/Zoopla):</strong> Not enabled in the public demo. We’re pursuing compliant API/partner routes.
                At launch: unified search, de-duplication across sources, and prioritised canonical records by address+agent+media.
              </div>
              <div>
                <strong>Accuracy bands:</strong> Estimates reflect listing quality and regional nuance. You’ll see confidence indicators and can
                directly tweak assumptions (management%, voids, maintenance, leverage).
              </div>
              <div>
                <strong>Mortgage module:</strong> Today we include standard assumptions. Launch will add IO/repayment, product fees, ERC modelling,
                and forward-rate scenarios to optimise remortgage timing.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {ROADMAP.map((r) => (
                <div key={r.title} className="card p-4">
                  <div className="small font-semibold">{r.title}</div>
                  <ul className="mt-2 small text-slate-700 list-disc pl-5 space-y-1">
                    {r.points.map((p, i) => <li key={i}>{p}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Why we’re different */}
          <div className="lg:col-span-5">
            <div className="card p-6">
              <h3 className="card-title">Why PropVisions is different</h3>
              <ul className="mt-3 small text-slate-700 space-y-2 list-disc pl-5">
                <li><strong>Automation across the flow:</strong> ingestion → analysis → reporting → alerts.</li>
                <li><strong>Transparency by default:</strong> every figure maps back to a line-item and an assumption.</li>
                <li><strong>Human-in-the-loop:</strong> quick tweaks become area priors to improve future runs.</li>
                <li><strong>Shareable outputs:</strong> PDFs and spreadsheets your clients can actually use.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section">
        <div className="container">
          <h2 className="heading-2">How the pipeline works</h2>
          <p className="small mt-1 text-slate-600">
            A compressed path from link → analysis → shareable pack, with validation and error handling at each step.
          </p>

          <ol className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map((s, i) => (
              <li key={s.title} className="card p-6 relative">
                <span className="step-index" aria-hidden>{i + 1}</span>
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

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-3 small" aria-label="Pipeline overview">
            <Pill>Scrape &amp; structure</Pill><ArrowDivider />
            <Pill>Images → refurb lines</Pill><ArrowDivider />
            <Pill>Fees/taxes/voids</Pill><ArrowDivider />
            <Pill>Cash-flow &amp; ROI</Pill><ArrowDivider />
            <Pill>PDF &amp; Excel exports</Pill>
          </div>
        </div>
      </section>

      {/* MODULE DEEP DIVE */}
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
                  {f.points.map((p, idx) => <li key={idx}>{p}</li>)}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* COMPARISON */}
      <section className="section">
        <div className="container">
          <h2 className="heading-2">Manual workflow vs PropVisions</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm border rounded-xl overflow-hidden">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <th className="p-3 text-left">Dimension</th>
                  <th className="p-3 text-left">Manual / spreadsheets</th>
                  <th className="p-3 text-left">PropVisions</th>
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
          <h2 className="heading-2">Data handling &amp; privacy</h2>
          <ul className="mt-3 small text-slate-700 space-y-2 list-disc pl-5">
            <li><strong>GDPR-aligned by design:</strong> clear consent flows; minimal personal data by default.</li>
            <li><strong>Export control:</strong> you choose what to share — PDFs and spreadsheets are generated on demand.</li>
            <li><strong>Traceability:</strong> every financial figure maps to a line-item and assumption.</li>
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
              <p className="cta-copy">Paste a URL — get refurb lines, value, and ROI you can share immediately.</p>
            </div>
            <Link href="/demo-access" className="btn btn-onColor" aria-label="Open PropVisions live demo">
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
      <span><strong>{bold}</strong> {text}</span>
    </li>
  )
}

function Pill({ children }: { children: ReactNode }) {
  return <span className="inline-flex items-center rounded-full border px-3 py-1 small">{children}</span>
}

function ArrowDivider() {
  return (
    <span className="hidden lg:flex items-center justify-center text-slate-400" aria-hidden>
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

const FEATURES = [
  {
    title: "Refurb engine",
    desc: "Room-by-room costing with configurable bands and contingency.",
    points: ["Auto-detects kitchens/bathrooms", "Handles damp & structural", "Per-investor cost bands"],
    icon: <Spark />,
  },
  {
    title: "Financial stack",
    desc: "Purchase → exit: yields, ROI, leverage, and sensitivity toggles.",
    points: ["Stamp duty, legals, survey", "Voids & management", "Debt modelling"],
    icon: <Spark />,
  },
  {
    title: "Export suite",
    desc: "Client-ready documents, instantly shareable.",
    points: ["Polished PDF deck", "Excel with line items", "White-label options"],
    icon: <Spark />,
  },
] as const

const COMPARISON = [
  { dim: "Speed", manual: "Hours of spreadsheets", ps: "Minutes" },
  { dim: "Transparency", manual: "Ad-hoc, hidden formulas", ps: "Every assumption visible" },
  { dim: "Credibility", manual: "Error-prone, inconsistent", ps: "Consistent, repeatable, data-backed" },
  { dim: "Shareability", manual: "Messy files", ps: "Clean PDF & Excel" },
] as const

const AUDIENCES = [
  { title: "Investors", desc: "Quick appraisals and like-for-like comparisons.", icon: <Spark /> },
  { title: "Agents & sourcers", desc: "Professional packs to share with buyers.", icon: <Spark /> },
  { title: "Lenders", desc: "Consistent inputs for credit models.", icon: <Spark /> },
] as const

const STEPS = [
  {
    title: "Paste a URL",
    desc: "Agent/auction and other compatible pages ingest to clean fields.",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
        <path d="M4 7h16M4 12h10M4 17h7" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "We fetch & compute",
    desc: "Extraction, refurb modelling, fee math, rents/values checks — computed in seconds.",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
        <path d="M12 3v6m0 6v6M3 12h6m6 0h6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "You export & share",
    desc: "Outputs designed for investors, lenders, and partners.",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
        <path d="M4 4h16v16H4z" />
      </svg>
    ),
  },
] as const

const ROADMAP = [
  {
    title: "Launch (Public)",
    points: [
      "Unified search across integrated sources",
      "Compliant Rightmove/Zoopla ingestion",
      "De-duplication & canonical records",
    ],
  },
  {
    title: "Off-Market & Alerts",
    points: [
      "GDPR-compliant outreach toolkit",
      "Status-change watcher: new/price-drop/returning",
      "Saved searches & daily digests",
    ],
  },
  {
    title: "Mortgage & Forecasts",
    points: [
      "IO/repayment, product fees, ERCs",
      "Forward-rate scenarios & DSCR/ICR",
      "Remortgage timing assistant",
    ],
  },
] as const

const FAQS = [
  { q: "Do you support Rightmove & Zoopla?", a: "Not in the public demo. We plan compliant integrations at launch with de-duplication and source prioritisation." },
  { q: "How accurate are refurb estimates?", a: "Banded by room type and region; confidence depends on image quality. Always validate before offers." },
  { q: "Can I export the analysis?", a: "Yes — polished PDF for clients, and Excel with every line item for deep dives." },
  { q: "Can I customise assumptions?", a: "Yes — voids, management, maintenance, leverage, and more — recalc instantly." },
] as const
