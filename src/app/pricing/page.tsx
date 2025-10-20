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
            cta="Get a ranked shortlist"
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
            cta="Get a ranked shortlist"
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
            cta="Get a ranked shortlist"
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
            cta="Talk to sales"
            ctaHref="/contact"
            features={[
              "Full system integration",
              "Custom AI prompts & datasets",
              "Batch up to 100 properties/run",
              "Dedicated account manager & SLA",
              "£8,000 setup fee",
              "From £8.50 per property run",
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
                <FeatureRow
                  feature="Monthly runs included"
                  basic="10"
                  pro="40"
                  enterprise="Custom"
                />
                <FeatureRow
                  feature="Extra run price"
                  basic="£15"
                  pro="£12"
                  enterprise="From £8.50 (volume)"
                />
                <FeatureRow
                  feature="Supported portals (major UK portals; coverage varies)"
                  basic="yes"
                  pro="yes"
                  enterprise="yes"
                />
                <FeatureRow
                  feature="Official EPC fetch & attach"
                  basic="yes"
                  pro="yes"
                  enterprise="yes"
                />
                <FeatureRow
                  feature="AI rent estimation (baselines + regression)"
                  basic="yes"
                  pro="yes"
                  enterprise="yes"
                />
                <FeatureRow
                  feature="Room-by-room refurb pricing from photos"
                  basic="yes"
                  pro="yes"
                  enterprise="yes"
                />
                <FeatureRow
                  feature="Floorplan mapping for images (if available)"
                  basic="yes"
                  pro="yes"
                  enterprise="yes"
                />
                <FeatureRow
                  feature="Missing-photo alerts & agent nudges"
                  basic="yes"
                  pro="yes"
                  enterprise="yes"
                />
                <FeatureRow
                  feature="EPC upgrade suggestions & uplift view"
                  basic="yes"
                  pro="yes"
                  enterprise="yes"
                />
                <FeatureRow
                  feature="Post-refurb valuation estimate"
                  basic="yes"
                  pro="yes"
                  enterprise="yes"
                />
                <FeatureRow
                  feature="Scenario modelling (BTL, simple exit)"
                  basic="yes"
                  pro="yes"
                  enterprise="yes"
                />
                <FeatureRow
                  feature="Expanded scenario modes (HMO, Airbnb, Social)"
                  basic="limited"
                  pro="yes"
                  enterprise="yes"
                />
                <FeatureRow
                  feature="Investor PDF (brandable)"
                  basic="yes"
                  pro="yes"
                  enterprise="yes"
                />
                <FeatureRow
                  feature="Builder quote PDF"
                  basic="yes"
                  pro="yes"
                  enterprise="yes"
                />
                <FeatureRow
                  feature="Alerts for listing/price changes"
                  basic="yes"
                  pro="yes"
                  enterprise="yes"
                />
                <FeatureRow
                  feature="API access"
                  basic="limited"
                  pro="yes"
                  enterprise="Yes with SLA"
                />
                <FeatureRow
                  feature="White-label branding"
                  basic="no"
                  pro="limited"
                  enterprise="yes"
                />
                <FeatureRow
                  feature="Team seats & roles"
                  basic="2"
                  pro="10"
                  enterprise="Custom"
                />
                <FeatureRow
                  feature="Priority support / SLA"
                  basic="no"
                  pro="Business hours"
                  enterprise="24×7 with SLA"
                />
                <FeatureRow
                  feature="CRM & data integrations"
                  basic="no"
                  pro="limited"
                  enterprise="Yes custom"
                />
                <FeatureRow
                  feature="Off-market sourcing (probate/distress)"
                  basic="roadmap"
                  pro="roadmap"
                  enterprise="Roadmap priority"
                />
                <FeatureRow
                  feature="Portfolio dashboards"
                  basic="roadmap"
                  pro="roadmap"
                  enterprise="Roadmap priority"
                />
                <FeatureRow
                  feature="Mortgage trigger with forward rates"
                  basic="roadmap"
                  pro="roadmap"
                  enterprise="Roadmap priority"
                />
                <FeatureRow
                  feature="Smart agent automation"
                  basic="no"
                  pro="roadmap"
                  enterprise="Roadmap priority"
                />
                <FeatureRow
                  feature="Nano Banana image API"
                  basic="no"
                  pro="roadmap"
                  enterprise="roadmap"
                />
                <FeatureRow
                  feature="Chatbot automation"
                  basic="no"
                  pro="roadmap"
                  enterprise="roadmap"
                />
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
              Book a demo to see PropVisions in action and get a free trial analysis credit.
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/book-demo" className="btn btn-primary px-6 py-3 text-base font-medium rounded-lg shadow-md">
              Book a demo
            </Link>
            <Link href="/contact" className="btn btn-outline px-6 py-3 text-base font-medium rounded-lg">
              Talk to sales
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
}

function PlanCard({ name, price, period, description, cta, ctaHref, features, highlighted }: PlanCardProps) {
  return (
    <div
      className={`rounded-2xl border p-6 flex flex-col ${
        highlighted ? "border-emerald-500 shadow-lg relative" : "border-slate-200"
      }`}
    >
      {highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-500 text-white text-xs font-medium rounded-full">
          Popular
        </div>
      )}
      <div className="text-center">
        <h3 className="text-xl font-semibold text-slate-900">{name}</h3>
        <div className="mt-4 flex items-baseline justify-center gap-1">
          <span className="text-4xl font-bold">{price}</span>
          {period && <span className="text-slate-600">{period}</span>}
        </div>
        <p className="mt-3 text-sm text-slate-600">{description}</p>
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
  basic: string;
  pro: string;
  enterprise: string;
}

function FeatureRow({ feature, basic, pro, enterprise }: FeatureRowProps) {
  const renderCell = (val: string) => {
    if (val === "yes") return <span className="text-emerald-600 font-medium">✓</span>;
    if (val === "no") return <span className="text-slate-400">—</span>;
    if (val === "limited") return <span className="text-amber-600 text-xs">Limited</span>;
    if (val === "roadmap") return <span className="text-blue-600 text-xs">Roadmap</span>;
    return <span className="text-slate-700">{val}</span>;
  };

  return (
    <tr>
      <td className="p-4 font-medium text-slate-900">{feature}</td>
      <td className="p-4 text-center">{renderCell(basic)}</td>
      <td className="p-4 text-center">{renderCell(pro)}</td>
      <td className="p-4 text-center">{renderCell(enterprise)}</td>
    </tr>
  );
}

/* FAQ Accordion */
function FAQAccordion() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: "What counts as a 'run'?",
      a: "One run = one property analysis from URL or upload. This includes refurb pricing, rent estimation, EPC matching, financials, and export PDFs. Editing or re-running the same property does not count as a new run.",
    },
    {
      q: "What is the billing period?",
      a: "All plans are billed monthly. Your included runs reset at the start of each billing cycle. Unused runs do not roll over.",
    },
    {
      q: "How do overages work?",
      a: "If you exceed your monthly run allowance, additional runs are charged at your plan's per-run rate (£15 for Basic, £12 for Pro). You'll be invoiced for overages at the end of the billing period.",
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
      a: "Enterprise pricing is custom and depends on volume, integrations, and support requirements. The £8,000 setup fee covers custom AI prompts, white-label configuration, and integrations. Ongoing per-run fees start at £8.50 and decrease with volume. Contact sales for a tailored quote.",
    },
    {
      q: "Do I need an API key?",
      a: "API access is available on Pro and Enterprise plans. We'll provide credentials and documentation once your account is set up.",
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
