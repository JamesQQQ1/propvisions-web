// src/app/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

/* -----------------------------------------------------------
   Config
----------------------------------------------------------- */

const YT_ID = process.env.NEXT_PUBLIC_DEMO_YOUTUBE_ID;
const HAS_YT = !!YT_ID;

/* -----------------------------------------------------------
   Page
----------------------------------------------------------- */

export default function LandingPage() {
  const [openSample, setOpenSample] = useState<null | "refurb" | "financials" | "exports">(null);
  const [activeTab, setActiveTab] = useState<"refurb" | "financials" | "exports">("refurb");
  const [showFloatingCta, setShowFloatingCta] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowFloatingCta(window.scrollY > 800);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="bg-white">
      {/* Floating CTA (appears on scroll) */}
      <FloatingCTA show={showFloatingCta} />

      {/* TOP STRIP */}
      <TopStrip />

      {/* HERO */}
      <section className="section pt-10">
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

            {/* Micro stats (animated) */}
            <div className="flex flex-wrap items-center gap-5 small" aria-label="Key product metrics">
              <Chip color="emerald"><AnimatedNumber to={90} duration={1.2} />s</Chip><span>End-to-end run</span>
              <Chip color="sky">PDF • Excel</Chip><span>Client-ready</span>
              <Chip color="violet">Line-items</Chip><span>Fully traceable</span>
            </div>

            {/* Trust row */}
            <LogoRow />

            {/* Beta note (transparent) */}
            <BetaNote />
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

      {/* WHAT WORKS TODAY (with inline popovers + expandable details) */}
      <section className="section">
        <div className="container grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7 space-y-4">
            <h2 className="heading-2">What works today (live in the demo)</h2>
            <ul className="mt-3 space-y-3 small text-slate-700">
              <ListItem
                bold="URL → structured data."
                text="Ingest many agent/auction pages into clean fields (price, layout, images, agent, postcode)."
              />
              <ListItem
                bold="Refurb from photos."
                text={
                  <>
                    Room-by-room line-items (paint, flooring, electrics, plumbing, damp, structure).{" "}
                    <Popover trigger={<InlineLink>See example</InlineLink>}>
                      <p className="mb-2">Kitchen scope: strip wallpaper, paint, LVT floor, appliances and partial electrics upgrade.</p>
                      <p className="mb-2">Bathroom scope: tiling refresh, new vanity, sealant, extractor fan.</p>
                      <p className="mb-0 text-slate-500">Banding configurable per investor + contingency slider.</p>
                    </Popover>
                  </>
                }
              />
              <ListItem
                bold="Rent & value checks."
                text="Hybrid approach combining local priors and listing signals to produce rent bands and a post-refurb value."
              />
              <ListItem
                bold="Full financials."
                text="Stamp duty, legals/survey/insurance, voids, management, leverage → net income, yield, ROI."
              />
              <ListItem
                bold="Exports."
                text={
                  <>
                    Polished PDF deck + Excel with every line item.{" "}
                    <InlineButton onClick={() => { setActiveTab("exports"); setOpenSample("exports"); }}>Preview</InlineButton>
                  </>
                }
              />
              <ListItem
                bold="Alerts & logging."
                text="Run metadata, basic notifications, error handling, and input traceability."
              />
            </ul>

            {/* Interactive “Feature Explorer” tabs */}
            <FeatureTabs
              active={activeTab}
              onChange={setActiveTab}
              onOpen={setOpenSample}
            />
          </div>

          {/* Snapshot card */}
          <div className="lg:col-span-5">
            <SnapshotCard onOpenSample={(kind) => { setActiveTab(kind); setOpenSample(kind); }} />
          </div>
        </div>
      </section>

      {/* LIMITATIONS & ROADMAP (accordion + timeline) */}
      <section id="limitations" className="section">
        <div className="container grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7 space-y-6">
            <h2 className="heading-2">Current limitations & what’s coming</h2>

            <Accordion
              items={[
                {
                    title: "Portal coverage (Rightmove/Zoopla)",
                    content: (
                      <div className="space-y-2 small text-slate-700">
                        <p>
                          Not enabled in the public demo due to partner/API restrictions. We’re pursuing compliant integrations.
                          Public launch plan includes unified search, de-duplication across sources, and canonicalisation by address+agent+media.
                        </p>
                        <p className="text-slate-500">Meanwhile, the demo accepts many agent/auction URLs and other compatible pages.</p>
                      </div>
                    )
                },
                {
                    title: "Accuracy bands & confidence",
                    content: (
                      <div className="space-y-2 small text-slate-700">
                        <p>Estimates reflect listing quality and regional nuance. Confidence indicators are shown for rent and refurb.</p>
                        <p>You can adjust assumptions (voids, management, maintenance, leverage) and immediately see the effect on ROI.</p>
                      </div>
                    )
                },
                {
                    title: "Mortgage module roadmap",
                    content: (
                      <div className="space-y-2 small text-slate-700">
                        <p>Today: standard assumptions included in cash-flow. Coming: IO/repayment, product fees, ERC modelling.</p>
                        <p>Launch+1: forward-rate scenarios, DSCR/ICR, remortgage timing assistant.</p>
                      </div>
                    )
                },
              ]}
            />

            {/* Roadmap timeline */}
            <RoadmapTimeline />
          </div>

          {/* Why different */}
          <div className="lg:col-span-5">
            <div className="card p-6 space-y-4">
              <h3 className="card-title">Why PropVisions is different</h3>
              <ul className="mt-1 small text-slate-700 space-y-2 list-disc pl-5">
                <li><strong>Automation across the flow:</strong> ingestion → analysis → reporting → alerts.</li>
                <li><strong>Transparency by default:</strong> every figure maps back to a line-item and assumption.</li>
                <li><strong>Human-in-the-loop:</strong> quick tweaks become area priors to improve future runs.</li>
                <li><strong>Shareable outputs:</strong> PDFs and spreadsheets clients and lenders can actually use.</li>
              </ul>

              {/* Tiny interactive: hover card */}
              <HoverCard
                label="How priors improve"
                content={
                  <div className="small">
                    When you nudge rent/refurb bands, we store an area prior (per postcode) so future runs start closer to your target.
                  </div>
                }
              />
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS (equal-height cards) */}
<section className="section">
  <div className="container">
    <h2 className="heading-2">How the pipeline works</h2>
    <p className="small mt-1 text-slate-600">
      A compressed path from link → analysis → shareable pack, with validation and error handling at each step.
    </p>

    {/* items-stretch ensures grid tracks can stretch; cards themselves must be h-full */}
    <ol className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
      {STEPS.map((s, i) => (
        <li
          key={s.title}
          className="card p-6 relative flex flex-col justify-start h-full min-h-[190px]"
        >
          <span className="step-index" aria-hidden>{i + 1}</span>

          {/* flex-1 makes the content area expand evenly inside each card */}
          <div className="flex items-start gap-3 flex-1">
            <div className="icon-wrap">{s.icon}</div>
            <div className="flex flex-col">
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

            {/* FAQ (accordion) */}
            <section id="faq" className="section">
        <div className="container">
          <h2 className="heading-2">FAQs</h2>
          <Accordion
            items={FAQS.map((f) => ({
              title: f.q,
              content: <div className="small text-slate-700">{f.a}</div>
            }))}
          />
        </div>
      </section>

      {/* --- ADD THIS SPACER --- */}
      {/* Spacer so floating CTA never overlaps bottom content */}
      <div className="h-28 md:h-32" />
      {/* --- END SPACER --- */}

      {/* Samples modal */}
      <Modal
        open={!!openSample}
        onClose={() => setOpenSample(null)}
        title={modalTitle(openSample)}
      >
        {openSample && <SampleContent kind={openSample} />}
      </Modal>
    </div> // ← closing wrapper from return()
  );
}


/* -----------------------------------------------------------
   Components
----------------------------------------------------------- */

function TopStrip() {
  return (
    <div className="bg-slate-50 border-b">
      <div className="container py-2 flex items-center justify-between small">
        <div className="flex items-center gap-2">
          <Dot color="#16a34a" />
          <span>Beta live. Portal ingestion (Rightmove/Zoopla) gated in demo — planned for public launch.</span>
        </div>
        <div className="flex items-center gap-3">
          <a href="#limitations" className="link">What’s coming</a>
          <Link href="/contact" className="link">Contact</Link>
        </div>
      </div>
    </div>
  );
}

// In src/app/page.tsx – replace your FloatingCTA with this version
function FloatingCTA({ show }: { show: boolean }) {
  const [offset, setOffset] = useState(16); // px from bottom when footer is visible

  useEffect(() => {
    const footer = document.getElementById("site-footer");
    if (!footer) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        // if footer is visible, lift the CTA by footer height + 16px; else sit 16px from bottom
        if (e.isIntersecting) {
          const h = e.target.getBoundingClientRect().height;
          setOffset(h + 16);
        } else {
          setOffset(16);
        }
      },
      { threshold: 0 }
    );

    obs.observe(footer);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      aria-hidden={!show}
      style={{ bottom: offset }}
      className={`fixed inset-x-0 z-40 transition-all duration-300 ${show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"}`}
    >
      <div className="container">
        <div className="rounded-2xl bg-slate-900 text-white px-4 py-3 flex items-center justify-between shadow-2xl">
          <div className="flex items-center gap-3">
            <span className="badge badge-emerald bg-emerald-500/20 text-emerald-200"><Spark /> Live demo</span>
            <span className="small text-slate-200">Paste a URL and get a full investor-ready snapshot.</span>
          </div>
          <Link href="/demo-access" className="btn btn-onColor bg-white text-slate-900">
            Try it now <ArrowRight />
          </Link>
        </div>
      </div>
    </div>
  );
}


