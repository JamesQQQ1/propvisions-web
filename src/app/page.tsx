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
              From listing URL to <span className="text-gradient">investor-ready ROI</span>
            </h1>
            <p className="subhead max-w-[60ch]">
              Filter 100 down to the best 10 in minutes—then go view only what's worth viewing.
              PropVisions turns a property link into a complete deal pack: refurb costs from photos,
              rent estimation, full financials, and export-ready reports. Runs typically complete
              in under 5 minutes (depends on image count and data sources).
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/book-demo" className="btn btn-primary">Get a ranked shortlist</Link>
              <a href="#walkthrough" className="btn btn-outline">Watch walkthrough</a>
            </div>

            {/* Quick trust list */}
            <ul className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-slate-700">
              <li className="flex items-center gap-2">
                <CheckIcon /> <span>Under 5 min per run</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon /> <span>Batch upload (up to 100)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon /> <span>PDF & Excel exports</span>
              </li>
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
            <h2 className="heading-2">Built to accelerate decisions, not replace them</h2>
            <p className="text-slate-700 leading-relaxed max-w-[65ch]">
              PropVisions doesn't replace site visits or professional quotes—it highlights which properties are worth your time.
              Paste a listing URL (or batch upload up to 100) and get room-by-room refurb pricing from photos, rent estimates
              with rationale, EPC data from the official register, and full ROI projections—all with traceable sources and ranges.
              Export investor-ready PDFs and detailed Excel breakdowns in minutes.
            </p>
            <ul className="grid sm:grid-cols-2 gap-3 text-sm">
              <li className="rounded-xl border p-3"><b>Batch upload:</b> Process up to 100 properties at once</li>
              <li className="rounded-xl border p-3"><b>Photo-based refurb:</b> Room-level pricing with regional rates</li>
              <li className="rounded-xl border p-3"><b>Transparent estimates:</b> Rent bands, valuations with confidence shown</li>
              <li className="rounded-xl border p-3"><b>Under 5 min per run:</b> Fast analysis with export-ready outputs</li>
            </ul>
          </div>

          {/* Value creation card */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border p-6 h-full flex flex-col justify-between">
              <div>
                <h3 className="card-title">Who uses PropVisions</h3>
                <ul className="mt-3 small text-slate-700 space-y-2 list-disc pl-5">
                  <li><b>Property investors:</b> Fast, defendable underwriting for BTL deals</li>
                  <li><b>Sourcers & packagers:</b> Professional deal packs for clients</li>
                  <li><b>Developers:</b> Quick refurb estimates before committing quotes</li>
                  <li><b>Estate agents:</b> Value-add service for investor clients</li>
                </ul>
              </div>
              <div className="pt-6">
                <Link href="/book-demo" className="btn btn-outline">Book a demo</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHAT YOU GET */}
      <section className="py-20">
        <div className="container grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          <div className="lg:col-span-6 space-y-6">
            <h2 className="heading-2 max-w-[22ch]">What PropVisions delivers</h2>
            <ul className="space-y-3 text-slate-700 leading-relaxed">
              <Li title="Instant deal analysis">
                Paste a listing URL or batch upload up to 100 properties—get structured data for each in minutes.
              </Li>
              <Li title="Room-by-room refurb pricing">
                Photo analysis identifies condition and maps work to floorplans where available. Regional builder rates, missing-room alerts, and agent nudges included.
              </Li>
              <Li title="EPC matching & upgrade suggestions">
                Fetches official EPC data and shows upgrade paths with expected uplift.
              </Li>
              <Li title="Rent estimation & valuation">
                Combines regional baselines with regression adjusted by listing signals. Outputs include rationale and confidence bands.
              </Li>
              <Li title="Full financials & scenarios">
                SDLT, fees, voids, management, maintenance, mortgage options. Compare BTL, simple exit, and more.
              </Li>
              <Li title="Export-ready reports">
                Investor PDF and builder quote PDF—both brandable for client delivery.
              </Li>
            </ul>
            <div className="pt-2">
              <Link
                href="/how-it-works"
                className="underline decoration-slate-300 underline-offset-4 hover:decoration-current"
              >
                See how it works →
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
                <Link href="/pricing" className="btn btn-outline">View pricing</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ACCURACY / ROADMAP TEASERS */}
      <section className="py-20 bg-slate-50">
        <div className="container grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-7 space-y-4">
            <h2 className="heading-2">Supported portals & coverage</h2>
            <p className="text-slate-700 leading-relaxed max-w-[65ch]">
              PropVisions works with major UK portals including Rightmove (best coverage), Zoopla, and OnTheMarket.
              Coverage varies by source and listing type. EPC data is fetched from the official UK government register
              where available. Floorplan mapping improves accuracy when plans are present in the listing.
            </p>
            <p className="text-sm text-slate-600 italic">
              Most runs complete in under 5 minutes—actual time depends on image count and data sources.
            </p>
          </div>
          <div className="lg:col-span-5">
            <div className="rounded-2xl border p-6 h-full flex flex-col justify-between">
              <div>
                <h3 className="card-title">Coming soon</h3>
                <ul className="mt-3 small text-slate-700 space-y-2 list-disc pl-5">
                  <li>Mortgage trigger with forward rates</li>
                  <li>HMO, Airbnb, and social housing scenarios</li>
                  <li>Portfolio dashboards (Investment & Management views)</li>
                  <li>Off-market sourcing (probate, distress, stale listings)</li>
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
            <h3 className="text-2xl font-semibold">Ready to get started?</h3>
            <p className="small text-slate-500 mt-2">
              See a 5-minute live run and get a free trial analysis credit.
            </p>
          </div>
          <Link
            href="/book-demo"
            className="btn btn-primary px-6 py-3 text-base font-medium rounded-lg shadow-md transition"
          >
            Get a ranked shortlist
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
  { name: "James P.", role: "Portfolio Investor", quote: "Cuts underwriting from hours to minutes. Export pack is exactly what lenders want to see." },
  { name: "Maya K.", role: "Buying Agent", quote: "Photo-based refurb pricing gives us a solid starting point. Fast, transparent, and traceable." },
  { name: "Ollie S.", role: "Sourcing Lead", quote: "Cleanest URL-to-analysis flow I've used. The traceability is what makes it trustworthy." },
] as const;
