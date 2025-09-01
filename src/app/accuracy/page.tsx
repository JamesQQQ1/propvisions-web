// src/app/accuracy/page.tsx
export default function AccuracyPage() {
  return (
    <div className="section">
      <div className="container space-y-10">
        <header>
          <h1 className="heading-2">Accuracy & Methodology</h1>
          <p className="small text-slate-600">
            Clear methods, visible confidence ranges, and a continual improvement loop based on real outcomes.
          </p>
        </header>

        {/* Targets */}
        <section className="card p-6">
          <h3 className="card-title">Targets (Beta → Stable)</h3>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm border rounded-xl overflow-hidden">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <th className="p-3 text-left">Output</th>
                  <th className="p-3 text-left">Metric</th>
                  <th className="p-3 text-left">Target</th>
                  <th className="p-3 text-left">Confidence policy</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="p-3 font-medium">Rent range</td>
                  <td className="p-3">Average error; % within range</td>
                  <td className="p-3">~20–25% → ≤ 15%; ≥ 80% within range</td>
                  <td className="p-3">Use wider ranges when local comparables are thin; ask for a quick manual check</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Works total</td>
                  <td className="p-3">Average error vs quotes/invoices</td>
                  <td className="p-3">~25–35% → ≤ 20%</td>
                  <td className="p-3">Room-level confidence shown; suggest contingency where needed</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">EPC match</td>
                  <td className="p-3">Correct match rate</td>
                  <td className="p-3">~85% → ≥ 95%</td>
                  <td className="p-3">Strict address checks with safe fallbacks</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Yield/ROI</td>
                  <td className="p-3">Carries input uncertainty</td>
                  <td className="p-3">Ranges narrow as inputs confirm</td>
                  <td className="p-3">Show assumptions and label what moves results</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Methods */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-6">
            <h3 className="card-title">Rent estimation</h3>
            <ul className="small text-slate-700 list-disc pl-5 mt-2 space-y-1">
              <li>Local history by postcode and property features set the baseline</li>
              <li>Listing details (condition/finish) adjust the range within sensible limits</li>
              <li>Wider range when fewer local comparables are available; prompts for a quick check</li>
            </ul>
          </div>
          <div className="card p-6">
            <h3 className="card-title">Works from photos</h3>
            <ul className="small text-slate-700 list-disc pl-5 mt-2 space-y-1">
              <li>Identify room type and apply typical scope (paint, flooring, fixtures, electrics)</li>
              <li>Local cost ranges with a confidence note per room</li>
              <li>Add contingency; lock figures once quotes arrive</li>
            </ul>
          </div>
          <div className="card p-6">
            <h3 className="card-title">Comps & EPC</h3>
            <ul className="small text-slate-700 list-disc pl-5 mt-2 space-y-1">
              <li>£/sq ft checks to spot outliers</li>
              <li>Careful EPC matching by address with strict checks</li>
            </ul>
          </div>
          <div className="card p-6">
            <h3 className="card-title">Financials & reporting</h3>
            <ul className="small text-slate-700 list-disc pl-5 mt-2 space-y-1">
              <li>Stamp duty, fees, running costs, mortgage; cash flow and ROI</li>
              <li>Exports: lender-friendly PDF and fully traceable Excel</li>
            </ul>
          </div>
        </section>

        {/* Improvement loop */}
        <section className="card p-6">
          <h3 className="card-title">Improvement loop</h3>
          <ul className="small text-slate-700 list-disc pl-5 mt-2 space-y-1">
            <li><strong>Edit-to-improve:</strong> Your changes to rent or works update local baselines</li>
            <li><strong>Regular checks:</strong> Ongoing evaluation on past deals; we watch for changes over time</li>
            <li><strong>Release cadence:</strong> Updates weekly in beta; monthly once stable</li>
          </ul>
        </section>

        <div className="rounded-2xl bg-slate-50 border p-6 flex items-center justify-between">
          <div>
            <div className="font-semibold">Want a deep-dive on a specific area?</div>
            <div className="small text-slate-600">We’ll walk through the method and share local baselines.</div>
          </div>
          <a href="/book-demo" className="btn btn-primary">Book a demo</a>
        </div>
      </div>
    </div>
  );
}
