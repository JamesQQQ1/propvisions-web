// src/app/roadmap/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";

export default function RoadmapPage() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Hero Section with Animated Background */}
      <section className="relative pt-24 pb-16 overflow-hidden">
        {/* Animated gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-96 h-96 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="container relative z-10 max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/20 mb-6 animate-fadeIn">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Product Roadmap</span>
          </div>

          <h1 className="text-5xl sm:text-6xl font-extrabold leading-tight tracking-tight mb-6 animate-slideUp">
            Building the future of
            <span className="block text-gradient mt-2">property intelligence</span>
          </h1>

          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto animate-slideUp mb-6" style={{ animationDelay: '100ms' }}>
            Our vision: AI-powered analysis that accelerates decisions without replacing human expertise.
            Enterprise customers get priority access and can influence the roadmap.
          </p>

          <div className="inline-block px-6 py-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-sm font-medium animate-slideUp" style={{ animationDelay: '200ms' }}>
            We're not actively building new roadmap items right now. Evaluation for future features begins in Q2 2026 and will be scheduled based on user demand.
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-16">
        <div className="container max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Main Timeline */}
            <div className="lg:col-span-8 space-y-6">
              <h2 className="text-3xl font-bold mb-8">Upcoming Features</h2>

              {ROADMAP_ITEMS.map((item, index) => (
                <div
                  key={item.title}
                  className="group relative"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  style={{
                    animation: `slideUp 0.6s ease-out ${index * 0.05}s both`
                  }}
                >
                  <div className={`
                    relative p-6 rounded-2xl border-2 transition-all duration-500
                    ${hoveredIndex === index
                      ? 'border-blue-500 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-950/50 shadow-xl shadow-blue-500/20 translate-x-2'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-lg'
                    }
                  `}>
                    {/* Priority Badge */}
                    {item.priority && (
                      <div className="absolute -top-3 -right-3 px-3 py-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold shadow-lg animate-bounce">
                        {item.priority}
                      </div>
                    )}

                    {/* Icon & Status */}
                    <div className="flex items-start gap-4">
                      <div className={`
                        flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500
                        ${hoveredIndex === index
                          ? 'bg-blue-500 text-white scale-110 rotate-6'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }
                      `}>
                        {item.icon}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                            {item.title}
                          </h3>
                          <span className={`
                            px-2 py-0.5 rounded-full text-xs font-medium
                            ${item.status === 'In Progress' ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300' :
                              item.status === 'Planning' ? 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300' :
                              item.status.includes('Under evaluation') ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' :
                              'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }
                          `}>
                            {item.status}
                          </span>
                        </div>

                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                          {item.description}
                        </p>

                        {item.benefits && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {item.benefits.map((benefit, i) => (
                              <span key={i} className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                                  <path d="M6 0L7.5 4.5L12 6L7.5 7.5L6 12L4.5 7.5L0 6L4.5 4.5L6 0Z" />
                                </svg>
                                {benefit}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Animated line connector */}
                    {index < ROADMAP_ITEMS.length - 1 && (
                      <div className="absolute left-6 -bottom-6 w-0.5 h-6 bg-gradient-to-b from-slate-200 dark:from-slate-700 to-transparent" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Sidebar */}
            <aside className="lg:col-span-4 space-y-6">
              {/* Current Capabilities */}
              <div className="sticky top-24 space-y-6">
                <div className="rounded-2xl border-2 border-emerald-500 dark:border-emerald-600 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950 dark:to-slate-900 p-6 shadow-xl shadow-emerald-500/10">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-100">Live Today</h3>
                  </div>

                  <ul className="space-y-2.5 text-sm">
                    {CURRENT_FEATURES.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 mt-0.5">
                          <circle cx="8" cy="8" r="3" fill="#10b981" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Card */}
                <div className="rounded-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-[2px] shadow-2xl">
                  <div className="rounded-2xl bg-white dark:bg-slate-900 p-6">
                    <h3 className="text-lg font-bold mb-2 text-slate-900 dark:text-slate-100">Influence the roadmap</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                      Enterprise customers get priority access to new features and can request custom builds.
                    </p>
                    <Link
                      href="/book-demo"
                      className="block w-full text-center px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                    >
                      Book a demo
                    </Link>
                  </div>
                </div>

                {/* Limitations Card */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-lg">
                  <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-slate-100">Current Limitations</h3>
                  <div className="space-y-4 text-sm">
                    {LIMITATIONS.map((item, i) => (
                      <div key={i}>
                        <div className="font-semibold text-slate-700 dark:text-slate-300 mb-1">{item.title}</div>
                        <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}

const ROADMAP_ITEMS = [
  {
    title: "Nano Banana image API",
    description: "Create before/after visual renders showing a property's potential after refurbishment. These automatically generated comparison images help you present opportunities to clients more clearly.",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" strokeLinecap="round" strokeLinejoin="round" /></svg>,
    status: "In Progress",
    priority: "Currently working on",
    benefits: ["Visual renders", "Client presentations"],
  },
  {
    title: "Mortgage trigger with forward rates",
    description: "Scenario planning with forward interest rate curves, product fees, and lender stress tests. Model multiple mortgage products side-by-side.",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 2v20M2 12h20" strokeLinecap="round" /></svg>,
    status: "Under evaluation starting Q2 2026",
    benefits: ["Better ROI accuracy", "Lender-ready reports"],
    priority: undefined,
  },
  {
    title: "Multiple scenario modes",
    description: "BTL, HMO, Airbnb, Social Housing—each with tailored assumptions and regulatory considerations. Compare strategies instantly.",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" strokeLinecap="round" /></svg>,
    status: "Under evaluation starting Q2 2026",
    priority: undefined,
    benefits: ["Strategy comparison", "Regulatory checks"],
  },
  {
    title: "Live builder pricing",
    description: "Connect with verified local builders for real-time quote validation and booking. Get three quotes automatically.",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" strokeLinecap="round" /></svg>,
    status: "Under evaluation starting Q2 2026",
    benefits: ["Verified quotes", "Instant booking"],
  },
  {
    title: "Off-market sourcing",
    description: "Find probate properties, distressed sales, and stale listings before others do. Automated workflows help you reach out first.",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" /></svg>,
    status: "Under evaluation starting Q2 2026",
    benefits: ["Hidden deals", "Auto outreach"],
  },
  {
    title: "Portfolio dashboards",
    description: "Track multiple properties in one place with real-time performance metrics. Separate views for investment tracking and property management.",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z" strokeLinecap="round" /></svg>,
    status: "Under evaluation starting Q2 2026",
    benefits: ["Multi-property", "Live metrics"],
  },
  {
    title: "Listing text intelligence",
    description: "Automatically spot key phrases like 'needs modernisation' or 'chain-free' to adjust cost estimates and highlight opportunities.",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeLinecap="round" strokeLinejoin="round" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" /></svg>,
    status: "Under evaluation starting Q2 2026",
    benefits: ["Signal extraction", "Auto flags"],
  },
  {
    title: "Confidence scoring",
    description: "See low/medium/high confidence bands for all estimates based on available data quality. Full transparency on how estimates are calculated.",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M9 11l3 3L22 4" strokeLinecap="round" strokeLinejoin="round" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" strokeLinecap="round" strokeLinejoin="round" /></svg>,
    status: "Under evaluation starting Q2 2026",
    benefits: ["Transparency", "Data quality"],
  },
  {
    title: "Feedback learning",
    description: "When you edit and correct estimates, the system learns your preferences for specific areas and property types. Your personal AI assistant that gets smarter over time.",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="3" /><path d="M12 1v6m0 6v6M5.6 5.6l4.2 4.2m4.2 4.2l4.2 4.2M1 12h6m6 0h6M5.6 18.4l4.2-4.2m4.2-4.2l4.2-4.2" strokeLinecap="round" /></svg>,
    status: "Under evaluation starting Q2 2026",
    benefits: ["Personalized", "Self-improving"],
  },
  {
    title: "Smart agent automation",
    description: "Automated email or voice calls for missing data, booking viewings, and following up on leads. AI that sounds like a real person.",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" /></svg>,
    status: "Under evaluation starting Q2 2026",
    benefits: ["Automation", "Voice AI"],
  },
  {
    title: "Chatbot automation",
    description: "Talk to your data naturally—ask questions or request updates using plain language or voice commands.",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" strokeLinecap="round" strokeLinejoin="round" /></svg>,
    status: "Under evaluation starting Q2 2026",
    benefits: ["Natural language", "Voice control"],
  },
] as const;

const CURRENT_FEATURES = [
  "Batch upload (up to 100 properties)",
  "Room-by-room refurb pricing",
  "EPC matching & upgrade paths",
  "Rent estimation with rationale",
  "Post-refurb valuation estimates",
  "Full financial modeling",
  "Investor & builder PDFs",
  "Listing change alerts",
  "Multi-user team access",
  "API & connections to other tools (Enterprise only)",
] as const;

const LIMITATIONS = [
  {
    title: "Portal coverage",
    desc: "Best with Rightmove, Zoopla, OnTheMarket. Coverage varies by source. Unified search coming Q2 2025."
  },
  {
    title: "Estimate confidence",
    desc: "Depends on listing quality and local data. Wider ranges prompt manual review. Your edits improve baselines."
  },
  {
    title: "Run timing",
    desc: "Most runs complete in under 5 minutes—depends on image count and data sources."
  },
] as const;
