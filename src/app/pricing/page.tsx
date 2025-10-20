// src/app/pricing/page.tsx
"use client";

import Link from "next/link";
import { useState } from "react";

export default function PricingPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="pt-20 pb-12">
        <div className="container text-center max-w-3xl">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
            Simple, transparent pricing
          </span>
          <h1 className="heading-hero mt-6">Choose the plan that fits your workflow</h1>
          <p className="subhead mt-4">
            Filter 100 down to the best 10 in minutes—then go view only what's worth viewing. PropVisions accelerates
            due diligence so you can focus on the right properties.
          </p>
        </div>
      </section>

      {/* Plan cards */}
      <section className="pb-16">
        <div className="container grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl">
          <PlanCard
            name="Starter"
            price="£129"
            period="/month"
            description="For new investors testing the platform."
            cta="Book a demo"
            ctaHref="/book-demo"
            features={[
              "10 property runs/month",
              "No batch upload (single only)",
              "~5 min analysis per property",
              "AI refurb pricing & EPC uplift",
              "Rent/yield & valuation reports",
              "Investor-ready PDF exports",
              "Email support",
            ]}
            extraRunPrice="£15 each"
          />

          <PlanCard
            name="Professional"
            price="£399"
            period="/month"
            description="For active investors analysing deals weekly."
            cta="Book a demo"
            ctaHref="/book-demo"
            highlighted
            features={[
              "50 property runs/month",
              "Batch upload up to 10/run",
              "Scenario modelling (BTL/Refurb/Sale)",
              "Listing-change alerts",
              "Builder-style cost PDF",
              "Priority support",
              "Early access to new AI modules",
            ]}
            extraRunPrice="£12 each"
          />

          <PlanCard
            name="Team"
            price="£899"
            period="/month"
            description="For agencies and developers with multiple projects."
            cta="Book a demo"
            ctaHref="/book-demo"
            features={[
              "100 property runs/month",
              "Batch upload up to 25/run",
              "Multi-user access (up to 10 seats)",
              "Shared dashboards & client links",
              "API access for automation",
              "White-label PDF branding",
              "CRM/data integration support",
              "Phone & chat support",
            ]}
            extraRunPrice="£10 each"
          />

          <PlanCard
            name="Enterprise"
            price="Custom"
            period=""
            description="For larger firms and white-label partners."
            cta="Contact sales"
            ctaHref="/contact"
            features={[
              "Full system integration",
              "Custom AI prompts & datasets",
              "Batch up to 100 properties/run",
              "Dedicated account manager & SLA",
              "Custom pricing per volume",
              "Volume discounts available",
            ]}
          />
        </div>

        <div className="container max-w-7xl mt-8 space-y-2 text-center text-sm text-slate-600">
          <p>Batch upload lets you process multiple properties at once—each analysed property still counts as one run.</p>
          <p className="italic">Most runs complete in under 5 minutes (depends on image count and data sources).</p>
        </div>
      </section>

      {/* Feature comparison table */}
      <section className="py-16 bg-slate-50">
        <div className="container">
          <h2 className="heading-2 text-center mb-10">Feature comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full max-w-6xl mx-auto bg-white border rounded-xl text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="p-4 text-left font-semibold">Feature</th>
                  <th className="p-4 text-center font-semibold">Starter</th>
                  <th className="p-4 text-center font-semibold">Professional</th>
                  <th className="p-4 text-center font-semibold">Team</th>
                  <th className="p-4 text-center font-semibold">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <FeatureRow feature="Monthly runs" starter="10" pro="50" team="100" enterprise="Custom" />
                <FeatureRow feature="Extra run cost" starter="£15" pro="£12" team="£10" enterprise="Volume pricing" />
                <FeatureRow feature="Batch upload" starter="no" pro="Up to 10" team="Up to 25" enterprise="Up to 100" />
                <FeatureRow feature="Typical analysis time" starter="~5 min/property" pro="~5 min/property" team="~5 min/property" enterprise="~5 min/property" />
                <FeatureRow
                  feature="Decision-support role (not replacement)"
                  starter="yes"
                  pro="yes"
                  team="yes"
                  enterprise="yes"
                />
                <FeatureRow
                  feature="Supported portals (major UK portals; coverage varies)"
                  starter="yes"
                  pro="yes"
                  team="yes"
                  enterprise="yes"
                />
                <FeatureRow feature="EPC fetch & attach" starter="yes" pro="yes" team="yes" enterprise="yes" />
                <FeatureRow
                  feature="AI rent estimation (baseline + regression)"
                  starter="yes"
                  pro="yes"
                  team="yes"
                  enterprise="yes"
                />
                <FeatureRow
                  feature="Room-by-room refurb pricing from photos"
                  starter="yes"
                  pro="yes"
                  team="yes"
                  enterprise="yes"
                />
                <FeatureRow feature="Scenario modelling" starter="limited" pro="yes" team="yes" enterprise="yes" />
                <FeatureRow feature="Investor PDF & Builder PDF" starter="yes" pro="yes" team="yes" enterprise="yes" />
                <FeatureRow feature="API & integration access" starter="no" pro="no" team="yes" enterprise="yes" />
                <FeatureRow feature="White-label branding" starter="no" pro="no" team="yes" enterprise="yes" />
                <FeatureRow feature="Team seats" starter="1" pro="3" team="10" enterprise="Custom" />
                <FeatureRow
                  feature="Priority support / SLA"
                  starter="no"
                  pro="Business hours"
                  team="Phone & chat"
                  enterprise="24×7 with SLA"
                />
                <FeatureRow feature="CRM & data integrations" starter="no" pro="limited" team="yes" enterprise="Yes custom" />
                <FeatureRow
                  feature="Off-market sourcing (probate/distress)"
                  starter="roadmap"
                  pro="roadmap"
                  team="roadmap"
                  enterprise="Roadmap priority"
                />
                <FeatureRow
                  feature="Portfolio dashboards"
                  starter="roadmap"
                  pro="roadmap"
                  team="roadmap"
                  enterprise="Roadmap priority"
                />
                <FeatureRow
                  feature="Mortgage trigger with forward rates"
                  starter="roadmap"
                  pro="roadmap"
                  team="roadmap"
                  enterprise="Roadmap priority"
                />
                <FeatureRow
                  feature="Smart agent automation"
                  starter="no"
                  pro="roadmap"
                  team="roadmap"
                  enterprise="Roadmap priority"
                />
                <FeatureRow feature="Nano Banana image API" starter="no" pro="roadmap" team="roadmap" enterprise="roadmap" />
                <FeatureRow feature="Chatbot automation" starter="no" pro="roadmap" team="roadmap" enterprise="roadmap" />
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="container max-w-3xl">
          <h2 className="heading-2 text-center mb-10">Frequently asked questions</h2>
          <FAQAccordion />
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-slate-50">
        <div className="container flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="text-black max-w-lg">
            <h3 className="text-2xl font-semibold">Ready to get started?</h3>
            <p className="small text-slate-500 mt-2">
              See a 5-minute live run and get a free trial analysis credit.
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/book-demo" className="btn btn-primary px-6 py-3 text-base font-medium rounded-lg shadow-md">
              Book a demo
            </Link>
            <Link href="/contact" className="btn btn-outline px-6 py-3 text-base font-medium rounded-lg">
              Contact sales
            </Link>
          </div>
        </div>
      </section>

      {/* Timing note */}
      <section className="py-6 bg-white border-t">
        <div className="container text-center text-sm text-slate-600 italic">
          Most runs complete in under 5 minutes—actual time depends on image count and data sources.
        </div>
      </section>
    </div>
  );
}

