// src/components/Differentiation.tsx
import Link from "next/link";

const features = [
  { key: "url", label: "Paste a URL → full underwriting pack" },
  { key: "vision", label: "Vision refurb from photos (regional trade rates)" },
  { key: "rent", label: "Hybrid rent (priors + comps + AI) with bands" },
  { key: "roi", label: "ROI, cash flow & mortgage scenarios" },
  { key: "feedback", label: "Human-in-the-loop feedback that improves outputs" },
  { key: "monitor", label: "Post-purchase monitoring & remortgage alerts" },
  { key: "sourcing", label: "Deal sourcing & alerts" },
  { key: "dashboards", label: "Market dashboards & heatmaps" },
];

type Product = {
  name: string;
  tagline: string;
  highlights: string[];
  matrix: Record<string, "yes" | "no" | "soon">;
};

const products: Product[] = [
  {
    name: "PropertyScout",
    tagline:
      "Automated underwriting & investor-ready reporting that learns from your edits.",
    highlights: [
      "Underwrite from any listing link in minutes",
      "Vision refurb with regional price book",
      "Transparent methods + adjustable assumptions",
    ],
    matrix: {
      url: "yes",
      vision: "yes",
      rent: "yes",
      roi: "yes",
      feedback: "yes",
      monitor: "yes",
      sourcing: "soon",
      dashboards: "soon",
    },
  },
  {
    name: "Property Market Intel",
    tagline: "Market research & comps.",
    highlights: ["Rich comparables", "Trends & maps"],
    matrix: {
      url: "no",
      vision: "no",
      rent: "no",
      roi: "no",
      feedback: "no",
      monitor: "no",
      sourcing: "no",
      dashboards: "yes",
    },
  },
  {
    name: "PropertyEngine",
    tagline: "Deal sourcing & filters.",
    highlights: ["Portal scanning", "Lead pipelines"],
    matrix: {
      url: "no",
      vision: "no",
      rent: "no",
      roi: "yes",
      feedback: "no",
      monitor: "no",
      sourcing: "yes",
      dashboards: "no",
    },
  },
];

function Badge({ state }: { state: "yes" | "no" | "soon" }) {
  const map = {
    yes: { text: "Yes", cn: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    no: { text: "No", cn: "bg-rose-50 text-rose-700 border-rose-200" },
    soon: { text: "Soon", cn: "bg-amber-50 text-amber-700 border-amber-200" },
  }[state];
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${map.cn}`}>
      {map.text}
    </span>
  );
}

export default function Differentiation() {
  return (
    <section className="container py-12">
      <div className="mx-auto max-w-4xl text-center">
        <p className="text-sm uppercase tracking-wider text-slate-500">Positioning</p>
        <h2 className="mt-1 text-3xl font-semibold text-slate-900">
          Not a calculator. Not a scraper. <span className="text-brand-700">An underwriting co-pilot.</span>
        </h2>
        <p className="mt-3 text-slate-600">
          PropertyScout automates the underwriting pack from a single URL—refurb from photos,
          rent bands, ROI & mortgage scenarios—then learns from your edits and monitors after purchase.
        </p>
      </div>

      {/* Product cards */}
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {products.map((p) => (
          <div key={p.name} className="rounded-2xl border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">{p.name}</h3>
            <p className="mt-1 text-sm text-slate-600">{p.tagline}</p>
            <ul className="mt-4 space-y-1.5 text-sm text-slate-700">
              {p.highlights.map((h) => (
                <li key={h} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-300" />
                  {h}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Feature matrix */}
      <div className="mt-10 overflow-x-auto">
        <table className="w-full min-w-[720px] border-separate border-spacing-y-6">
          <thead>
            <tr className="text-left text-sm text-slate-600">
              <th className="px-4">Feature</th>
              {products.map((p) => (
                <th key={p.name} className="px-4">{p.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {features.map((f) => (
              <tr key={f.key} className="align-top">
                <td className="px-4 text-sm font-medium text-slate-800">{f.label}</td>
                {products.map((p) => (
                  <td key={p.name} className="px-4">
                    <Badge state={p.matrix[f.key as keyof Product["matrix"]]} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CTA / reassurance */}
      <div className="mt-10 flex flex-col items-center justify-between gap-4 rounded-2xl border bg-slate-50 p-6 md:flex-row">
        <p className="text-slate-700">
          Have PMI or PropertyEngine already? Great—PropertyScout sits underneath as the <em>underwriting layer</em>.
        </p>
        <div className="flex gap-3">
          <Link href="/book-demo" className="btn btn-primary">Book a demo</Link>
          <Link href="/accuracy" className="btn">See accuracy plan</Link>
        </div>
      </div>
    </section>
  );
}
