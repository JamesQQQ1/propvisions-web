// src/app/roadmap/page.tsx
"use client";

export default function RoadmapPage() {
  return (
    <div className="section">
      <div className="container grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-8">
          <header>
            <h1 className="heading-2">PropVisions Roadmap</h1>
            <p className="small text-slate-600 mt-2">
              Planned features and improvements. Enterprise customers get priority access.
            </p>
          </header>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Upcoming features</h2>

            <RoadmapItem
              title="Mortgage trigger with forward rates"
              description="Scenario planning with forward interest rate curves, product fees, and lender stress tests."
            />

            <RoadmapItem
              title="Multiple scenario modes"
              description="BTL, HMO, Airbnb, Social Housing—each with tailored assumptions and regulatory considerations."
            />

            <RoadmapItem
              title="Live builder pricing"
              description="Verified local builder connections for real-time quote validation and booking."
            />

            <RoadmapItem
              title="Valuation module"
              description="Recent sales data combined with local indices for more accurate post-refurb valuations."
            />

            <RoadmapItem
              title="Off-market sourcing"
              description="Probate, distressed sales, and stale listings—identified and tracked automatically."
            />

            <RoadmapItem
              title="Portfolio dashboards"
              description="Investment view and Management view for tracking multiple properties and performance metrics."
            />

            <RoadmapItem
              title="Listing text intelligence"
              description="Extracts signals like 'needs modernisation', 'no heating', 'chain-free' to adjust estimates."
            />

            <RoadmapItem
              title="Confidence scoring"
              description="Low–mid–high bands for all estimates, based on data quality and local coverage."
            />

            <RoadmapItem
              title="Feedback learning"
              description="Your edits and corrections fine-tune models for your postcodes and deal types."
            />

            <RoadmapItem
              title="Nano Banana image API"
              description="Generate post-refurb visual renders to show clients the potential."
            />

            <RoadmapItem
              title="Smart agent automation"
              description="Auto-email or voice outreach for missing data, viewings, and follow-ups."
            />

            <RoadmapItem
              title="Chatbot automation"
              description="Chat commands trigger recalculations and live updates—interact naturally with your data."
            />
          </section>

          <section className="mt-10 card p-6">
            <h3 className="card-title">Current limitations</h3>
            <div className="mt-4 space-y-4 text-sm text-slate-700">
              <div>
                <div className="font-medium">Portal coverage</div>
                <p className="mt-1">
                  PropVisions works with major UK portals (best coverage with Rightmove), Zoopla, and OnTheMarket.
                  Coverage varies by source. Unified search and portal integrations are on the roadmap.
                </p>
              </div>
              <div>
                <div className="font-medium">Estimate ranges & confidence</div>
                <p className="mt-1">
                  Confidence depends on listing quality and local data availability. Wider ranges prompt manual review.
                  Your edits improve local baselines over time.
                </p>
              </div>
              <div>
                <div className="font-medium">Run timing</div>
                <p className="mt-1 italic">
                  Most runs complete in under 5 minutes—actual time depends on image count and data sources.
                </p>
              </div>
            </div>
          </section>
        </div>

        <aside className="lg:col-span-4 space-y-6">
          <div className="card p-6">
            <h3 className="card-title">What PropVisions delivers today</h3>
            <ul className="small text-slate-700 space-y-2 list-disc pl-5 mt-3">
              <li>Batch upload (up to 100 properties at once)</li>
              <li>Instant deal analysis from URL or photo upload</li>
              <li>Room-by-room refurb pricing with regional builder rates</li>
              <li>EPC matching and upgrade suggestions</li>
              <li>Rent estimation with confidence bands</li>
              <li>Post-refurb valuation estimates</li>
              <li>Full financials (SDLT, fees, voids, management, ROI)</li>
              <li>Export-ready investor and builder PDFs</li>
              <li>Alerts for listing changes and matches</li>
            </ul>
          </div>

          <div className="rounded-2xl bg-slate-50 border p-6">
            <div className="font-semibold">Influence the roadmap</div>
            <div className="small text-slate-600 mt-1">
              Enterprise customers get priority access to new features and can request custom builds.
            </div>
            <a className="btn btn-primary mt-4 inline-block" href="/book-demo">Get a ranked shortlist</a>
          </div>
        </aside>
      </div>
    </div>
  );
}

function RoadmapItem({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border p-4">
      <div className="flex items-start gap-3">
        <div className="mt-1 w-2 h-2 rounded-full bg-slate-400 flex-shrink-0" />
        <div>
          <div className="font-medium text-slate-900">{title}</div>
          <p className="small text-slate-600 mt-1">{description}</p>
        </div>
      </div>
    </div>
  );
}
