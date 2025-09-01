"use client";

import Link from "next/link";
import { type ReactNode } from "react";

/* -----------------------------------------------------------
   Page
----------------------------------------------------------- */

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
              Not another research portal. PropVisions is your <b>underwriting co-pilot</b>:
              paste a property link and get <b>works from photos</b>, rent band and end value,
              plus full fees and <b>ROI</b> — with sources and assumptions shown. Export clean
              PDF & Excel for lenders and clients in minutes.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/book-demo" className="btn btn-primary">Book a demo</Link>
              <a href="#walkthrough" className="btn btn-outline">Watch walkthrough</a>
            </div>

            {/* Quick trust list */}
            <ul className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-slate-700">
              <li className="flex items-center gap-2">
                <CheckIcon /> <span>~90 seconds per deal</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon /> <span>PDF & Excel included</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon /> <span>Sources, ranges & audit trail</span>
              </li>
            </ul>

            {/* Reliability/value strip */}
            <ul className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs text-slate-600">
              <li className="flex items-center gap-2"><CheckIcon /> <span>Quality-checked outputs</span></li>
              <li className="flex items-center gap-2"><CheckIcon /> <span>99.9% uptime target</span></li>
              <li className="flex items-center gap-2"><CheckIcon /> <span>Change history for every figure</span></li>
              <li className="flex items-center gap-2"><CheckIcon /> <span>Works with your existing tools</span></li>
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
                <Link
                  href="/how-it-works"
                  className="ml-4 underline decoration-slate-300 underline-offset-4 hover:decoration-current"
                >
                  See how it works →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* POSITIONING — where we sit & how you win */}
      <section className="py-20 bg-slate-50">
        <div className="container grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-7 space-y-5">
            <h2 className="heading-2">Your underwriting co-pilot (not just another dashboard)</h2>
            <p className="text-slate-700 leading-relaxed max-w-[65ch]">
              Keep using your favourite tools to <b>find</b> stock. Use PropVisions to <b>underwrite & decide</b> —
              consistently, quickly, and with full transparency. We turn a single URL into the <b>decision pack</b>:
              works from photos, rent ranges, ROI and mortgage scenarios, energy rating and comparables — with ranges, sources,
              and change history. It’s the <b>layer that standardises decisions</b> across your team, rather than another place
              to browse listings.
            </p>
            <ul className="grid sm:grid-cols-2 gap-3 text-sm">
              <li className="rounded-xl border p-3"><b>Find & research:</b> Keep Property Engine, PMI and your market dashboards</li>
              <li className="rounded-xl border p-3"><b>Underwrite & decide:</b> Run PropVisions for the complete, traceable pack</li>
              <li className="rounded-xl border p-3"><b>Share & export:</b> Lender/client-ready PDF & Excel in minutes</li>
              <li className="rounded-xl border p-3"><b>Improve over time:</b> Your edits train local accuracy</li>
            </ul>
            <div>
              <Link href="/accuracy" className="underline decoration-slate-300 underline-offset-4 hover:decoration-current">
                Read the accuracy plan →
              </Link>
            </div>
          </div>

          {/* Value creation card */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border p-6 h-full flex flex-col justify-between">
              <div>
                <h3 className="card-title">Why this isn’t “just an add-on”</h3>
                <ul className="mt-3 small text-slate-700 space-y-2 list-disc pl-5">
                  <li><b>Cut underwriting time</b> from hours to minutes per deal</li>
                  <li><b>Make faster, defendable bids</b> with clear ranges & assumptions</li>
                  <li><b>Standardise packs</b> across your team (one source of truth)</li>
                  <li><b>Spot margin instantly</b> (works, rent, fees sensitivity)</li>
                  <li><b>Close faster</b> with lender-friendly exports and comps</li>
                </ul>
              </div>
              <div className="pt-6">
                <Link href="/book-demo" className="btn btn-outline">See it on your patch</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHAT YOU GET */}
      <section className="py-20">
        <div className="container grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          <div className="lg:col-span-6 space-y-6">
            <h2 className="heading-2 max-w-[22ch]">What you get on every run</h2>
            <ul className="space-y-3 text-slate-700 leading-relaxed">
              <Li title="URL → structured fields">
                Pull agent/auction pages into clean fields (price, layout, images, agent, postcode).
              </Li>
              <Li title="Works from photos">
                Room-level scope (paint, flooring, electrics, plumbing, damp, structure) with regional trade ranges and a contingency slider.
              </Li>
              <Li title="Rent & value">
                Combine local history with listing details to produce rent ranges and post-works value, with confidence shown.
              </Li>
              <Li title="Full financials">
                Stamp duty, legals/survey/insurance, voids, management, mortgage → net income, yield, cash flow, ROI.
              </Li>
              <Li title="Exports">
                Lender/client-ready PDF snapshot and a fully traceable Excel with every line and assumption.
              </Li>
              <Li title="Traceability">
                Each figure links to its source; tweaks update results instantly.
              </Li>
            </ul>
            <div className="pt-2">
              <Link
                href="/how-it-works"
                className="underline decoration-slate-300 underline-offset-4 hover:decoration-current"
              >
                See the process in detail →
              </Link>
            </div>
          </div>

          {/* Snapshot card */}
          <div className="lg:col-span-6">
            <div className="card p-6 space-y-6">
              <div>
                <div className="small text-slate-600">Snapshot (example)</div>
                <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                  {[
                    ["Post-works value", "£245,000"],
                    ["Total works", "£18,600"],
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
                  <span className="font-medium text-slate-900">Works (by room)</span>
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

      {/* ACCURACY / ROADMAP TEASERS */}
      <section className="py-20 bg-slate-50">
        <div className="container grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-7 space-y-4">
            <h2 className="heading-2">Accuracy & confidence</h2>
            <p className="text-slate-700 leading-relaxed max-w-[65ch]">
              Confidence reflects listing quality and local nuance. We show ranges for rent and works, flag when comparables are thin,
              and improve with your edits in each postcode.
            </p>
            <ul className="grid sm:grid-cols-2 gap-3 text-sm">
              <li className="rounded-xl border p-3"><b>Rent range:</b> Typical error under 15%; aim 80%+ within range</li>
              <li className="rounded-xl border p-3"><b>Works total:</b> Tracked vs quotes/invoices; aim under 20%</li>
              <li className="rounded-xl border p-3"><b>Energy rating:</b> Aim 95%+ match on strict checks</li>
              <li className="rounded-xl border p-3"><b>Yield/ROI:</b> Uncertainty carried through until inputs are confirmed</li>
            </ul>
            <div>
              <Link
                href="/accuracy"
                className="underline decoration-slate-300 underline-offset-4 hover:decoration-current"
              >
                Read the full methodology →
              </Link>
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="rounded-2xl border p-6 h-full flex flex-col justify-between">
              <div>
                <h3 className="card-title">Roadmap highlights</h3>
                <ul className="mt-3 small text-slate-700 space-y-2 list-disc pl-5">
                  <li>Unified search across sources</li>
                  <li>Rightmove/Zoopla integrations (compliant)</li>
                  <li>Off-market leads & deal status tracking</li>
                  <li>More mortgage options & interest-rate scenarios</li>
                </ul>
              </div>
              <div className="pt-6">
                <Link href="/roadmap" className="btn btn-outline">View full roadmap</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIAL STRIP */}
      <section className="py-24 bg-white">
        <div className="container">
          <h2 className="heading-2 text-center mb-12">What our users say</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t) => (
              <figure key={t.name} className="rounded-2xl border p-6 bg-white shadow-sm">
                <blockquote className="text-slate-800 leading-relaxed">“{t.quote}”</blockquote>
                <figcaption className="mt-4 small text-slate-600">{t.name} · {t.role}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA — strong, high-contrast stripe */}
      <section className="py-20 bg-slate-50">
        <div className="container flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="text-black max-w-lg">
            <h3 className="text-2xl font-semibold">Ready to see it on your deals?</h3>
            <p className="small text-slate-500 mt-2">
              We’ll run a live example and share the export pack — instant, investor-ready insight.
            </p>
          </div>
          <Link
            href="/book-demo"
            className="btn btn-primary px-6 py-3 text-base font-medium rounded-lg shadow-md transition"
          >
            Book a demo
          </Link>
        </div>
      </section>

    </div>
  );
}

/* -----------------------------------------------------------
   Small inline helpers
----------------------------------------------------------- */

function Li({ title, children }: { title: string; children: ReactNode }) {
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
function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const TESTIMONIALS = [
  { name: "James P.", role: "Portfolio Investor", quote: "Cuts my underwrite time to minutes. Export pack is exactly what lenders want." },
  { name: "Maya K.", role: "Buying Agent", quote: "Photo-based refurb bands are a huge head start. Still sanity-check, but it’s fast and transparent." },
  { name: "Ollie S.", role: "Sourcing Lead", quote: "Cleanest ‘URL → analysis’ flow I’ve used. Traceability is the killer feature." },
] as const;