/* Plan card component */
interface PlanCardProps {
  name: string;
  price: string;
  period: string;
  description: string;
  cta: string;
  ctaHref: string;
  features: string[];
  highlighted?: boolean;
  extraRunPrice?: string;
}

function PlanCard({ name, price, period, description, cta, ctaHref, features, highlighted, extraRunPrice }: PlanCardProps) {
  return (
    <div
      className={`rounded-2xl border p-6 flex flex-col ${
        highlighted ? "border-emerald-500 shadow-lg relative" : "border-slate-200"
      }`}
    >
      {highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-500 text-white text-xs font-medium rounded-full">
          Most popular
        </div>
      )}
      <div className="text-center">
        <h3 className="text-xl font-semibold text-slate-900">{name}</h3>
        <div className="mt-4 flex items-baseline justify-center gap-1">
          <span className="text-4xl font-bold">{price}</span>
          {period && <span className="text-slate-600">{period}</span>}
        </div>
        <p className="mt-3 text-sm text-slate-600">{description}</p>
        {extraRunPrice && (
          <p className="mt-2 text-xs text-slate-500">Extra runs: {extraRunPrice}</p>
        )}
      </div>

      <Link
        href={ctaHref}
        className={`mt-6 w-full text-center px-4 py-2.5 rounded-lg font-medium transition ${
          highlighted
            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
            : "bg-slate-100 hover:bg-slate-200 text-slate-900"
        }`}
      >
        {cta}
      </Link>

      <ul className="mt-6 space-y-3 text-sm text-slate-700 flex-1">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2">
            <CheckIcon />
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* Feature row component */
interface FeatureRowProps {
  feature: string;
  starter: string;
  pro: string;
  team: string;
  enterprise: string;
}

function FeatureRow({ feature, starter, pro, team, enterprise }: FeatureRowProps) {
  const renderCell = (val: string) => {
    if (val === "yes") return <span className="text-emerald-600 font-medium">✓</span>;
    if (val === "no") return <span className="text-slate-400">—</span>;
    if (val === "limited") return <span className="text-amber-600 text-xs">Limited</span>;
    if (val === "roadmap") return <span className="text-blue-600 text-xs">Roadmap</span>;
    return <span className="text-slate-700 text-xs">{val}</span>;
  };

  return (
    <tr>
      <td className="p-4 font-medium text-slate-900">{feature}</td>
      <td className="p-4 text-center">{renderCell(starter)}</td>
      <td className="p-4 text-center">{renderCell(pro)}</td>
      <td className="p-4 text-center">{renderCell(team)}</td>
      <td className="p-4 text-center">{renderCell(enterprise)}</td>
    </tr>
  );
}

/* FAQ Accordion */
function FAQAccordion() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: "What counts as a run?",
      a: "One complete property analysis from input to report.",
    },
    {
      q: "Can I batch properties?",
      a: "Yes—Professional allows up to 10 per run, Team up to 25, Enterprise up to 100. Each property still counts as one run.",
    },
    {
      q: "Do I still need a builder or to view properties?",
      a: "Yes. PropVisions provides a rapid first-scan with cost bands so you can prioritise which properties to view and quote properly.",
    },
    {
      q: "How long does an analysis take?",
      a: "Most runs complete in under 5 minutes (depends on image count and available data).",
    },
    {
      q: "What is the billing period?",
      a: "All plans are billed monthly. Your included runs reset at the start of each billing cycle. Unused runs do not roll over.",
    },
    {
      q: "How do overages work?",
      a: "If you exceed your monthly run allowance, additional runs are charged at your plan's per-run rate. You'll be invoiced for overages at the end of the billing period.",
    },
    {
      q: "Can I cancel anytime?",
      a: "Yes. You can cancel your subscription at any time. You'll retain access until the end of your current billing period. No refunds for partial months.",
    },
    {
      q: "How is my data handled?",
      a: "We store your runs, outputs, and edits securely. You control what you share and can request deletion at any time. See our Privacy Policy for full details.",
    },
    {
      q: "What about Enterprise pricing?",
      a: "Enterprise pricing is custom and depends on volume, integrations, and support requirements. Setup includes custom AI prompts, white-label configuration, and integrations. Volume discounts are available. Contact sales for a tailored quote.",
    },
  ];

  return (
    <div className="space-y-3">
      {faqs.map((faq, i) => {
        const open = i === openIdx;
        return (
          <div key={i} className="rounded-xl border">
            <button
              className="w-full flex items-center justify-between px-5 py-4 text-left"
              onClick={() => setOpenIdx(open ? null : i)}
              aria-expanded={open}
            >
              <span className="font-medium text-slate-900">{faq.q}</span>
              <span className={`transition-transform ${open ? "rotate-180" : ""}`} aria-hidden>
                ▾
              </span>
            </button>
            <div
              className={`px-5 overflow-hidden transition-[max-height,opacity] duration-300 ${
                open ? "max-h-96 opacity-100 pb-4" : "max-h-0 opacity-0"
              }`}
            >
              <p className="text-sm text-slate-700">{faq.a}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* Icon */
function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className="text-emerald-600 flex-shrink-0 mt-0.5"
      aria-hidden
    >
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
