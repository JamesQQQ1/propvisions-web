import { Card, CardContent } from '@/components/ui/card';
import { msToHuman, percent } from '@/utils/format';
import type { OverviewTotals } from '@/types/dashboard';

interface KpiCardsProps {
  totals: OverviewTotals;
}

export default function KpiCards({ totals }: KpiCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
      {/* Total Runs */}
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="pt-6">
          <div className="text-sm text-slate-600 mb-1 font-medium">Total Runs</div>
          <div className="text-3xl font-bold text-slate-900">
            {totals.total_runs.toLocaleString()}
          </div>
        </CardContent>
      </Card>

      {/* Success Rate */}
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="pt-6">
          <div className="text-sm text-slate-600 mb-1 font-medium">Success Rate</div>
          <div className="text-3xl font-bold text-green-600">
            {percent(totals.success_rate, 1)}
          </div>
        </CardContent>
      </Card>

      {/* P50 Duration */}
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="pt-6">
          <div className="text-sm text-slate-600 mb-1 font-medium">P50 Duration</div>
          <div className="text-3xl font-bold text-blue-600">
            {msToHuman(totals.p50_duration_sec)}
          </div>
        </CardContent>
      </Card>

      {/* P95 Duration */}
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="pt-6">
          <div className="text-sm text-slate-600 mb-1 font-medium">P95 Duration</div>
          <div className="text-3xl font-bold text-amber-600">
            {msToHuman(totals.p95_duration_sec)}
          </div>
        </CardContent>
      </Card>

      {/* Handoff Latency */}
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="pt-6">
          <div className="text-sm text-slate-600 mb-1 font-medium">Avg Handoff</div>
          <div className="text-3xl font-bold text-purple-600">
            {totals.avg_handoff_latency_sec !== null
              ? msToHuman(totals.avg_handoff_latency_sec)
              : '-'}
          </div>
        </CardContent>
      </Card>

      {/* Top Stage by Time */}
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="pt-6">
          <div className="text-sm text-slate-600 mb-1 font-medium">Top Stage</div>
          <div className="text-2xl font-bold text-slate-900 truncate">
            {totals.top_stage_by_time || '-'}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
