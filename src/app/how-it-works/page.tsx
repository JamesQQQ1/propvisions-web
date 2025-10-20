// src/app/how-it-works/page.tsx
export default function HowItWorksPage() {
  return (
    <div className="section">
      <div className="container space-y-10">
        <header>
          <h1 className="heading-2">How PropVisions works</h1>
          <p className="small mt-1 text-slate-600">
            From listing URL (or batch upload) to complete deal pack in under 5 minutes per property.
            Transparent, traceable, and export-ready. PropVisions accelerates analysis—it doesn't replace site visits or professional quotes.
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
          <h3 className="card-title">Photo-based refurb pricing</h3>
          <p className="small text-slate-700 mt-2">
            PropVisions analyzes each photo to identify room type and condition, then maps work to floorplans
            where available. Regional builder rates are applied, and missing rooms are flagged for agent follow-up.
          </p>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="rounded-xl border p-4">
              <div className="font-medium">Room classification</div>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Kitchen, bathroom, bedroom, lounge, hall, exterior</li>
                <li>Condition indicators: wear, damp, electrics, fixtures</li>
              </ul>
            </div>
            <div className="rounded-xl border p-4">
              <div className="font-medium">Floorplan mapping</div>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Maps photos to rooms when floorplan is available</li>
                <li>Flags missing rooms and prompts agent nudges</li>
              </ul>
            </div>
            <div className="rounded-xl border p-4">
              <div className="font-medium">Regional pricing</div>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Builder rates adjusted by postcode area</li>
                <li>Contingency controls and quote lock-in</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 3. Rent estimation detail */}
        <section className="card p-6">
          <h3 className="card-title">Rent estimation & valuation</h3>
          <p className="small text-slate-700 mt-2">
            PropVisions combines regional rental baselines with regression models adjusted by listing signals
            (beds, location, condition). Output includes a rationale, confidence band, and post-refurb valuation estimate.
          </p>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="rounded-xl border p-4">
              <div className="font-medium">Rent estimation</div>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Regional baselines + listing signal regression</li>
                <li>Confidence bands (low, mid, high)</li>
                <li>Rationale showing key drivers</li>
              </ul>
            </div>
            <div className="rounded-xl border p-4">
              <div className="font-medium">Post-refurb valuation</div>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Estimate based on local sales data</li>
                <li>Accounts for planned improvements</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 4. Financial stack detail */}
        <section className="card p-6">
          <h3 className="card-title">Full financials & ROI</h3>
          <p className="small text-slate-700 mt-2">
            All costs, fees, and ongoing expenses calculated automatically. Scenario comparisons for BTL and simple exit strategies.
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
                <tr><td className="p-3 font-medium">SDLT</td><td className="p-3">✓</td><td className="p-3">BTL rates with scenario toggles</td></tr>
                <tr><td className="p-3 font-medium">Fees</td><td className="p-3">✓</td><td className="p-3">Legal, survey, insurance, broker</td></tr>
                <tr><td className="p-3 font-medium">Operating costs</td><td className="p-3">✓</td><td className="p-3">Voids, management %, maintenance %</td></tr>
                <tr><td className="p-3 font-medium">Mortgage</td><td className="p-3">✓</td><td className="p-3">Standard assumptions (forward rates coming)</td></tr>
                <tr><td className="p-3 font-medium">Exports</td><td className="p-3">✓</td><td className="p-3">Investor PDF + Excel breakdown</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 5. EPC & export */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-6">
            <h3 className="card-title">EPC matching & upgrades</h3>
            <ul className="small text-slate-700 list-disc pl-5 mt-2 space-y-1">
              <li>Fetches official EPC from UK government register</li>
              <li>Shows upgrade suggestions and expected rating uplift</li>
              <li>Stored for audit and compliance reporting</li>
            </ul>
          </div>
          <div className="card p-6">
            <h3 className="card-title">Export-ready reports</h3>
            <ul className="small text-slate-700 list-disc pl-5 mt-2 space-y-1">
              <li>Investor PDF: full deal pack with financials and assumptions</li>
              <li>Builder quote PDF: room-by-room materials and cost breakdown</li>
              <li>Both reports are brandable for client delivery</li>
            </ul>
          </div>
        </section>

        {/* CTA */}
        <div className="rounded-2xl bg-slate-50 border p-6 flex items-center justify-between">
          <div>
            <div className="font-semibold">Ready to get started?</div>
            <div className="small text-slate-600">See a 5-minute live run and get a free trial analysis credit.</div>
          </div>
          <a href="/book-demo" className="btn btn-primary">Get a ranked shortlist</a>
        </div>
      </div>
    </div>
  );
}

const FLOW = [
  { title: "Paste URL or batch upload", desc: "Process up to 100 properties at once (tier-dependent). Major UK portals supported—Rightmove, Zoopla, OnTheMarket. Coverage varies by source.", icon: IconList() },
  { title: "Analysis runs", desc: "Room-by-room refurb from photos, EPC matching, rent estimation, and full financial projections. Typically under 5 minutes per property.", icon: IconPlus() },
  { title: "Review & export", desc: "Check estimates, adjust assumptions, export investor PDF and builder quote. Use results to prioritize which properties to view.", icon: IconSquare() },
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
