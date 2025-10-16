'use client';

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Server, TrendingUp, TrendingDown } from 'lucide-react';
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { PipelineErrorRow } from '@/types/dashboard';

interface NodeFailureAnalysisProps {
  errors: PipelineErrorRow[];
}

interface NodeStats {
  node_name: string;
  error_count: number;
  error_codes: Set<string>;
  stages: Set<string>;
  recent_errors: number; // errors in last 24h
}

export default function NodeFailureAnalysis({ errors }: NodeFailureAnalysisProps) {
  const nodeStats = useMemo(() => {
    const stats = new Map<string, NodeStats>();
    const now = new Date().getTime();
    const day24h = 24 * 60 * 60 * 1000;

    errors.forEach(error => {
      if (!error.node_name) return;

      if (!stats.has(error.node_name)) {
        stats.set(error.node_name, {
          node_name: error.node_name,
          error_count: 0,
          error_codes: new Set(),
          stages: new Set(),
          recent_errors: 0,
        });
      }

      const stat = stats.get(error.node_name)!;
      stat.error_count += 1;
      if (error.error_code) stat.error_codes.add(error.error_code);
      if (error.stage) stat.stages.add(error.stage);

      if (error.created_at) {
        const errorTime = new Date(error.created_at).getTime();
        if (now - errorTime < day24h) {
          stat.recent_errors += 1;
        }
      }
    });

    return Array.from(stats.values())
      .sort((a, b) => b.error_count - a.error_count)
      .slice(0, 10);
  }, [errors]);

  const chartData = nodeStats.map(stat => ({
    node: stat.node_name.length > 20 ? stat.node_name.substring(0, 17) + '...' : stat.node_name,
    fullNode: stat.node_name,
    count: stat.error_count,
    recent: stat.recent_errors,
  }));

  const totalErrors = errors.length;
  const uniqueNodes = nodeStats.length;
  const criticalNodes = nodeStats.filter(n => n.error_count > 5).length;

  if (nodeStats.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-slate-600">
          <Server className="w-12 h-12 mx-auto mb-3 text-slate-400" />
          <p>No node failure data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-600 mb-1">Total Node Errors</div>
                <div className="text-3xl font-bold text-slate-900">{totalErrors}</div>
              </div>
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-600 mb-1">Affected Nodes</div>
                <div className="text-3xl font-bold text-slate-900">{uniqueNodes}</div>
              </div>
              <Server className="w-10 h-10 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-600 mb-1">Critical Nodes</div>
                <div className="text-3xl font-bold text-slate-900">{criticalNodes}</div>
                <div className="text-xs text-slate-500 mt-1">{'>'}5 errors</div>
              </div>
              <AlertTriangle className="w-10 h-10 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Server className="w-5 h-5 text-slate-600" />
            Top Failing Nodes
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 150, bottom: 10 }}
            >
              <defs>
                <linearGradient id="nodeErrorGradient" x1="0" y1="0" x2="1" y2="0">
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
                dataKey="node"
                tick={{ fill: '#1e293b', fontSize: 12, fontWeight: 500 }}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                width={140}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white px-4 py-3 rounded-lg shadow-xl border border-slate-200">
                      <p className="text-sm font-semibold text-slate-900 mb-2">{data.fullNode}</p>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500" />
                          <span className="text-slate-600">Total Errors:</span>
                          <span className="font-semibold text-slate-900">{data.count}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-orange-500" />
                          <span className="text-slate-600">Last 24h:</span>
                          <span className="font-semibold text-slate-900">{data.recent}</span>
                        </div>
                      </div>
                    </div>
                  );
                }}
                cursor={{ fill: 'rgba(239, 68, 68, 0.1)' }}
              />
              <Bar
                dataKey="count"
                fill="url(#nodeErrorGradient)"
                radius={[0, 6, 6, 0]}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.recent > entry.count * 0.5 ? '#ef4444' : 'url(#nodeErrorGradient)'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Node Details List */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Node Failure Details</h3>
          <div className="space-y-3">
            {nodeStats.map((node, idx) => {
              const isRecent = node.recent_errors > node.error_count * 0.5;
              return (
                <div
                  key={node.node_name}
                  className="flex items-start justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:shadow-md transition-all"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="outline" className="font-mono text-xs">
                        #{idx + 1}
                      </Badge>
                      <span className="font-semibold text-slate-900 font-mono text-sm">
                        {node.node_name}
                      </span>
                      {isRecent && (
                        <Badge className="bg-red-100 text-red-800 border-0 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          Active
                        </Badge>
                      )}
                      {node.error_count > 10 && (
                        <Badge className="bg-orange-100 text-orange-800 border-0">
                          Critical
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-2">
                      <div>
                        <span className="text-slate-600">Total Errors:</span>{' '}
                        <span className="font-semibold text-red-600">{node.error_count}</span>
                      </div>
                      <div>
                        <span className="text-slate-600">Last 24h:</span>{' '}
                        <span className="font-semibold text-orange-600">{node.recent_errors}</span>
                      </div>
                      <div>
                        <span className="text-slate-600">Error Types:</span>{' '}
                        <span className="font-semibold text-slate-900">{node.error_codes.size}</span>
                      </div>
                      <div>
                        <span className="text-slate-600">Stages:</span>{' '}
                        <span className="font-semibold text-slate-900">{node.stages.size}</span>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {Array.from(node.stages).slice(0, 3).map(stage => (
                        <Badge key={stage} variant="secondary" className="text-xs">
                          {stage}
                        </Badge>
                      ))}
                      {node.stages.size > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{node.stages.size - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-4">
                    {isRecent ? (
                      <TrendingUp className="w-6 h-6 text-red-500" />
                    ) : (
                      <TrendingDown className="w-6 h-6 text-green-500" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
