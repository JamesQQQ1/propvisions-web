// src/app/metrics/page.tsx
import MetricsDashboard from "@/components/MetricsDashboard";
import Credibility from "@/components/Credibility";
import Testimonials from "@/components/Testimonials";

export default function MetricsPage() {
  return (
    <div className="section">
      <div className="container space-y-10">
        <header>
          <h1 className="heading-2">Metrics & Progress</h1>
          <p className="small mt-1 text-slate-600">
            Decision-focused metrics updated as pilot cohorts complete. Region-level breakouts and trend lines help you judge reliability.
          </p>
        </header>

        {/* If you have a live dashboard, this embeds it; otherwise you can keep the cards static. */}
        <MetricsDashboard />

        <section className="card p-6">
          <h3 className="card-title">What we measure</h3>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm border rounded-xl overflow-hidden">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <th className="p-3 text-left">Output</th>
                  <th className="p-3 text-left">Metric</th>
                  <th className="p-3 text-left">Why it matters</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="p-3 font-medium">Rent band</td>
                  <td className="p-3">MAPE vs achieved rent; band hit-rate</td>
                  <td className="p-3">Cash-flow sensitivity and lender DSCR/ICR thresholds</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Refurb total</td>
                  <td className="p-3">MAPE vs quotes/invoices</td>
                  <td className="p-3">Capex realism and contingency planning</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">EPC match</td>
                  <td className="p-3">Correct match rate</td>
                  <td className="p-3">Compliance impacts and value-add measures</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Yield/ROI</td>
                  <td className="p-3">Propagated error</td>
                  <td className="p-3">Overall investability and risk/return trade-off</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <Credibility />

        <section>
          <h2 className="heading-2">What users say</h2>
          <Testimonials />
        </section>

        <div className="rounded-2xl bg-slate-50 border p-6 flex items-center justify-between">
          <div>
            <div className="font-semibold">Want the region you care about measured first?</div>
            <div className="small text-slate-600">Join the pilot; we’ll prioritise your patch and share baselines.</div>
          </div>
          <a href="/book-demo" className="btn btn-primary">Book a demo</a>
        </div>
      </div>
    </div>
  );
}
