// src/app/page.tsx
"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="bg-white">
      {/* HERO — airy, conversion-focused */}
      <section className="pt-24 pb-28">
        <div className="container grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          <div className="lg:col-span-7 space-y-8">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
              <Dot /> Beta live — book a guided demo
            </span>
            <h1 className="heading-hero max-w-[18ch]">
              From raw listing to <span className="text-gradient">investor-ready ROI</span>
            </h1>
            <p className="subhead max-w-[60ch]">
              Paste a property URL. We estimate refurbishment from photos, produce rent bands and
              post-refurb value, and compute full financials — exportable to lender-friendly PDF & Excel.
              Every number is traceable to an assumption or line item.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/book-demo" className="btn btn-primary">Book a demo</Link>
              <a href="#walkthrough" className="btn btn-outline">Watch walkthrough</a>
            </div>

            {/* Quick trust chips (kept tight) */}
            <ul className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-slate-700">
              <li className="rounded-xl border p-3">~90s end-to-end run</li>
              <li className="rounded-xl border p-3">PDF & Excel included</li>
              <li className="rounded-xl border p-3">Line-item transparency</li>
            </ul>
          </div>

          {/* Video card */}
          <div className="lg:col-span-5">
            <div className="card overflow-hidden">
              <div className="card-header">Product walkthrough</div>
              <div className="aspect-video bg-black" id="walkthrough">
                <video className="h-full w-full" controls playsInline preload="metadata" poster="/demo-poster.jpg">
                  <source src="/PropVisions Demo.mp4" />
                  <source src="/demo.mp4" type="video/mp4" />
                  Your browser does not support embedded videos.
                </video>
              </div>
              <div className="card-footer flex items-center justify-between">
                <span className="small text-slate-600">Two-minute overview of the core flow.</span>
                <Link href="/how-it-works" className="link">See how it works →</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF — light, with breathing room */}
      <section className="py-16 bg-slate-50">
        <div className="container">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 items-center opacity-80">
            {["Investors", "Agents", "Sourcers", "Auctions", "Lenders", "Analysts"].map((label) => (
              <div key={label} className="h-10 rounded-lg border border-slate-200 grid place-items-center text-[12px] text-slate-500">
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VALUE SECTION — detailed but scannable (kept to 6 bullets) */}
      <section className="py-28">
        <div className="container grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          <div className="lg:col-span-6 space-y-6">
            <h2 className="heading-2 max-w-[22ch]">What you get on every run</h2>
            <ul className="space-y-3 text-slate-700 leading-relaxed">
              <Li title="URL → structured fields">
                Ingest agent/auction pages into clean fields (price, layout, images, agent, postcode).
              </Li>
              <Li title="Refurb from photos">
                Room-level scope (paint, flooring, electrics, plumbing, damp, structure) with regional trade bands and a contingency slider.
              </Li>
              <Li title="Rent & value">
                Hybrid approach using local priors + listing signals to produce rent bands and a post-refurb value with confidence.
              </Li>
              <Li title="Full financials">
                Stamp duty, legals/survey/insurance, voids, management, leverage → net income, yield, cash-flow, ROI.
              </Li>
              <Li title="Exports">
                Lender/client-ready PDF snapshot and fully-traceable Excel with every line item and assumption.
              </Li>
              <Li title="Traceability">
                Each figure maps back to an assumption or line item; tweaks instantly recalc results.
              </Li>
            </ul>
            <div className="pt-2">
              <Link href="/how-it-works" className="link">Deep dive: pipeline details →</Link>
            </div>
          </div>

          {/* Snapshot card for quick credibility */}
          <div className="lg:col-span-6">
            <div className="card p-6 space-y-6">
              <div>
                <div className="small text-slate-600">Snapshot (example)</div>
                <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                  {[
                    ["Post-refurb value", "£245,000"],
                    ["Total refurb", "£18,600"],
                    ["Net yield (yr 1)", "8.4%"],
                    ["Annual net", "£12,140"],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-xl border p-3">
                      <div className="text-slate-500">{k}</div>
                      <div className="font-medium">{v}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 small">
                  <span className="font-medium text-slate-900">Refurb (by room)</span>
                  <span className="text-slate-500">4 items</span>
                </div>
                <div className="divide-y text-sm">
                  {[
                    ["Kitchen", "£7,900"],
                    ["Bathroom", "£4,150"],
                    ["Bedroom (x2)", "£3,400"],
                    ["Electrics (partial)", "£3,150"],
                  ].map(([room, total]) => (
                    <div key={room} className="flex items-center justify-between px-4 py-2">
                      <span>{room}</span>
                      <span className="font-medium">{total}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href="/book-demo" className="btn btn-primary">Book a demo</Link>
                <Link href="/metrics" className="btn btn-outline">See live metrics</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ACCURACY / BETA HONESTY — concise with links */}
      <section className="py-20 bg-slate-50">
        <div className="container grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-7 space-y-4">
            <h2 className="heading-2">Accuracy & confidence</h2>
            <p className="text-slate-700 leading-relaxed max-w-[65ch]">
              Confidence reflects listing quality and regional nuance. We show bands for rent and refurb, prompt checks when
              comps are sparse, and learn from your edits as postcode priors.
            </p>
            <ul className="grid sm:grid-cols-2 gap-3 text-sm">
              <li className="rounded-xl border p-3"><b>Rent band:</b> MAPE & hit-rate; target ≤ 15%, ≥ 80% hit-rate</li>
              <li className="rounded-xl border p-3"><b>Refurb total:</b> MAPE vs quotes/invoices; target ≤ 20%</li>
              <li className="rounded-xl border p-3"><b>EPC match:</b> Target ≥ 95% on strict thresholds</li>
              <li className="rounded-xl border p-3"><b>Yield/ROI:</b> Propagated error; bands narrow as inputs confirm</li>
            </ul>
            <div>
              <Link href="/accuracy" className="link">Read the full methodology →</Link>
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="rounded-2xl border p-6 h-full flex flex-col justify-between">
              <div>
                <h3 className="card-title">Roadmap highlights</h3>
                <ul className="mt-3 small text-slate-700 space-y-2 list-disc pl-5">
                  <li>Unified search across sources</li>
                  <li>Compliant Rightmove/Zoopla integrations</li>
                  <li>Off-market module & deal-status watcher</li>
                  <li>Mortgage types & forward-rate scenarios</li>
                </ul>
              </div>
              <div className="pt-6">
                <Link href="/roadmap" className="btn btn-outline">View full roadmap</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIAL STRIP — short & spaced */}
      <section className="py-24">
        <div className="container grid grid-cols-1 md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((t) => (
            <figure key={t.name} className="rounded-2xl border p-6 bg-white">
              <blockquote className="text-slate-800 leading-relaxed">“{t.quote}”</blockquote>
              <figcaption className="mt-4 small text-slate-600">{t.name} · {t.role}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* FINAL CTA — clear, simple, plenty of space */}
      <section className="py-20 bg-slate-900">
        <div className="container flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="text-white">
            <h3 className="text-xl font-semibold">Ready to see it on your deals?</h3>
            <p className="small text-slate-300 mt-1">We’ll run a live example and share the export pack.</p>
          </div>
          <Link href="/book-demo" className="btn btn-onColor bg-white text-slate-900">Book a demo</Link>
        </div>
      </section>
    </div>
  );
}

/* --- tiny local bits --- */
function Li({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <li>
      <span className="font-medium text-slate-900">{title}.</span>{" "}
      <span>{children}</span>
    </li>
  );
}
function Dot() {
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden>
      <circle cx="4" cy="4" r="4" fill="#059669" />
    </svg>
  );
}
const TESTIMONIALS = [
  { name: "James P.", role: "Portfolio Investor", quote: "Cuts my underwrite time to minutes. Export pack is exactly what lenders want." },
  { name: "Maya K.", role: "Buying Agent", quote: "Photo-based refurb bands are a huge head start. Still sanity-check, but it’s fast and transparent." },
  { name: "Ollie S.", role: "Sourcing Lead", quote: "Cleanest ‘URL → analysis’ flow I’ve used. Traceability is the killer feature." },
] as const;
