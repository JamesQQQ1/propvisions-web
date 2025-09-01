// src/app/accuracy/page.tsx
export default function AccuracyPage() {
    return (
      <div className="section">
        <div className="container space-y-10">
          <header>
            <h1 className="heading-2">Accuracy & Methodology</h1>
            <p className="small text-slate-600">
              Transparent methods, confidence bands, and a continual improvement loop informed by real-world outcomes.
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
                    <td className="p-3 font-medium">Rent band</td>
                    <td className="p-3">MAPE; band hit-rate</td>
                    <td className="p-3">~20–25% → ≤ 15%; ≥ 80% hit-rate</td>
                    <td className="p-3">Show wider bands on sparse comps; flag for manual check</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">Refurb total</td>
                    <td className="p-3">MAPE vs quotes/invoices</td>
                    <td className="p-3">~25–35% → ≤ 20%</td>
                    <td className="p-3">Room-level confidence; prompt contingency</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">EPC match</td>
                    <td className="p-3">Correct match rate</td>
                    <td className="p-3">~85% → ≥ 95%</td>
                    <td className="p-3">Strict postcode/heuristic thresholds; fallbacks</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">Yield/ROI</td>
                    <td className="p-3">Propagated error</td>
                    <td className="p-3">Narrowing bands as inputs confirm</td>
                    <td className="p-3">Expose assumptions, label scenario sensitivity</td>
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
                <li>Postcode-level historical priors and property features inform baseline</li>
                <li>Listing text and finish cues adjust bands within defined guardrails</li>
                <li>Band widening under sparse comps; prompts for manual check</li>
              </ul>
            </div>
            <div className="card p-6">
              <h3 className="card-title">Refurb from photos</h3>
              <ul className="small text-slate-700 list-disc pl-5 mt-2 space-y-1">
                <li>Room classification → scope templates (paint, flooring, fixtures, electrics)</li>
                <li>Regional cost indices; confidence scores per room</li>
                <li>Contingency slider; lock once quotes arrive</li>
              </ul>
            </div>
            <div className="card p-6">
              <h3 className="card-title">Comps & EPC</h3>
              <ul className="small text-slate-700 list-disc pl-5 mt-2 space-y-1">
                <li>£/sq ft sanity checks and outlier detection</li>
                <li>Heuristic EPC match (postcode, house number, street tokens); strict thresholds</li>
              </ul>
            </div>
            <div className="card p-6">
              <h3 className="card-title">Financials & reporting</h3>
              <ul className="small text-slate-700 list-disc pl-5 mt-2 space-y-1">
                <li>Stamp duty, fees, opex, leverage; cash-flow and ROI</li>
                <li>Exports: lender-friendly PDF and fully-traceable Excel</li>
              </ul>
            </div>
          </section>
  
          {/* Improvement loop */}
          <section className="card p-6">
            <h3 className="card-title">Improvement loop</h3>
            <ul className="small text-slate-700 list-disc pl-5 mt-2 space-y-1">
              <li><strong>Feedback-at-source:</strong> User edits to rent/refurb bands become postcode priors</li>
              <li><strong>Backtests:</strong> Rolling evaluation on labelled deals; drift monitoring</li>
              <li><strong>Prompt/model updates:</strong> Weekly during beta; monthly once stable</li>
            </ul>
          </section>
  
          <div className="rounded-2xl bg-slate-50 border p-6 flex items-center justify-between">
            <div>
              <div className="font-semibold">Want a deep-dive on a specific area?</div>
              <div className="small text-slate-600">We’ll walk through methodology and share area-specific baselines.</div>
            </div>
            <a href="/book-demo" className="btn btn-primary">Book a demo</a>
          </div>
        </div>
      </div>
    );
  }
  