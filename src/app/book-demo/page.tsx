// src/app/book-demo/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

// If you store the Calendly link in an env var, great.
// Fallback to a placeholder so the page still builds locally.
const CALENDLY_URL =
  process.env.NEXT_PUBLIC_CALENDLY_URL ||
  "https://calendly.com/your-workspace/propvisions-demo-20min";

export default function BookDemoPage() {
  // Add lightweight UTM / context signals you may want in n8n
  // (Calendly forwards query params through to invites + webhooks)
  const [embedUrl, setEmbedUrl] = useState(CALENDLY_URL);

  useEffect(() => {
    try {
      const url = new URL(CALENDLY_URL);
      // Attach helpful context: where from, and a soft campaign tag
      const params = new URLSearchParams(window.location.search);
      if (!params.has("source")) params.set("source", "website");
      if (!params.has("campaign")) params.set("campaign", "pre-demo-beta");
      // If you ever want to forward a propertyId or email as a query, you can add it here:
      // if (!params.has("email") && window.localStorage.getItem("email")) {
      //   params.set("email", window.localStorage.getItem("email")!);
      // }
      url.search = params.toString();
      setEmbedUrl(url.toString());
    } catch {
      setEmbedUrl(CALENDLY_URL);
    }
  }, []);

  return (
    <main className="bg-white">
      {/* HERO */}
      <section className="section pt-10">
        <div className="container grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left: copy + bullets */}
          <div className="lg:col-span-5 space-y-6">
            <span className="badge" aria-label="Live demo">
              <Dot color="#10b981" />
              Book your live demo
            </span>

            <h1 className="heading-hero">
              See <span className="text-gradient">PropVisions</span> in action
            </h1>

            <p className="subhead">
              20-minute walkthrough covering ingestion from a property link, refurb from photos,
              rent/value checks, and the full financials stack—plus exports. Tailored to your use-case.
            </p>

            <ul className="small text-slate-700 space-y-2 list-disc pl-5">
              <li>Paste a real listing and watch a full run (90s end-to-end).</li>
              <li>Adjust assumptions (voids, management, leverage) and see ROI live.</li>
              <li>Review outputs: investor-ready PDF and Excel with every line item.</li>
            </ul>

            <div className="flex flex-wrap gap-3">
              <a href="#scheduler" className="btn btn-primary" aria-label="Jump to booking widget">
                Pick a time →
              </a>
              <Link href="/#walkthrough" className="btn btn-outline" aria-label="Watch product walkthrough">
                Watch 2-min walkthrough
              </Link>
            </div>

            <div className="card p-4 small text-slate-600">
              <strong>What happens after booking?</strong>
              <ol className="list-decimal pl-5 mt-2 space-y-1">
                <li>Instant confirmation via Calendly.</li>
                <li>Your slot appears in Google Calendar.</li>
                <li>Our n8n workflow adds you to beta pipeline & sends prep notes.</li>
              </ol>
            </div>
          </div>

          {/* Right: Calendly embed */}
          <div className="lg:col-span-7">
            <div id="scheduler" className="card overflow-hidden">
              <div className="card-header flex items-center justify-between">
                <span className="small font-medium text-slate-900">Book a demo</span>
                <span className="badge">20 mins • Google Meet</span>
              </div>
              <CalendlyFrame url={embedUrl} />
              <div className="card-footer small">
                Having trouble with the embed?{" "}
                <a className="link" href={embedUrl} target="_blank" rel="noreferrer">
                  Open Calendly in a new tab →
                </a>
              </div>
            </div>

            {/* Trust micro-row */}
            <div className="mt-4 grid grid-cols-3 sm:grid-cols-6 gap-4 items-center opacity-70">
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
          </div>
        </div>
      </section>
    </main>
  );
}

/* ---------- Lightweight Calendly iframe embed (no extra deps) ---------- */
function CalendlyFrame({ url }: { url: string }) {
  // Calendly recommends min-height ~ 720–900 for full flow
  return (
    <div className="aspect-[4/5] w-full bg-white" style={{ minHeight: 780 }}>
      <iframe
        title="Calendly scheduling"
        src={toCalendlyEmbedUrl(url)}
        className="h-full w-full"
        frameBorder="0"
        referrerPolicy="strict-origin-when-cross-origin"
        // Accessibility improvements:
        aria-label="Schedule your demo with Calendly"
      />
    </div>
  );
}

function toCalendlyEmbedUrl(base: string) {
  // Calendly’s inline embed supports `?hide_event_type_details=1&hide_gdpr_banner=1&primary_color=...`
  try {
    const u = new URL(base);
    const p = u.searchParams;
    if (!p.has("hide_event_type_details")) p.set("hide_event_type_details", "1");
    if (!p.has("hide_landing_page_details")) p.set("hide_landing_page_details", "1");
    if (!p.has("hide_gdpr_banner")) p.set("hide_gdpr_banner", "1");
    // Feel free to theme to your brand hex (no #):
    if (!p.has("primary_color")) p.set("primary_color", "0f172a"); // slate-900
    u.search = p.toString();
    return u.toString();
  } catch {
    return base;
  }
}

/* Tiny dot */
function Dot({ color = "#16a34a" }: { color?: string }) {
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden>
      <circle cx="4" cy="4" r="4" fill={color} />
    </svg>
  );
}
