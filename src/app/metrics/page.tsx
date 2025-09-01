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
            We track the accuracy of key outputs as pilot users complete deals. 
            Regional breakdowns and trend lines show where the system is already strong 
            and where we are improving.
          </p>
        </header>

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
                  <td className="p-3 font-medium">Rent estimate</td>
                  <td className="p-3">Accuracy vs achieved rents</td>
                  <td className="p-3">Impacts cash-flow and lender tests</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Refurbishment cost</td>
                  <td className="p-3">Accuracy vs contractor quotes</td>
                  <td className="p-3">Ensures realistic budgets and contingency</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">EPC match</td>
                  <td className="p-3">Correct record match rate</td>
                  <td className="p-3">Matters for compliance and value-add works</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Yield / ROI</td>
                  <td className="p-3">Error margin on outputs</td>
                  <td className="p-3">Shows overall investability and return</td>
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
            <div className="font-semibold">Want your region measured first?</div>
            <div className="small text-slate-600">
              Join the pilot; we’ll prioritise your patch and share baselines.
            </div>
          </div>
          <a href="/book-demo" className="btn btn-primary">Book a demo</a>
        </div>
      </div>
    </div>
  );
}
