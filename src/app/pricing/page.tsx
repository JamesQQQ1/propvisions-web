// src/app/pricing/page.tsx
"use client";

import Link from "next/link";
import { useState } from "react";

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Hero Section with Animated Background */}
      <section className="relative pt-24 pb-16 overflow-hidden">
        {/* Animated gradient mesh background */}
        <div className="absolute inset-0 bg-gradient-mesh opacity-60 dark:opacity-40" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 dark:bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 dark:bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-cyan-500/10 dark:bg-cyan-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="container relative z-10 text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-sm font-medium border border-emerald-200 dark:border-emerald-800 mb-6 animate-fadeIn">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Simple, transparent pricing
          </div>

          <h1 className="heading-hero mb-6 animate-slideUp">
            Choose the plan that fits your <span className="text-gradient">workflow</span>
          </h1>

          <p className="subhead mx-auto animate-slideUp delay-100">
            Filter 100 down to the best 10 in minutes—then go view only what's worth viewing. PropVisions accelerates
            due diligence so you can focus on the right properties.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-16 relative">
        <div className="container max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <PlanCard
              index={0}
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
              hoveredCard={hoveredCard}
              setHoveredCard={setHoveredCard}
            />

            <PlanCard
              index={1}
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
              hoveredCard={hoveredCard}
              setHoveredCard={setHoveredCard}
            />

            <PlanCard
              index={2}
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
              hoveredCard={hoveredCard}
              setHoveredCard={setHoveredCard}
            />

            <PlanCard
              index={3}
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
              hoveredCard={hoveredCard}
              setHoveredCard={setHoveredCard}
            />
          </div>

          <div className="container max-w-7xl mt-8 space-y-2 text-center text-sm text-slate-600 dark:text-slate-400 animate-fadeIn delay-300">
            <p>Batch upload lets you process multiple properties at once—each analysed property still counts as one run.</p>
            <p className="italic">Most runs complete in under 5 minutes (depends on image count and data sources).</p>
          </div>
        </div>
      </section>

      {/* Feature comparison table */}
      <section className="py-16 bg-slate-50 dark:bg-slate-900/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial opacity-50" />

        <div className="container relative z-10">
          <h2 className="heading-2 text-center mb-10 text-3xl font-bold animate-slideUp">
            Feature <span className="text-gradient">comparison</span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full max-w-6xl mx-auto bg-white dark:bg-slate-900 border-2 dark:border-slate-800 rounded-2xl text-sm shadow-xl">
              <thead className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-800 text-slate-700 dark:text-slate-300">
                <tr>
                  <th className="p-4 text-left font-semibold">Feature</th>
                  <th className="p-4 text-center font-semibold">Starter</th>
                  <th className="p-4 text-center font-semibold">Professional</th>
                  <th className="p-4 text-center font-semibold">Team</th>
                  <th className="p-4 text-center font-semibold">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-slate-800">
                <FeatureRow
                  index={0}
                  feature="Monthly runs"
                  starter="10"
                  pro="50"
                  team="100"
                  enterprise="Custom"
                  hoveredRow={hoveredRow}
                  setHoveredRow={setHoveredRow}
                />
                <FeatureRow
                  index={1}
                  feature="Extra run cost"
                  starter="£15"
                  pro="£12"
                  team="£10"
                  enterprise="Volume pricing"
                  hoveredRow={hoveredRow}
                  setHoveredRow={setHoveredRow}
                />
                <FeatureRow
                  index={2}
                  feature="Batch upload"
                  starter="no"
                  pro="Up to 10"
                  team="Up to 25"
                  enterprise="Up to 100"
                  hoveredRow={hoveredRow}
                  setHoveredRow={setHoveredRow}
                />
                <FeatureRow
                  index={3}
                  feature="Typical analysis time"
                  starter="~5 min/property"
                  pro="~5 min/property"
                  team="~5 min/property"
                  enterprise="~5 min/property"
                  hoveredRow={hoveredRow}
                  setHoveredRow={setHoveredRow}
                />
                <FeatureRow
                  index={4}
                  feature="Decision-support role (not replacement)"
                  starter="yes"
                  pro="yes"
                  team="yes"
                  enterprise="yes"
                  hoveredRow={hoveredRow}
                  setHoveredRow={setHoveredRow}
                />
                <FeatureRow
                  index={5}
                  feature="Supported portals (major UK portals; coverage varies)"
                  starter="yes"
                  pro="yes"
                  team="yes"
                  enterprise="yes"
                  hoveredRow={hoveredRow}
                  setHoveredRow={setHoveredRow}
                />
                <FeatureRow
                  index={6}
                  feature="EPC fetch & attach"
                  starter="yes"
                  pro="yes"
                  team="yes"
                  enterprise="yes"
                  hoveredRow={hoveredRow}
                  setHoveredRow={setHoveredRow}
                />
                <FeatureRow
                  index={7}
                  feature="AI rent estimation (baseline + regression)"
                  starter="yes"
                  pro="yes"
                  team="yes"
                  enterprise="yes"
                  hoveredRow={hoveredRow}
                  setHoveredRow={setHoveredRow}
                />
                <FeatureRow
                  index={8}
                  feature="Room-by-room refurb pricing from photos"
                  starter="yes"
                  pro="yes"
                  team="yes"
                  enterprise="yes"
                  hoveredRow={hoveredRow}
                  setHoveredRow={setHoveredRow}
                />
                <FeatureRow
                  index={9}
                  feature="Scenario modelling"
                  starter="limited"
                  pro="yes"
                  team="yes"
                  enterprise="yes"
                  hoveredRow={hoveredRow}
                  setHoveredRow={setHoveredRow}
                />
                <FeatureRow
                  index={10}
                  feature="Investor PDF & Builder PDF"
                  starter="yes"
                  pro="yes"
                  team="yes"
                  enterprise="yes"
                  hoveredRow={hoveredRow}
                  setHoveredRow={setHoveredRow}
                />
                <FeatureRow
                  index={11}
                  feature="API & integration access"
                  starter="no"
                  pro="no"
                  team="yes"
                  enterprise="yes"
                  hoveredRow={hoveredRow}
                  setHoveredRow={setHoveredRow}
                />
                <FeatureRow
                  index={12}
                  feature="White-label branding"
                  starter="no"
                  pro="no"
                  team="yes"
                  enterprise="yes"
                  hoveredRow={hoveredRow}
                  setHoveredRow={setHoveredRow}
                />
                <FeatureRow
                  index={13}
                  feature="Team seats"
                  starter="1"
                  pro="3"
                  team="10"
                  enterprise="Custom"
                  hoveredRow={hoveredRow}
                  setHoveredRow={setHoveredRow}
                />
                <FeatureRow
                  index={14}
                  feature="Priority support / SLA"
                  starter="no"
                  pro="Business hours"
                  team="Phone & chat"
                  enterprise="24×7 with SLA"
                  hoveredRow={hoveredRow}
                  setHoveredRow={setHoveredRow}
                />
                <FeatureRow
                  index={15}
                  feature="CRM & data integrations"
                  starter="no"
                  pro="limited"
                  team="yes"
                  enterprise="Yes custom"
                  hoveredRow={hoveredRow}
                  setHoveredRow={setHoveredRow}
                />
                <FeatureRow
                  index={16}
                  feature="Off-market sourcing (probate/distress)"
                  starter="roadmap"
                  pro="roadmap"
                  team="roadmap"
                  enterprise="Roadmap priority"
                  hoveredRow={hoveredRow}
                  setHoveredRow={setHoveredRow}
                />
                <FeatureRow
                  index={17}
                  feature="Portfolio dashboards"
                  starter="roadmap"
                  pro="roadmap"
                  team="roadmap"
                  enterprise="Roadmap priority"
                  hoveredRow={hoveredRow}
                  setHoveredRow={setHoveredRow}
                />
                <FeatureRow
                  index={18}
                  feature="Mortgage trigger with forward rates"
                  starter="roadmap"
                  pro="roadmap"
                  team="roadmap"
                  enterprise="Roadmap priority"
                  hoveredRow={hoveredRow}
                  setHoveredRow={setHoveredRow}
                />
                <FeatureRow
                  index={19}
                  feature="Smart agent automation"
                  starter="no"
                  pro="roadmap"
                  team="roadmap"
                  enterprise="Roadmap priority"
                  hoveredRow={hoveredRow}
                  setHoveredRow={setHoveredRow}
                />
                <FeatureRow
                  index={20}
                  feature="Nano Banana image API"
                  starter="no"
                  pro="roadmap"
                  team="roadmap"
                  enterprise="roadmap"
                  hoveredRow={hoveredRow}
                  setHoveredRow={setHoveredRow}
                />
                <FeatureRow
                  index={21}
                  feature="Chatbot automation"
                  starter="no"
                  pro="roadmap"
                  team="roadmap"
                  enterprise="roadmap"
                  hoveredRow={hoveredRow}
                  setHoveredRow={setHoveredRow}
                />
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-3xl" />
        </div>

        <div className="container max-w-3xl relative z-10">
          <h2 className="heading-2 text-center mb-10 text-3xl font-bold animate-slideUp">
            Frequently asked <span className="text-gradient">questions</span>
          </h2>
          <FAQAccordion />
        </div>
      </section>

      {/* CTA Section with Gradient */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 opacity-5 dark:opacity-10" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-500/20 dark:bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        </div>

        <div className="container relative z-10 max-w-5xl">
          <div className="rounded-3xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-[2px] shadow-2xl animate-scaleIn">
            <div className="rounded-3xl bg-white dark:bg-slate-900 p-12">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="text-slate-900 dark:text-slate-100 max-w-lg">
                  <h3 className="text-3xl font-bold mb-2">Ready to get started?</h3>
                  <p className="text-slate-600 dark:text-slate-400 mt-2">
                    See a 5-minute live run and get a free trial analysis credit.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Link
                    href="/book-demo"
                    className="btn btn-primary px-6 py-3 text-base font-medium rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                  >
                    Book a demo
                  </Link>
                  <Link
                    href="/contact"
                    className="btn btn-outline px-6 py-3 text-base font-medium rounded-xl hover:scale-105 transition-all duration-300"
                  >
                    Contact sales
                  </Link>
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

/* Plan card component */
interface PlanCardProps {
  index: number;
  name: string;
  price: string;
  period: string;
  description: string;
  cta: string;
  ctaHref: string;
  features: string[];
  highlighted?: boolean;
  extraRunPrice?: string;
  hoveredCard: number | null;
  setHoveredCard: (index: number | null) => void;
}

function PlanCard({
  index,
  name,
  price,
  period,
  description,
  cta,
  ctaHref,
  features,
  highlighted,
  extraRunPrice,
  hoveredCard,
  setHoveredCard
}: PlanCardProps) {
  const isHovered = hoveredCard === index;

  return (
    <div
      className={`
        relative rounded-2xl p-6 flex flex-col transition-all duration-500 animate-scaleIn
        ${highlighted
          ? 'bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-[2px] shadow-2xl'
          : 'border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
        }
        ${isHovered ? 'scale-105 shadow-2xl' : 'hover:scale-[1.02] hover:shadow-xl'}
      `}
      style={{ animationDelay: `${index * 100}ms` }}
      onMouseEnter={() => setHoveredCard(index)}
      onMouseLeave={() => setHoveredCard(null)}
    >
      {highlighted ? (
        <>
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-full shadow-lg animate-pulse">
            Most popular
          </div>
          <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 flex flex-col h-full">
            <CardContent
              name={name}
              price={price}
              period={period}
              description={description}
              extraRunPrice={extraRunPrice}
              cta={cta}
              ctaHref={ctaHref}
              features={features}
              highlighted={highlighted}
            />
          </div>
        </>
      ) : (
        <CardContent
          name={name}
          price={price}
          period={period}
          description={description}
          extraRunPrice={extraRunPrice}
          cta={cta}
          ctaHref={ctaHref}
          features={features}
          highlighted={highlighted}
        />
      )}
    </div>
  );
}

function CardContent({
  name,
  price,
  period,
  description,
  extraRunPrice,
  cta,
  ctaHref,
  features,
  highlighted
}: Omit<PlanCardProps, 'index' | 'hoveredCard' | 'setHoveredCard'>) {
  return (
    <>
      <div className="text-center">
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{name}</h3>
        <div className="mt-4 flex items-baseline justify-center gap-1">
          <span className="text-4xl font-bold text-slate-900 dark:text-slate-100">{price}</span>
          {period && <span className="text-slate-600 dark:text-slate-400">{period}</span>}
        </div>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{description}</p>
        {extraRunPrice && (
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-500">Extra runs: {extraRunPrice}</p>
        )}
      </div>

      <Link
        href={ctaHref}
        className={`
          mt-6 w-full text-center px-4 py-2.5 rounded-xl font-medium transition-all duration-300
          ${highlighted
            ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl hover:scale-105"
            : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 hover:scale-105"
          }
        `}
      >
        {cta}
      </Link>

      <ul className="mt-6 space-y-3 text-sm text-slate-700 dark:text-slate-300 flex-1">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 group">
            <CheckIcon />
            <span className="group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{f}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

/* Feature row component */
interface FeatureRowProps {
  index: number;
  feature: string;
  starter: string;
  pro: string;
  team: string;
  enterprise: string;
  hoveredRow: number | null;
  setHoveredRow: (index: number | null) => void;
}

function FeatureRow({ index, feature, starter, pro, team, enterprise, hoveredRow, setHoveredRow }: FeatureRowProps) {
  const isHovered = hoveredRow === index;

  const renderCell = (val: string) => {
    if (val === "yes") return (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900 transition-transform duration-300 hover:scale-110">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="text-emerald-600 dark:text-emerald-400">
          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
    if (val === "no") return <span className="text-slate-400 dark:text-slate-600">—</span>;
    if (val === "limited") return <span className="inline-flex items-center px-2 py-1 rounded-md bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 text-xs font-medium">Limited</span>;
    if (val === "roadmap") return <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-medium">Roadmap</span>;
    return <span className="text-slate-700 dark:text-slate-300 text-xs font-medium">{val}</span>;
  };

  return (
    <tr
      className={`
        transition-all duration-300
        ${isHovered
          ? 'bg-blue-50 dark:bg-blue-950/30 scale-[1.01]'
          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
        }
      `}
      onMouseEnter={() => setHoveredRow(index)}
      onMouseLeave={() => setHoveredRow(null)}
    >
      <td className="p-4 font-medium text-slate-900 dark:text-slate-100">{feature}</td>
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
          <div
            key={i}
            className={`
              rounded-2xl border-2 transition-all duration-300 animate-slideUp
              ${open
                ? 'border-blue-500 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-950/30 shadow-lg'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
              }
            `}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <button
              className="w-full flex items-center justify-between px-6 py-5 text-left group"
              onClick={() => setOpenIdx(open ? null : i)}
              aria-expanded={open}
            >
              <span className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {faq.q}
              </span>
              <span
                className={`
                  transition-all duration-300 text-slate-500 dark:text-slate-400 text-xl
                  ${open ? 'rotate-180 text-blue-600 dark:text-blue-400' : 'group-hover:text-blue-600 dark:group-hover:text-blue-400'}
                `}
                aria-hidden
              >
                ▾
              </span>
            </button>
            <div
              className={`
                px-6 overflow-hidden transition-all duration-500 ease-in-out
                ${open ? 'max-h-96 opacity-100 pb-5' : 'max-h-0 opacity-0'}
              `}
            >
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{faq.a}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* Check Icon */
function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      className="text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5 transition-transform duration-300 group-hover:scale-110"
      aria-hidden
    >
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
