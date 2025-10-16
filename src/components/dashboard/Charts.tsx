'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { msToHuman, getStageColor } from '@/utils/format';
import type { TimeseriesPoint, StageDuration, ErrorFamily } from '@/types/dashboard';

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label, formatter }: any) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-white px-4 py-3 rounded-lg shadow-xl border border-slate-200">
      <p className="text-sm font-semibold text-slate-900 mb-2">{label}</p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-slate-600">{entry.name}:</span>
          <span className="font-semibold text-slate-900">
            {formatter ? formatter(entry.value) : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

// Runs Sparkline (premium line chart)
interface RunsSparklineProps {
  data: TimeseriesPoint[];
}

export function RunsSparkline({ data }: RunsSparklineProps) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorRuns" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: '#64748b', fontSize: 12 }}
          tickLine={{ stroke: '#e2e8f0' }}
          axisLine={{ stroke: '#e2e8f0' }}
        />
        <YAxis
          tick={{ fill: '#64748b', fontSize: 12 }}
          tickLine={{ stroke: '#e2e8f0' }}
          axisLine={{ stroke: '#e2e8f0' }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="runs"
          stroke="#3b82f6"
          strokeWidth={3}
          dot={{ fill: '#3b82f6', r: 4, strokeWidth: 2, stroke: '#fff' }}
          activeDot={{ r: 6, strokeWidth: 2 }}
          fill="url(#colorRuns)"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// Success Stacked Bar Chart (premium)
interface SuccessStackedBarProps {
  data: TimeseriesPoint[];
}

export function SuccessStackedBar({ data }: SuccessStackedBarProps) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.9}/>
            <stop offset="95%" stopColor="#10b981" stopOpacity={0.7}/>
          </linearGradient>
          <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.9}/>
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0.7}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: '#64748b', fontSize: 12 }}
          tickLine={{ stroke: '#e2e8f0' }}
          axisLine={{ stroke: '#e2e8f0' }}
        />
        <YAxis
          tick={{ fill: '#64748b', fontSize: 12 }}
          tickLine={{ stroke: '#e2e8f0' }}
          axisLine={{ stroke: '#e2e8f0' }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ paddingTop: '20px' }}
          iconType="circle"
        />
        <Bar
          dataKey="success"
          stackId="a"
          fill="url(#colorSuccess)"
          name="Success"
          radius={[0, 0, 4, 4]}
        />
        <Bar
          dataKey="failed"
          stackId="a"
          fill="url(#colorFailed)"
          name="Failed"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

// Stage Duration Bar Chart (premium with colors and click)
interface StageDurationBarProps {
  data: StageDuration[];
  onStageClick?: (stage: string) => void;
}

export function StageDurationBar({ data, onStageClick }: StageDurationBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const sortedData = [...data].sort((a, b) => b.avg_duration_sec - a.avg_duration_sec);

  const handleClick = (stage: string) => {
    if (onStageClick) {
      onStageClick(stage);
    } else {
      const params = new URLSearchParams(searchParams.toString());
      params.set('stage', stage);
      router.push(`?${params.toString()}`);
    }
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={sortedData}
        layout="vertical"
        margin={{ top: 10, right: 30, left: 100, bottom: 10 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fill: '#64748b', fontSize: 12 }}
          tickLine={{ stroke: '#e2e8f0' }}
          axisLine={{ stroke: '#e2e8f0' }}
          tickFormatter={(value) => msToHuman(value)}
        />
        <YAxis
          type="category"
          dataKey="stage"
          tick={{ fill: '#1e293b', fontSize: 13, fontWeight: 600 }}
          tickLine={false}
          axisLine={{ stroke: '#e2e8f0' }}
        />
        <Tooltip
          content={<CustomTooltip formatter={(v: number) => msToHuman(v)} />}
          cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
        />
        <Bar
          dataKey="avg_duration_sec"
          radius={[0, 6, 6, 0]}
          cursor="pointer"
          onClick={(data) => handleClick(data.stage)}
        >
          {sortedData.map((entry, index) => {
            const colors = getStageColor(entry.stage);
            return <Cell key={`cell-${index}`} fill={colors.chart} />;
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// Error Distribution Bar Chart (premium with click to filter)
interface ErrorDistributionBarProps {
  data: ErrorFamily[];
  onErrorClick?: (errorCode: string) => void;
}

export function ErrorDistributionBar({ data, onErrorClick }: ErrorDistributionBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const top10 = data.slice(0, 10);

  const handleClick = (errorCode: string) => {
    if (onErrorClick) {
      onErrorClick(errorCode);
    } else {
      const params = new URLSearchParams(searchParams.toString());
      params.set('error_code', errorCode);
      router.push(`?${params.toString()}`);
    }
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={top10}
        layout="vertical"
        margin={{ top: 10, right: 30, left: 120, bottom: 10 }}
      >
        <defs>
          <linearGradient id="colorError" x1="0" y1="0" x2="1" y2="0">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.9}/>
            <stop offset="95%" stopColor="#f87171" stopOpacity={0.7}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fill: '#64748b', fontSize: 12 }}
          tickLine={{ stroke: '#e2e8f0' }}
          axisLine={{ stroke: '#e2e8f0' }}
        />
        <YAxis
          type="category"
          dataKey="error_code"
          tick={{ fill: '#1e293b', fontSize: 12, fontWeight: 500 }}
          tickLine={false}
          axisLine={{ stroke: '#e2e8f0' }}
          width={110}
        />
        <Tooltip
          content={<CustomTooltip />}
          cursor={{ fill: 'rgba(239, 68, 68, 0.1)' }}
        />
        <Bar
          dataKey="count"
          fill="url(#colorError)"
          radius={[0, 6, 6, 0]}
          cursor="pointer"
          onClick={(data) => handleClick(data.error_code)}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
