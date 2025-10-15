'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDateTime, msToHuman, domainFromUrl, truncate } from '@/utils/format';
import { normalizeStatus } from '@/types/dashboard';
import type { PipelineRunRow } from '@/types/dashboard';
import RunDrawer from './RunDrawer';

interface RunsTableProps {
  runs: PipelineRunRow[];
  total?: number;
  onPageChange?: (offset: number) => void;
}

const LIMIT = 25;

export default function RunsTable({ runs, total = 0, onPageChange }: RunsTableProps) {
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [currentOffset, setCurrentOffset] = useState(0);

  const handleRowClick = (runId: string) => {
    setSelectedRunId(runId);
  };

  const handleNextPage = () => {
    const newOffset = currentOffset + LIMIT;
    setCurrentOffset(newOffset);
    onPageChange?.(newOffset);
  };

  const handlePrevPage = () => {
    const newOffset = Math.max(0, currentOffset - LIMIT);
    setCurrentOffset(newOffset);
    onPageChange?.(newOffset);
  };

  const getStatusBadgeVariant = (status: string | null) => {
    const normalized = normalizeStatus(status);
    switch (normalized) {
      case 'success':
        return 'success';
      case 'failed':
        return 'destructive';
      case 'processing':
        return 'warning';
      case 'queued':
        return 'secondary';
      default:
        return 'default';
    }
  };

  if (runs.length === 0) {
    return <div className="text-center py-8 text-slate-600">No data found</div>;
  }

  const currentPage = Math.floor(currentOffset / LIMIT) + 1;
  const totalPages = Math.ceil(total / LIMIT);

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Run ID</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Property ID</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">URL</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Status</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Duration</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Started At</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Batch Label</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Prop No</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((run, idx) => (
              <tr
                key={run.run_id}
                onClick={() => handleRowClick(run.run_id)}
                className={`border-b border-slate-100 hover:bg-slate-50 cursor-pointer ${
                  idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                }`}
              >
                <td className="px-4 py-3 text-sm">
                  <span title={run.run_id} className="font-mono text-slate-900">
                    {run.run_id.substring(0, 8)}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  {run.property_id ? (
                    <span title={run.property_id} className="font-mono text-slate-700">
                      {run.property_id.substring(0, 8)}
                    </span>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm">
                  {run.url ? (
                    <span className="text-blue-600" title={run.url}>
                      {domainFromUrl(run.url)}
                    </span>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm">
                  <Badge variant={getStatusBadgeVariant(run.status)}>
                    {run.status || 'unknown'}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-sm text-slate-700">
                  {msToHuman(run.duration_sec)}
                </td>
                <td className="px-4 py-3 text-sm text-slate-700">
                  {formatDateTime(run.started_at)}
                </td>
                <td className="px-4 py-3 text-sm text-slate-700">
                  {run.batch_label || '-'}
                </td>
                <td className="px-4 py-3 text-sm text-slate-700">
                  {run.prop_no || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 px-4">
        <div className="text-sm text-slate-600">
          Showing {currentOffset + 1} to {Math.min(currentOffset + LIMIT, total)} of {total} runs
          {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handlePrevPage}
            disabled={currentOffset === 0}
            variant="outline"
            size="sm"
          >
            Previous
          </Button>
          <Button
            onClick={handleNextPage}
            disabled={currentOffset + LIMIT >= total}
            variant="outline"
            size="sm"
          >
            Next
          </Button>
        </div>
      </div>

      {/* Run Drawer */}
      {selectedRunId && (
        <RunDrawer
          run_id={selectedRunId}
          open={!!selectedRunId}
          onClose={() => setSelectedRunId(null)}
        />
      )}
    </>
  );
}
