"use client";

import Link from "next/link";
import { type ReactNode, useState } from "react";

export default function LandingPage() {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  return (
    <div className="bg-white dark:bg-slate-950">
      {/* HERO with animated gradient background */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        {/* Animated mesh gradient background */}
        <div className="absolute inset-0 bg-gradient-mesh opacity-60 dark:opacity-40" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 dark:bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 dark:bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-cyan-500/10 dark:bg-cyan-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="container relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          <div className="lg:col-span-7 space-y-8">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-medium border border-emerald-200 dark:border-emerald-800 animate-fadeIn">
              <Dot /> Pre-screening tool for property investors
            </span>

            <h1 className="heading-hero animate-slideUp">
              Filter 100 property listings down to the 10 worth viewing.
            </h1>

            <p className="subhead max-w-[65ch] animate-slideUp delay-100">
              PropVisions analyses everything you'd normally check manually—photos, EPC ratings, local rents, refurb costs, running costs, and ROI—then tells you which properties are worth a site visit. Stop wasting time viewing deals that don't stack up on paper.
            </p>

            <div className="mt-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-200 dark:border-blue-800 animate-slideUp delay-150">
              <p className="text-sm text-slate-700 dark:text-slate-300 font-medium mb-2">How it works:</p>
              <ol className="text-sm text-slate-600 dark:text-slate-400 space-y-1.5 list-decimal pl-5">
                <li>Paste property links from Rightmove, Zoopla, or OnTheMarket (or batch upload up to 100)</li>
                <li>We analyse: listing photos, EPC data, local rental prices, renovation needs, purchase costs, and running expenses</li>
                <li>In 5 minutes, you get a report showing: refurb costs, rental income, cash flow, ROI, and whether it's worth viewing</li>
                <li>Download the PDF, share with partners, and only visit properties that pass the desk check</li>
                <li>This is pre-screening. You still do site visits, professional surveys, and builder quotes on the ones that make sense.</li>
              </ol>
            </div>

            <div className="flex flex-wrap gap-4 animate-slideUp delay-200">
              <Link href="/book-demo" className="btn btn-primary px-6 py-3 text-base shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
                Book a demo
              </Link>
              <a href="#walkthrough" className="btn btn-outline px-6 py-3 text-base hover:scale-105 transition-all duration-300">
                Watch walkthrough
              </a>
            </div>

            {/* Quick trust list */}
            <ul className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-slate-700 dark:text-slate-300">
              {[
                { icon: "🔍", text: "Filter 100s of listings quickly" },
                { icon: "⚡", text: "5 minutes per property" },
                { icon: "✓", text: "Only visit the good ones" }
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2 animate-slideUp" style={{ animationDelay: `${300 + i * 50}ms` }}>
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Video card with premium design */}
          <div className="lg:col-span-5 animate-slideInRight">
            <div className="card overflow-hidden hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] border-2 dark:border-slate-700">
              <div className="card-header flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
                <span className="font-semibold">Product walkthrough</span>
                <span className="badge-emerald">2 min</span>
              </div>
              <div className="aspect-video bg-black" id="walkthrough">
                <video className="h-full w-full" controls playsInline preload="metadata" poster="/demo-poster.jpg">
                  <source src="/PropVisions Demo.mp4" />
                  <source src="/demo.mp4" type="video/mp4" />
                  Your browser does not support embedded videos.
                </video>
              </div>
              <div className="card-footer flex items-center justify-between">
                <span className="small text-slate-600 dark:text-slate-400">Two-minute overview of the core flow.</span>
                <Link
                  href="/how-it-works"
                  className="ml-4 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
                >
                  See how it works →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* POSITIONING with glassmorphism */}
      <section className="py-24 bg-slate-50 dark:bg-slate-900/50 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-radial opacity-50" />

        <div className="container relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-7 space-y-6">
            <h2 className="text-4xl font-bold animate-slideUp">
              We don't replace your process. <span className="text-gradient">We filter before you visit.</span>
            </h2>

            <p className="text-xl text-slate-700 dark:text-slate-300 leading-relaxed max-w-[65ch] animate-slideUp delay-100">
              PropVisions is a pre-screening tool. We check all the factors you'd normally research—photos, EPC ratings, rental comparables,
              refurbishment costs, running expenses—and calculate if the numbers work. This lets you filter hundreds of portal listings down
              to a shortlist of properties actually worth visiting. You still do site visits, professional valuations, and builder quotes.
              We just make sure you only spend time on deals that pass the desk check.
            </p>

            <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">What we analyse in each report:</p>
              <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                <li>• Photos - room condition, renovation needs, finish quality</li>
                <li>• EPC data - current rating, energy costs, upgrade potential</li>
                <li>• Local rental prices - comparable properties in the area</li>
                <li>• Renovation costs - room-by-room breakdown with regional rates</li>
                <li>• Purchase & running costs - stamp duty, mortgage, insurance, maintenance</li>
                <li>• Cash flow & ROI - monthly profit, annual return, payback period</li>
              </ul>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                This analysis helps you decide which properties deserve a site visit. It doesn't replace viewings, surveys, or professional quotes.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mt-8">
              {[
                { icon: "🚀", title: "Batch upload", desc: "Process up to 100 properties at once" },
                { icon: "🏠", title: "Photo-based refurb", desc: "Room-level pricing with regional rates" },
                { icon: "📈", title: "Transparent estimates", desc: "Rent estimates and valuations with full rationale" },
                { icon: "⏱️", title: "Under 5 min per run", desc: "Fast analysis with export-ready outputs" }
              ].map((item, i) => (
                <div
                  key={i}
                  className="rounded-2xl border-2 border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-slate-900 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-xl transition-all duration-500 hover:scale-105 animate-scaleIn"
                  style={{ animationDelay: `${200 + i * 100}ms` }}
                >
                  <div className="text-3xl mb-3">{item.icon}</div>
                  <div className="font-semibold text-slate-900 dark:text-slate-100 mb-1">{item.title}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Value creation card with gradient border */}
          <div className="lg:col-span-5 animate-slideInRight delay-200">
            <div className="rounded-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-[2px] shadow-2xl">
              <div className="rounded-2xl bg-white dark:bg-slate-900 p-8 h-full">
                <h3 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Who uses PropVisions
                </h3>
                <ul className="space-y-4 text-slate-700 dark:text-slate-300">
                  {[
                    { icon: "💼", title: "Property investors", desc: "Fast, defendable underwriting for BTL deals" },
                    { icon: "🎯", title: "Sourcers & packagers", desc: "Professional deal packs for clients" },
                    { icon: "🏗️", title: "Developers", desc: "Quick refurb estimates before committing quotes" },
                    { icon: "🏢", title: "Estate agents", desc: "Value-add service for investor clients" }
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 group hover:translate-x-2 transition-transform duration-300">
                      <span className="text-2xl">{item.icon}</span>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{item.title}</div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">{item.desc}</div>
                      </div>
                    </li>
                  ))}
                </ul>
                <Link href="/book-demo" className="btn btn-primary w-full mt-8 justify-center hover:scale-105 transition-transform duration-300">
                  Book a demo
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES with hover interactions */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-mesh opacity-30" />

        <div className="container relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          <div className="lg:col-span-6 space-y-8">
            <h2 className="text-4xl font-bold animate-slideUp">
              What PropVisions <span className="text-gradient">delivers</span>
            </h2>

            <ul className="space-y-5 text-slate-700 dark:text-slate-300">
              {FEATURES.map((feature, i) => (
                <li
                  key={i}
                  className="group animate-slideUp"
                  style={{ animationDelay: `${i * 50}ms` }}
                  onMouseEnter={() => setHoveredFeature(i)}
                  onMouseLeave={() => setHoveredFeature(null)}
                >
                  <div className={`
                    rounded-xl border-2 p-5 transition-all duration-500 cursor-pointer
                    ${hoveredFeature === i
                      ? 'border-blue-500 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-950/50 shadow-xl translate-x-2'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-lg'
                    }
                  `}>
                    <div className="flex items-start gap-4">
                      <div className={`
                        flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all duration-500
                        ${hoveredFeature === i ? 'bg-blue-500 scale-110 rotate-6' : 'bg-slate-100 dark:bg-slate-800'}
                      `}>
                        {feature.icon}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-lg text-slate-900 dark:text-slate-100 mb-1">{feature.title}</div>
                        <div className="text-sm leading-relaxed">{feature.desc}</div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
            >
              See how it works →
            </Link>
          </div>

          {/* Snapshot card with glass effect */}
          <div className="lg:col-span-6 animate-slideInRight delay-300">
            <div className="card p-8 backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border-2 dark:border-slate-700 hover:shadow-2xl transition-all duration-500">
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-4 font-medium">Example Analysis</div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                {[
                  ["Post-works value", "£245,000"],
                  ["Total works", "£18,600"],
                  ["Net yield (yr 1)", "8.4%"],
                  ["Annual net", "£12,140"],
                ].map(([k, v], i) => (
                  <div key={k} className="rounded-xl border-2 border-slate-200 dark:border-slate-800 p-4 hover:border-blue-500 dark:hover:border-blue-400 hover:scale-105 transition-all duration-300 animate-scaleIn" style={{ animationDelay: `${i * 50}ms` }}>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">{k}</div>
                    <div className="text-xl font-bold text-slate-900 dark:text-slate-100">{v}</div>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border-2 border-slate-200 dark:border-slate-800 overflow-hidden hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-300">
                <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Works (by room)</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">4 items</span>
                </div>
                <div className="divide-y dark:divide-slate-800">
                  {[
                    ["Kitchen", "£7,900"],
                    ["Bathroom", "£4,150"],
                    ["Bedroom (x2)", "£3,400"],
                    ["Electrics (partial)", "£3,150"],
                  ].map(([room, total], i) => (
                    <div key={room} className="flex items-center justify-between px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors duration-200">
                      <span className="text-sm text-slate-700 dark:text-slate-300">{room}</span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{total}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mt-6">
                <Link href="/book-demo" className="btn btn-primary flex-1 justify-center hover:scale-105 transition-transform duration-300">
                  Book a demo
                </Link>
                <Link href="/pricing" className="btn btn-outline flex-1 justify-center hover:scale-105 transition-transform duration-300">
                  View pricing
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* COVERAGE with modern design */}
      <section className="py-24 bg-slate-50 dark:bg-slate-900/50">
        <div className="container grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-7 space-y-6 animate-slideUp">
            <h2 className="text-3xl font-bold">Supported portals & coverage</h2>
            <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed max-w-[65ch]">
              PropVisions works with major UK portals including Rightmove (best coverage), Zoopla, and OnTheMarket.
              Coverage varies by source and listing type. EPC data is fetched from the official UK government register
              where available. Floorplan mapping improves accuracy when plans are present in the listing.
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400 italic">
              Most runs complete in under 5 minutes—actual time depends on image count and data sources.
            </p>
          </div>

          <div className="lg:col-span-5 animate-slideInRight delay-200">
            <div className="rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 hover:shadow-xl transition-all duration-500">
              <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-slate-100">Coming soon</h3>
              <ul className="space-y-3 text-slate-700 dark:text-slate-300">
                {[
                  "Mortgage trigger with forward rates",
                  "HMO, Airbnb, and social housing scenarios",
                  "Portfolio dashboards (Investment & Management views)",
                  "Off-market sourcing (probate, distress, stale listings)"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 group hover:translate-x-2 transition-transform duration-300">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="flex-shrink-0 mt-0.5">
                      <circle cx="10" cy="10" r="3" fill="#3b82f6" className="group-hover:animate-pulse" />
                    </svg>
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/roadmap" className="btn btn-outline w-full mt-6 justify-center hover:scale-105 transition-transform duration-300">
                View full roadmap
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA with gradient */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 opacity-5 dark:opacity-10" />

        <div className="container relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h3 className="text-4xl sm:text-5xl font-extrabold animate-slideUp">
              Ready to get <span className="text-gradient">started</span>?
            </h3>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto animate-slideUp delay-100">
              See a 5-minute live run and get a free trial analysis credit.
            </p>
            <Link
              href="/book-demo"
              className="btn btn-primary px-8 py-4 text-lg font-medium rounded-xl shadow-2xl hover:shadow-blue-500/50 hover:scale-110 transition-all duration-300 inline-flex items-center gap-2 animate-scaleIn delay-200"
            >
              Book a demo
              <span className="text-xl">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Timing note */}
      <section className="py-6 bg-slate-50 dark:bg-slate-900/50 border-t dark:border-slate-800">
        <div className="container text-center text-sm text-slate-600 dark:text-slate-400 italic">
          Most runs complete in under 5 minutes—actual time depends on image count and data sources.
        </div>
      </section>
    </div>
  );
}

const FEATURES = [
  {
    icon: "🎯",
    title: "Instant deal analysis",
    desc: "Paste a listing URL or batch upload up to 100 properties—get structured data for each in minutes."
  },
  {
    icon: "🏗️",
    title: "Room-by-room refurb pricing",
    desc: "Photo analysis identifies condition and maps work to floorplans where available. Regional builder rates, missing-room alerts, and agent nudges included."
  },
  {
    icon: "⚡",
    title: "EPC matching & upgrade suggestions",
    desc: "Fetches official EPC data and shows upgrade paths with expected uplift."
  },
  {
    icon: "📊",
    title: "Rent estimation & valuation",
    desc: "Combines regional baselines with regression adjusted by listing signals. Outputs include full rationale."
  },
  {
    icon: "💰",
    title: "Full financials & scenarios",
    desc: "SDLT, fees, voids, management, maintenance, mortgage options. Compare BTL, simple exit, and more."
  },
  {
    icon: "📄",
    title: "Export-ready reports",
    desc: "Investor PDF and builder quote PDF—both brandable for client delivery."
  },
] as const;

function Dot() {
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden>
      <circle cx="4" cy="4" r="4" fill="#059669" />
    </svg>
  );
}