function LogoRow() {
  return (
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
  );
}

function BetaNote() {
  return (
    <div className="mt-2 small text-slate-600">
      <strong>Beta honesty:</strong> Rightmove/Zoopla ingestion is gated due to partner/API restrictions. The demo uses
      agent/auction and other compatible pages. Full portal integrations are planned for public launch with compliant APIs,
      de-duplication, and source prioritisation.
    </div>
  );
}

function SnapshotCard({ onOpenSample }: { onOpenSample: (k: "refurb" | "financials" | "exports") => void }) {
  return (
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

      <div className="mt-4 flex items-center justify-between gap-2">
        <button className="btn btn-outline small" onClick={() => onOpenSample("refurb")}>Refurb sample</button>
        <button className="btn btn-outline small" onClick={() => onOpenSample("financials")}>Financials sample</button>
        <button className="btn small" onClick={() => onOpenSample("exports")}>Export preview</button>
      </div>
    </div>
  );
}

/* Tabs to preview features, with inline modal triggers */
function FeatureTabs({
  active,
  onChange,
  onOpen
}: {
  active: "refurb" | "financials" | "exports";
  onChange: (t: "refurb" | "financials" | "exports") => void;
  onOpen: (k: "refurb" | "financials" | "exports") => void;
}) {
  const tabs: Array<{ key: "refurb" | "financials" | "exports"; label: string; desc: ReactNode; }> = [
    {
      key: "refurb",
      label: "Refurb engine",
      desc: (
        <>
          Per-room line-items with bands, damp/structure detection, and contingency slider.{" "}
          <InlineButton onClick={() => onOpen("refurb")}>See sample scope</InlineButton>
        </>
      ),
    },
    {
      key: "financials",
      label: "Financial stack",
      desc: (
        <>
          Full purchase-to-exit model: stamp duty, fees, voids, management, leverage, ROI/yield.{" "}
          <InlineButton onClick={() => onOpen("financials")}>Open sample</InlineButton>
        </>
      ),
    },
    {
      key: "exports",
      label: "Export suite",
      desc: (
        <>
          Polished PDF + Excel with every line item and assumptions.{" "}
          <InlineButton onClick={() => onOpen("exports")}>Preview</InlineButton>
        </>
      ),
    },
  ];

  return (
    <div className="mt-6">
      <div className="flex gap-2 overflow-x-auto">
        {tabs.map(t => {
          const is = t.key === active;
          return (
            <button
              key={t.key}
              onClick={() => onChange(t.key)}
              className={`px-3 py-2 rounded-xl text-sm whitespace-nowrap border ${is ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"}`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="mt-3 card p-5 small text-slate-700">
        {tabs.find(t => t.key === active)?.desc}
      </div>
    </div>
  );
}

/* Accordion */
function Accordion({ items }: { items: Array<{ title: string; content: ReactNode }> }) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  return (
    <div className="space-y-3">
      {items.map((it, i) => {
        const open = i === openIdx;
        return (
          <div key={it.title} className="rounded-xl border">
            <button
              className="w-full flex items-center justify-between px-4 py-3 text-left"
              onClick={() => setOpenIdx(open ? null : i)}
              aria-expanded={open}
            >
              <span className="font-medium">{it.title}</span>
              <span className={`transition-transform ${open ? "rotate-180" : ""}`} aria-hidden>▾</span>
            </button>
            <div className={`px-4 overflow-hidden transition-[max-height,opacity] duration-300 ${open ? "max-h-[320px] opacity-100 pb-4" : "max-h-0 opacity-0"}`}>
              {it.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* HoverCard (pure CSS) */
function HoverCard({ label, content }: { label: string; content: ReactNode }) {
  return (
    <div className="relative inline-block">
      <span className="link group cursor-pointer">{label}</span>
      <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all absolute z-10 mt-2 w-64 p-3 rounded-xl border bg-white shadow-lg">
        {content}
      </div>
    </div>
  );
}

/* Popover (click) */
function Popover({ trigger, children }: { trigger: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className="relative inline-block" ref={ref}>
      <span className="link cursor-pointer" onClick={() => setOpen(x => !x)}>{trigger}</span>
      <div className={`absolute left-0 top-full mt-2 w-80 rounded-xl border bg-white shadow-xl p-4 small transition-all origin-top ${open ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none"}`}>
        {children}
      </div>
    </div>
  );
}

/* Modal */
function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string | null; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      <div className={`absolute inset-0 bg-black/40 transition-opacity ${open ? "opacity-100" : "opacity-0"}`} onClick={onClose} />
      <div className="absolute inset-0 grid place-items-center p-4">
        <div className={`w-full max-w-2xl rounded-2xl bg-white shadow-2xl border transition-all ${open ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}>
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <div className="font-semibold">{title ?? "Preview"}</div>
            <button className="small text-slate-500 hover:text-slate-900" onClick={onClose}>Close</button>
          </div>
          <div className="p-5">{children}</div>
        </div>
      </div>
    </div>
  );
}

/* Step card with tiny enter motion (CSS only) */
function StepCard({ index, icon, title, desc }: { index: number; icon: ReactNode; title: string; desc: string }) {
  const ref = useRef<HTMLLIElement | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => e.isIntersecting && setVisible(true));
    }, { threshold: 0.2 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <li ref={ref} className={`card p-6 relative transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
      <span className="step-index" aria-hidden>{index}</span>
      <div className="flex items-start gap-3">
        <div className="icon-wrap">{icon}</div>
        <div>
          <h3 className="card-title">{title}</h3>
          <p className="card-text">{desc}</p>
        </div>
      </div>
    </li>
  );
}

/* Sample content inside modal */
function SampleContent({ kind }: { kind: "refurb" | "financials" | "exports" }) {
  if (kind === "refurb") {
    return (
      <div className="small">
        <h4 className="font-semibold mb-2">Refurb scope preview</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li>Kitchen: strip wallpaper, repaint, LVT floor, partial rewire, appliance allowance.</li>
          <li>Bathroom: tile refresh, new vanity & tap set, reseal bath/shower, extractor fan.</li>
          <li>Bedrooms: prep & paint, carpet allowance, sockets & pendant checks.</li>
          <li>Damp & structure: patch plaster, skirting repair, contingency 10–15%.</li>
        </ul>
      </div>
    );
  }
  if (kind === "financials") {
    return (
      <div className="small">
        <h4 className="font-semibold mb-2">Financial model preview</h4>
        <table className="w-full text-sm border rounded-xl overflow-hidden">
          <tbody className="divide-y">
            {[
              ["Purchase price", "£220,000"],
              ["Stamp duty", "£1,600"],
              ["Fees (legal+survey+ins.)", "£1,450"],
              ["Refurb (incl. contingency)", "£18,600"],
              ["Leverage", "65% (IO)"],
              ["Year-1 net income", "£12,140"],
              ["Net yield (yr 1)", "8.4%"],
              ["ROI (cash-on-cash)", "15–20% range"],
            ].map(([k, v]) => (
              <tr key={k}>
                <td className="p-2 font-medium">{k}</td>
                <td className="p-2">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-slate-500">Assumptions adjustable: voids, management, maintenance, rates, rent band.</p>
      </div>
    );
  }
  return (
    <div className="small">
      <h4 className="font-semibold mb-2">Export preview</h4>
      <ul className="list-disc pl-5 space-y-1">
        <li><strong>PDF deck:</strong> investor-friendly summary, refurb breakdown, financial snapshot, comps (when available).</li>
        <li><strong>Excel model:</strong> all line items, tweakable assumptions, year-by-year cash-flow.</li>
      </ul>
      <p className="mt-2 text-slate-500">White-label options available post-beta.</p>
    </div>
  );
}

/* Helpers: animated number */
function AnimatedNumber({ to, duration = 1.0, prefix = "", suffix = "" }: { to: number; duration?: number; prefix?: string; suffix?: string; }) {
  const [n, setN] = useState(0);
  const startTs = useRef<number | null>(null);
  useEffect(() => {
    let raf = 0;
    const tick = (ts: number) => {
      if (startTs.current == null) startTs.current = ts;
      const p = Math.min(1, (ts - startTs.current) / (duration * 1000));
      setN(Math.round(p * to));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, duration]);
  return <>{prefix}{n}{suffix}</>;
}

function ListItem({ bold, text }: { bold: ReactNode; text: ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <Check />
      <span>
        <strong>{bold}</strong> {text}
      </span>
    </li>
  )
}


/* Small inline elements */
function InlineLink({ children }: { children: ReactNode }) {
  return <span className="underline decoration-slate-300 underline-offset-4 hover:text-slate-900 cursor-pointer">{children}</span>;
}
function InlineButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="link">{children}</button>;
}

/* Chips, pills, icons */
function Chip({ color = "emerald", children }: { color?: "emerald" | "sky" | "violet"; children: ReactNode }) {
  const cls = "chip " + (color === "emerald" ? "chip-emerald" : color === "sky" ? "chip-sky" : "chip-violet");
  return <span className={cls}>{children}</span>;
}
function Pill({ children }: { children: ReactNode }) {
  return <span className="inline-flex items-center rounded-full border px-3 py-1 small">{children}</span>;
}
function ArrowDivider() {
  return (
    <span className="hidden lg:flex items-center justify-center text-slate-400" aria-hidden>
      <ArrowRight />
    </span>
  );
}

/* Icons */
function ArrowRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path d="M5 12h14m-6-6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function Play() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 5v14l11-7-11-7z" />
    </svg>
  );
}
function Check() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function Spark() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8L12 2z" />
    </svg>
  );
}
function Dot({ color = "#16a34a" }: { color?: string }) {
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden>
      <circle cx="4" cy="4" r="4" fill={color} />
    </svg>
  );
}

/* -----------------------------------------------------------
   Data
----------------------------------------------------------- */

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
    desc: "Extraction, refurb modelling, fee math, rent/value checks — computed in seconds.",
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
] as const;

const COMPARISON = [
  { dim: "Speed", manual: "Hours of spreadsheets", ps: "Minutes" },
  { dim: "Transparency", manual: "Ad-hoc, hidden formulas", ps: "Every assumption visible" },
  { dim: "Credibility", manual: "Error-prone, inconsistent", ps: "Consistent, repeatable, data-backed" },
  { dim: "Shareability", manual: "Messy files", ps: "Clean PDF & Excel" },
] as const;

const AUDIENCES = [
  { title: "Investors", desc: "Quick appraisals and like-for-like comparisons.", icon: <Spark /> },
  { title: "Agents & sourcers", desc: "Professional packs to share with buyers.", icon: <Spark /> },
  { title: "Lenders", desc: "Consistent inputs for credit models.", icon: <Spark /> },
] as const;

const FAQS = [
  { q: "Do you support Rightmove & Zoopla?", a: "Not in the public demo. We plan compliant integrations at launch with de-duplication and source prioritisation." },
  { q: "How accurate are refurb estimates?", a: "Banded by room type and region; confidence depends on image quality. Always validate before offers." },
  { q: "Can I export the analysis?", a: "Yes — polished PDF for clients, and Excel with every line item for deep dives." },
  { q: "Can I customise assumptions?", a: "Yes — voids, management, maintenance, leverage, and more — recalc instantly." },
] as const;

/* -----------------------------------------------------------
   Extra: Roadmap timeline (visual)
----------------------------------------------------------- */
function RoadmapTimeline() {
  const items = [
    {
      tag: "Now (Beta)",
      points: ["URL→analysis for agent/auction pages", "Refurb from photos", "Rent bands & ROI", "PDF/Excel exports", "Alerts & logging"],
      status: "active",
    },
    {
      tag: "Launch (Public)",
      points: ["Unified search across sources", "Compliant Rightmove/Zoopla ingestion", "De-dup & canonical records"],
      status: "next",
    },
    {
      tag: "Q2",
      points: ["Off-market module & outreach", "Status-change watcher (new/price drop/returning)", "Saved searches & daily digests"],
      status: "planned",
    },
    {
      tag: "Q3",
      points: ["Mortgage: IO/repayment, fees, ERCs", "Forward-rate scenarios & DSCR/ICR", "Remortgage timing assistant"],
      status: "planned",
    },
  ] as const;

  return (
    <div className="space-y-5">
      {items.map((it, idx) => (
        <div key={it.tag} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className={`w-3 h-3 rounded-full ${idx === 0 ? "bg-emerald-500" : "bg-slate-300"}`} />
            {idx < items.length - 1 && <div className="w-px flex-1 bg-slate-200 mt-1" />}
          </div>
          <div className="flex-1 card p-4">
            <div className="small font-semibold">{it.tag}</div>
            <ul className="mt-2 small text-slate-700 list-disc pl-5 space-y-1">
              {it.points.map((p, i) => <li key={i}>{p}</li>)}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}

/* -----------------------------------------------------------
   Utility
----------------------------------------------------------- */
function modalTitle(k: "refurb" | "financials" | "exports" | null | undefined) {
  if (!k) return null;
  if (k === "refurb") return "Refurb scope — sample";
  if (k === "financials") return "Financial model — sample";
  return "Export preview";
}
