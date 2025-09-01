// src/app/how-it-works/page.tsx
export default function HowItWorksPage() {
  return (
    <div className="section">
      <div className="container space-y-10">
        <header>
          <h1 className="heading-2">How it works</h1>
          <p className="small mt-1 text-slate-600">
            A simple, checkable flow from link → clean data → works & rent → full numbers → export.
          </p>
        </header>

        {/* 1. End-to-end flow */}
        <ol className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch auto-rows-fr">
          {FLOW.map((s, i) => (
            <li key={s.title} className="card p-6 relative flex flex-col justify-start h-full min-h-[180px]">
              <span className="step-index" aria-hidden>{i + 1}</span>
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

        {/* 2. Refurb engine detail */}
        <section className="card p-6">
          <h3 className="card-title">Refurbishment estimation (from photos)</h3>
          <p className="small text-slate-700 mt-2">
            We spot the room and condition in each photo, then build a works list with typical local rates.
            You can edit items, add contingency, and lock figures once quotes arrive.
          </p>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="rounded-xl border p-4">
              <div className="font-medium">Classification</div>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Room type (kitchen, bathroom, bedroom, lounge, hall, exterior)</li>
                <li>Signs of wear (cabinet age, tile wear, damp marks, electrics)</li>
              </ul>
            </div>
            <div className="rounded-xl border p-4">
              <div className="font-medium">Works list</div>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Typical items per room (paint, flooring, fixtures, partial rewire)</li>
                <li>Local price ranges and labour</li>
              </ul>
            </div>
            <div className="rounded-xl border p-4">
              <div className="font-medium">Confidence & controls</div>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Confidence shown by room; flag low-quality photos for a quick check</li>
                <li>Contingency slider; lock once quotes/invoices arrive</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 3. Financial stack detail */}
        <section className="card p-6">
          <h3 className="card-title">Financials</h3>
          <p className="small text-slate-700 mt-2">
            Clear inputs, instant recalculation, lender-friendly outputs. Toggle voids, management, maintenance, and mortgage.
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm border rounded-xl overflow-hidden">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <th className="p-3 text-left">Component</th>
                  <th className="p-3 text-left">Included</th>
                  <th className="p-3 text-left">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr><td className="p-3 font-medium">Stamp duty</td><td className="p-3">✓</td><td className="p-3">BTL bands; scenario toggles</td></tr>
                <tr><td className="p-3 font-medium">Fees</td><td className="p-3">✓</td><td className="p-3">Legal, survey, insurance presets</td></tr>
                <tr><td className="p-3 font-medium">Operating</td><td className="p-3">✓</td><td className="p-3">Voids, management%, maintenance%</td></tr>
                <tr><td className="p-3 font-medium">Mortgage</td><td className="p-3">✓</td><td className="p-3">Interest-only or repayment (more options coming)</td></tr>
                <tr><td className="p-3 font-medium">Exports</td><td className="p-3">✓</td><td className="p-3">PDF snapshot + Excel model</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 4. Comps & EPC */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-6">
            <h3 className="card-title">Comps & checks</h3>
            <ul className="small text-slate-700 list-disc pl-5 mt-2 space-y-1">
              <li>Recent local sales/rental comps to flag £/sq ft outliers</li>
              <li>We widen ranges and prompt a quick manual review when needed</li>
            </ul>
          </div>
          <div className="card p-6">
            <h3 className="card-title">EPC enrichment</h3>
            <ul className="small text-slate-700 list-disc pl-5 mt-2 space-y-1">
              <li>Rating and recommended measures where available</li>
              <li>Stored for reporting and audit</li>
            </ul>
          </div>
        </section>

        {/* CTA */}
        <div className="rounded-2xl bg-slate-50 border p-6 flex items-center justify-between">
          <div>
            <div className="font-semibold">See it end-to-end on a real deal</div>
            <div className="small text-slate-600">We’ll walk through your URL and share the export pack.</div>
          </div>
          <a href="/book-demo" className="btn btn-primary">Book a demo</a>
        </div>
      </div>
    </div>
  );
}

const FLOW = [
  { title: "Paste a URL", desc: "Agent or auction page → tidy fields.", icon: IconList() },
  { title: "We fetch & compute", desc: "Works from photos, rent/value checks, fees and ROI.", icon: IconPlus() },
  { title: "Export & share", desc: "Lender-friendly PDF and Excel with every line item.", icon: IconSquare() },
] as const;

function IconList() {
  return (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden><path d="M4 7h16M4 12h10M4 17h7" strokeLinecap="round" /></svg>);
}
function IconPlus() {
  return (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden><path d="M12 3v6m0 6v6M3 12h6m6 0h6" strokeLinecap="round" /></svg>);
}
function IconSquare() {
  return (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden><path d="M4 4h16v16H4z" /></svg>);
}
