'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDateTime, msToHuman, domainFromUrl } from '@/utils/format';
import { normalizeStatus } from '@/types/dashboard';
import type { IngestJobWithHandoff } from '@/types/dashboard';

interface IngestTableProps {
  jobs: IngestJobWithHandoff[];
  total?: number;
  onPageChange?: (offset: number) => void;
}

const LIMIT = 25;

export default function IngestTable({ jobs, total = 0, onPageChange }: IngestTableProps) {
  const [currentOffset, setCurrentOffset] = useState(0);

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

  if (jobs.length === 0) {
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
              <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">ID</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Run ID</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Property ID</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">URL</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Status</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Attempts</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Created At</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Claimed At</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Finished At</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Batch Label</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Handoff Latency</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job, idx) => (
              <tr
                key={job.id}
                className={`border-b border-slate-100 ${
                  idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                }`}
              >
                <td className="px-4 py-3 text-sm">
                  <span title={job.id} className="font-mono text-slate-900">
                    {job.id.substring(0, 8)}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  {job.run_id ? (
                    <span title={job.run_id} className="font-mono text-slate-700">
                      {job.run_id.substring(0, 8)}
                    </span>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm">
                  {job.property_id ? (
                    <span title={job.property_id} className="font-mono text-slate-700">
                      {job.property_id.substring(0, 8)}
                    </span>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm">
                  {job.url ? (
                    <span className="text-blue-600" title={job.url}>
                      {domainFromUrl(job.url)}
                    </span>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm">
                  <Badge variant={getStatusBadgeVariant(job.status)}>
                    {job.status || 'unknown'}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-sm text-slate-700">
                  {job.attempts ?? '-'}
                </td>
                <td className="px-4 py-3 text-sm text-slate-700">
                  {formatDateTime(job.created_at)}
                </td>
                <td className="px-4 py-3 text-sm text-slate-700">
                  {formatDateTime(job.claimed_at)}
                </td>
                <td className="px-4 py-3 text-sm text-slate-700">
                  {formatDateTime(job.finished_at)}
                </td>
                <td className="px-4 py-3 text-sm text-slate-700">
                  {job.batch_label || '-'}
                </td>
                <td className="px-4 py-3 text-sm text-slate-700">
                  {msToHuman(job.handoff_latency_sec)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 px-4">
        <div className="text-sm text-slate-600">
          Showing {currentOffset + 1} to {Math.min(currentOffset + LIMIT, total)} of {total} jobs
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
    </>
  );
}
