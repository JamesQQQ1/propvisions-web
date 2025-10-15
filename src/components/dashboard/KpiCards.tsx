import { Card, CardContent } from '@/components/ui/card';
import { msToHuman, percent } from '@/utils/format';
import type { OverviewTotals } from '@/types/dashboard';

interface KpiCardsProps {
  totals: OverviewTotals;
}

export default function KpiCards({ totals }: KpiCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Runs */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm text-slate-600 mb-1">Total Runs</div>
          <div className="text-3xl font-bold text-slate-900">
            {totals.total_runs.toLocaleString()}
          </div>
        </CardContent>
      </Card>

      {/* Success Rate */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm text-slate-600 mb-1">Success Rate</div>
          <div className="text-3xl font-bold text-green-600">
            {percent(totals.success_rate, 1)}
          </div>
        </CardContent>
      </Card>

      {/* P50 Duration */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm text-slate-600 mb-1">P50 Duration</div>
          <div className="text-3xl font-bold text-slate-900">
            {msToHuman(totals.p50_duration_sec)}
          </div>
        </CardContent>
      </Card>

      {/* P95 Duration */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm text-slate-600 mb-1">P95 Duration</div>
          <div className="text-3xl font-bold text-slate-900">
            {msToHuman(totals.p95_duration_sec)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
