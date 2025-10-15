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
} from 'recharts';
import { msToHuman } from '@/utils/format';
import type { TimeseriesPoint, StageDuration, ErrorFamily } from '@/types/dashboard';

// Runs Sparkline (simple line chart)
interface RunsSparklineProps {
  data: TimeseriesPoint[];
}

export function RunsSparkline({ data }: RunsSparklineProps) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="runs" stroke="#3b82f6" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// Success Stacked Bar Chart
interface SuccessStackedBarProps {
  data: TimeseriesPoint[];
}

export function SuccessStackedBar({ data }: SuccessStackedBarProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="success" stackId="a" fill="#10b981" name="Success" />
        <Bar dataKey="failed" stackId="a" fill="#ef4444" name="Failed" />
      </BarChart>
    </ResponsiveContainer>
  );
}

// Stage Duration Bar Chart
interface StageDurationBarProps {
  data: StageDuration[];
}

export function StageDurationBar({ data }: StageDurationBarProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="stage" />
        <YAxis tickFormatter={(value) => msToHuman(value)} />
        <Tooltip
          formatter={(value: number) => msToHuman(value)}
          labelFormatter={(label) => `Stage: ${label}`}
        />
        <Bar dataKey="avg_duration_sec" fill="#3b82f6" name="Avg Duration" />
      </BarChart>
    </ResponsiveContainer>
  );
}

// Error Distribution Bar Chart (top 10)
interface ErrorDistributionBarProps {
  data: ErrorFamily[];
}

export function ErrorDistributionBar({ data }: ErrorDistributionBarProps) {
  const top10 = data.slice(0, 10);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={top10}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="error_code" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="count" fill="#ef4444" name="Count" />
      </BarChart>
    </ResponsiveContainer>
  );
}
