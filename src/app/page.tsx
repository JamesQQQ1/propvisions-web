// src/app/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function LandingPage() {
  const [showFloatingCta, setShowFloatingCta] = useState(false);
  useEffect(() => {
    const onScroll = () => setShowFloatingCta(window.scrollY > 700);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="bg-white">
      <FloatingCTA show={showFloatingCta} />

      {/* HERO with video */}
      <section className="section pt-10">
        <div className="container grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6">
            <span className="badge" aria-label="Fast to value">No setup • Beta live</span>
            <h1 className="heading-hero">
              From raw listing to <span className="text-gradient">investor-ready ROI</span> — fast, auditable, shareable
            </h1>
            <p className="subhead">
              PropVisions ingests a property link, estimates refurbishment from photos, checks rents and values, and computes
              full financials with <em>every</em> assumption surfaced — exportable to PDF & Excel.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/book-demo" className="btn btn-primary" aria-label="Book a live demo">
                Book a demo →
              </Link>
              <Link href="#walkthrough" className="btn btn-outline" aria-label="Watch product walkthrough video">
                Watch the walkthrough
              </Link>
            </div>

            {/* 3 crisp value props */}
            <ul className="mt-2 space-y-2 text-slate-700">
              <li>✓ Refurb from photos with room-level line items and confidence</li>
              <li>✓ Rent bands & post-refurb value grounded in local priors</li>
              <li>✓ Clear ROI, yield & cash-flow; lender-friendly PDF/Excel exports</li>
            </ul>

            {/* Micro stats */}
            <div className="flex flex-wrap items-center gap-5 small" aria-label="Key product metrics">
              <Chip>~90s</Chip><span>Typical end-to-end run</span>
              <Chip>PDF • Excel</Chip><span>Client-ready outputs</span>
              <Chip>Line-items</Chip><span>Fully traceable</span>
            </div>

            {/* Trust row */}
            <LogoRow />

            <p className="small text-slate-500">
              Public demo omits portal APIs. Compliant Rightmove/Zoopla integrations planned at launch.
            </p>
          </div>

          {/* Video */}
          <div className="lg:col-span-5">
            <div className="card overflow-hidden">
              <div className="card-header">Product walkthrough</div>
              <div className="aspect-video w-full bg-black" id="walkthrough">
                <video className="h-full w-full" controls playsInline preload="metadata" poster="/demo-poster.jpg">
                  <source src="/PropVisions Demo.mp4" />
                  <source src="/demo.mp4" type="video/mp4" />
                  Your browser does not support embedded videos.{" "}
                  <a href="/PropVisions Demo.mp4">Download the video</a>.
                </video>
              </div>
              <div className="card-footer">
                <span className="small">Two-minute overview of the core flow.</span>
                <Link href="/how-it-works" className="link" aria-label="See how it works">See how it works →</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof / mini testimonials */}
      <section className="section">
        <div className="container grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="card p-5">
              <div className="small text-slate-600">{t.role}</div>
              <p className="mt-2">{t.quote}</p>
              <div className="mt-3 font-medium">{t.name}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA strip */}
      <section className="py-10">
        <div className="container">
          <div className="rounded-2xl bg-slate-900 text-white px-6 py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold">Ready to see it on your deals?</h3>
              <p className="small text-slate-300">We’ll run through a live example and share the export pack.</p>
            </div>
            <Link href="/book-demo" className="btn btn-onColor bg-white text-slate-900">Book a demo</Link>
          </div>
        </div>
      </section>

      <div className="h-28 md:h-32" />
    </div>
  );
}

/* --- local UI helpers --- */
function FloatingCTA({ show }: { show: boolean }) {
  return (
    <div aria-hidden={!show} className={`fixed inset-x-0 bottom-4 z-40 transition-all duration-300 ${show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"}`}>
      <div className="container">
        <div className="rounded-2xl bg-slate-900 text-white px-4 py-3 flex items-center justify-between shadow-2xl">
          <span className="small text-slate-200">Paste a URL → get an investor-ready snapshot.</span>
          <Link href="/book-demo" className="btn btn-onColor bg-white text-slate-900">Book a demo</Link>
        </div>
      </div>
    </div>
  );
}
function LogoRow() {
  return (
    <div className="mt-6 grid grid-cols-3 sm:grid-cols-6 gap-4 items-center opacity-70">
      {["Investors", "Agents", "Sourcers", "Auctions", "Lenders", "Analysts"].map((label) => (
        <div key={label} className="h-8 rounded-md border border-slate-200 grid place-items-center text-[11px] text-slate-500">
          {label}
        </div>
      ))}
    </div>
  );
}
function Chip({ children }: { children: React.ReactNode }) {
  return <span className="chip chip-emerald">{children}</span>;
}
const TESTIMONIALS = [
  { name: "James P.", role: "Portfolio Investor", quote: "Cuts my underwrite time to minutes. Export pack is exactly what lenders want." },
  { name: "Maya K.", role: "Buying Agent", quote: "The photo-based refurb bands are scarily useful. I still sanity-check, but it’s a huge head start." },
  { name: "Ollie S.", role: "Sourcing Lead", quote: "Easily the cleanest ‘URL → analysis’ workflow I’ve seen. Transparent and fast." },
] as const;
