import { msToHuman, percent } from '@/utils/format';
import type { StageStats } from '@/types/dashboard';

interface StagesTableProps {
  stats: StageStats[];
}

export default function StagesTable({ stats }: StagesTableProps) {
  if (stats.length === 0) {
    return <div className="text-center py-8 text-slate-600">No data found</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Stage</th>
            <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Avg Duration</th>
            <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">P95 Duration</th>
            <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Success Rate</th>
            <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Total Count</th>
          </tr>
        </thead>
        <tbody>
          {stats.map((stat, idx) => (
            <tr
              key={stat.stage}
              className={`border-b border-slate-100 ${
                idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
              }`}
            >
              <td className="px-4 py-3 text-sm font-medium text-slate-900">
                {stat.stage}
              </td>
              <td className="px-4 py-3 text-sm text-slate-700">
                {msToHuman(stat.avg_duration_sec)}
              </td>
              <td className="px-4 py-3 text-sm text-slate-700">
                {msToHuman(stat.p95_duration_sec)}
              </td>
              <td className="px-4 py-3 text-sm">
                <span
                  className={
                    stat.success_rate >= 95
                      ? 'text-green-600 font-medium'
                      : stat.success_rate >= 80
                      ? 'text-yellow-600'
                      : 'text-red-600'
                  }
                >
                  {percent(stat.success_rate)}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-slate-700">
                {stat.total_count.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
