"use client";

import Link from "next/link";
import { useState } from "react";

export default function HowItWorksPage() {
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);
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

        <div className="container relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-medium border border-blue-200 dark:border-blue-800 animate-fadeIn">
              <Sparkle /> Complete workflow guide
            </span>

            <h1 className="heading-hero animate-slideUp">
              How <span className="text-gradient">PropVisions</span> works
            </h1>

            <p className="text-xl text-slate-700 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed animate-slideUp delay-100">
              From listing URL (or batch upload) to complete deal pack in under 5 minutes per property.
              Transparent, traceable, and export-ready. PropVisions accelerates analysis—it doesn't replace site visits or professional quotes.
            </p>
          </div>
        </div>
      </section>

      {/* 3-STEP FLOW with premium cards */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial opacity-50" />

        <div className="container relative z-10">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12 animate-slideUp">
              End-to-end <span className="text-gradient">workflow</span>
            </h2>

            <ol className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
              {FLOW.map((step, i) => (
                <li
                  key={step.title}
                  className="animate-scaleIn"
                  style={{ animationDelay: `${i * 100}ms` }}
                  onMouseEnter={() => setHoveredStep(i)}
                  onMouseLeave={() => setHoveredStep(null)}
                >
                  <div className={`
                    relative h-full rounded-2xl border-2 p-6 transition-all duration-500 cursor-pointer
                    ${hoveredStep === i
                      ? 'border-blue-500 dark:border-blue-400 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 shadow-2xl scale-105 -translate-y-2'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-lg'
                    }
                  `}>
                    {/* Step number badge */}
                    <div className={`
                      absolute -top-3 -right-3 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500
                      ${hoveredStep === i
                        ? 'bg-gradient-to-br from-blue-500 to-purple-500 text-white scale-110 shadow-lg'
                        : 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                      }
                    `}>
                      {i + 1}
                    </div>

                    <div className="flex flex-col h-full gap-4">
                      {/* Icon */}
                      <div className={`
                        w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-500
                        ${hoveredStep === i
                          ? 'bg-gradient-to-br from-blue-500 to-purple-500 scale-110 rotate-6 shadow-lg'
                          : 'bg-slate-100 dark:bg-slate-800'
                        }
                      `}>
                        <div className={`transition-colors duration-500 ${hoveredStep === i ? 'text-white' : 'text-blue-700 dark:text-blue-400'}`}>
                          {step.icon}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-slate-100">
                          {step.title}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                          {step.desc}
                        </p>
                      </div>

                      {/* Hover indicator */}
                      {hoveredStep === i && (
                        <div className="mt-2 flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm font-medium animate-fadeIn">
                          Learn more <Arrow />
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* PHOTO-BASED REFURB with gradient-bordered card */}
      <section className="py-24 bg-slate-50 dark:bg-slate-900/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-mesh opacity-30" />

        <div className="container relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="rounded-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-[2px] shadow-2xl animate-slideUp">
              <div className="rounded-2xl bg-white dark:bg-slate-900 p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white">
                    <Camera />
                  </div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Photo-based refurb pricing
                  </h3>
                </div>

                <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
                  PropVisions analyzes each photo to identify room type and condition, then maps work to floorplans
                  where available. Regional builder rates are applied, and missing rooms are flagged for agent follow-up.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {REFURB_FEATURES.map((feature, i) => (
                    <div
                      key={feature.title}
                      className="rounded-xl border-2 border-slate-200 dark:border-slate-800 p-5 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-xl transition-all duration-500 hover:scale-105 animate-scaleIn"
                      style={{ animationDelay: `${100 + i * 100}ms` }}
                    >
                      <div className="font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        {feature.title}
                      </div>
                      <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                        {feature.items.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Check className="flex-shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RENT ESTIMATION with split layout */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial opacity-50" />

        <div className="container relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left side - Content */}
              <div className="lg:col-span-5 space-y-6 animate-slideInLeft">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white">
                    <Chart />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    Rent estimation & valuation
                  </h3>
                </div>

                <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed">
                  PropVisions combines regional rental baselines with regression models adjusted by listing signals
                  (beds, location, condition). Output includes a rationale, confidence band, and post-refurb valuation estimate.
                </p>

                <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                  <Info className="flex-shrink-0 mt-1" />
                  <p className="text-sm text-blue-900 dark:text-blue-200">
                    All estimates include confidence bands and transparent rationale showing key drivers.
                  </p>
                </div>
              </div>

              {/* Right side - Feature cards */}
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-slideInRight">
                {RENT_FEATURES.map((feature, i) => (
                  <div
                    key={feature.title}
                    className={`
                      rounded-xl border-2 p-5 transition-all duration-500 hover:scale-105
                      ${i === 0
                        ? 'border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 to-cyan-50 dark:from-emerald-950/30 dark:to-cyan-950/30 hover:shadow-emerald-200 dark:hover:shadow-emerald-900'
                        : 'border-cyan-200 dark:border-cyan-800 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30 hover:shadow-cyan-200 dark:hover:shadow-cyan-900'
                      } hover:shadow-xl
                    `}
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="font-semibold text-slate-900 dark:text-slate-100 mb-3">
                      {feature.title}
                    </div>
                    <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                      {feature.items.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${i === 0 ? 'bg-emerald-500' : 'bg-cyan-500'}`} />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINANCIALS with interactive table */}
      <section className="py-24 bg-slate-50 dark:bg-slate-900/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-mesh opacity-30" />

        <div className="container relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 animate-slideUp">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 p-6 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white">
                    <Calculator />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    Full financials & ROI
                  </h3>
                </div>
                <p className="text-slate-700 dark:text-slate-300 mt-2">
                  All costs, fees, and ongoing expenses calculated automatically. Scenario comparisons for BTL and simple exit strategies.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-100 dark:bg-slate-800">
                    <tr>
                      <th className="p-4 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">Component</th>
                      <th className="p-4 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">Included</th>
                      <th className="p-4 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {FINANCIAL_COMPONENTS.map((component, i) => (
                      <tr
                        key={component.name}
                        className="hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors duration-200"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                            <span className="font-medium text-slate-900 dark:text-slate-100">{component.name}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">
                            <CheckIcon />
                          </span>
                        </td>
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-400">{component.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* EPC & EXPORT with side-by-side cards */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial opacity-50" />

        <div className="container relative z-10">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12 animate-slideUp">
              Additional <span className="text-gradient">capabilities</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {ADDITIONAL_FEATURES.map((feature, i) => (
                <div
                  key={feature.title}
                  className={`animate-scaleIn ${i === 0 ? '' : 'delay-100'}`}
                  onMouseEnter={() => setHoveredFeature(i)}
                  onMouseLeave={() => setHoveredFeature(null)}
                >
                  <div className={`
                    rounded-2xl border-2 p-6 h-full transition-all duration-500
                    ${hoveredFeature === i
                      ? 'border-blue-500 dark:border-blue-400 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 shadow-2xl scale-105'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-lg'
                    }
                  `}>
                    <div className={`
                      w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-500
                      ${hoveredFeature === i
                        ? 'bg-gradient-to-br from-blue-500 to-purple-500 scale-110 rotate-6'
                        : 'bg-slate-100 dark:bg-slate-800'
                      }
                    `}>
                      <div className={`transition-colors duration-500 ${hoveredFeature === i ? 'text-white' : 'text-blue-700 dark:text-blue-400'}`}>
                        {feature.icon}
                      </div>
                    </div>

                    <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-slate-100">
                      {feature.title}
                    </h3>

                    <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                      {feature.items.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="flex-shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* GRADIENT CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 opacity-5 dark:opacity-10" />

        <div className="container relative z-10">
          <div className="max-w-5xl mx-auto">
            <div className="rounded-3xl bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 p-[2px] shadow-2xl animate-slideUp">
              <div className="rounded-3xl bg-white dark:bg-slate-900 p-8 md:p-12">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-3xl font-bold mb-3 bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
                      Ready to get started?
                    </h3>
                    <p className="text-lg text-slate-600 dark:text-slate-400">
                      See a 5-minute live run and get a free trial analysis credit.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link
                      href="/book-demo"
                      className="btn px-8 py-4 text-base rounded-xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0"
                    >
                      Book a demo
                    </Link>
                    <Link
                      href="/pricing"
                      className="btn btn-outline px-8 py-4 text-base rounded-xl font-semibold hover:scale-105 transition-all duration-300"
                    >
                      View pricing
                    </Link>
                  </div>
                </div>
              </div>
            </div>
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

// Data structures
const FLOW = [
  {
    title: "Paste URL or batch upload",
    desc: "Process up to 100 properties at once (tier-dependent). Major UK portals supported—Rightmove, Zoopla, OnTheMarket. Coverage varies by source.",
    icon: <IconList />
  },
  {
    title: "Analysis runs",
    desc: "Room-by-room refurb from photos, EPC matching, rent estimation, and full financial projections. Typically under 5 minutes per property.",
    icon: <IconPlus />
  },
  {
    title: "Review & export",
    desc: "Check estimates, adjust assumptions, export investor PDF and builder quote. Use results to prioritize which properties to view.",
    icon: <IconSquare />
  },
] as const;

const REFURB_FEATURES = [
  {
    title: "Room classification",
    items: [
      "Kitchen, bathroom, bedroom, lounge, hall, exterior",
      "Condition indicators: wear, damp, electrics, fixtures"
    ]
  },
  {
    title: "Floorplan mapping",
    items: [
      "Maps photos to rooms when floorplan is available",
      "Flags missing rooms and prompts agent nudges"
    ]
  },
  {
    title: "Regional pricing",
    items: [
      "Builder rates adjusted by postcode area",
      "Contingency controls and quote lock-in"
    ]
  },
] as const;

const RENT_FEATURES = [
  {
    title: "Rent estimation",
    items: [
      "Regional baselines + listing signal regression",
      "Confidence bands (low, mid, high)",
      "Rationale showing key drivers"
    ]
  },
  {
    title: "Post-refurb valuation",
    items: [
      "Estimate based on local sales data",
      "Accounts for planned improvements"
    ]
  },
] as const;

const FINANCIAL_COMPONENTS = [
  { name: "SDLT", notes: "BTL rates with scenario toggles" },
  { name: "Fees", notes: "Legal, survey, insurance, broker" },
  { name: "Operating costs", notes: "Voids, management %, maintenance %" },
  { name: "Mortgage", notes: "Standard assumptions (forward rates coming)" },
  { name: "Exports", notes: "Investor PDF + Excel breakdown" },
] as const;

const ADDITIONAL_FEATURES = [
  {
    title: "EPC matching & upgrades",
    icon: <IconEPC />,
    items: [
      "Fetches official EPC from UK government register",
      "Shows upgrade suggestions and expected rating uplift",
      "Stored for audit and compliance reporting"
    ]
  },
  {
    title: "Export-ready reports",
    icon: <IconExport />,
    items: [
      "Investor PDF: full deal pack with financials and assumptions",
      "Builder quote PDF: room-by-room materials and cost breakdown",
      "Both reports are brandable for client delivery"
    ]
  },
] as const;

// Icon components
function IconList() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path d="M4 7h16M4 12h10M4 17h7" strokeLinecap="round" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path d="M12 3v6m0 6v6M3 12h6m6 0h6" strokeLinecap="round" />
    </svg>
  );
}

function IconSquare() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path d="M4 4h16v16H4z" />
    </svg>
  );
}

function IconEPC() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M8 12h8M8 8h8M8 16h4" strokeLinecap="round" />
    </svg>
  );
}

function IconExport() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" strokeLinecap="round" />
    </svg>
  );
}

function Sparkle() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z" />
    </svg>
  );
}

function Arrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Camera() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function Chart() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path d="M3 3v18h18" strokeLinecap="round" />
      <path d="M18 9l-5 5-4-4-3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Calculator() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <rect x="8" y="6" width="8" height="3" rx="1" />
      <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" strokeLinecap="round" />
    </svg>
  );
}

function Check({ className = "" }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={className} aria-hidden>
      <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} aria-hidden>
      <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Info({ className = "" }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" strokeLinecap="round" />
    </svg>
  );
}
