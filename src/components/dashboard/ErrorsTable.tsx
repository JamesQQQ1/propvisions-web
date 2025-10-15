'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { formatDateTime, truncate } from '@/utils/format';
import type { PipelineErrorRow } from '@/types/dashboard';
import ErrorDrawer from './ErrorDrawer';

interface ErrorsTableProps {
  errors: PipelineErrorRow[];
  total?: number;
  onPageChange?: (offset: number) => void;
}

const LIMIT = 25;

export default function ErrorsTable({ errors, total = 0, onPageChange }: ErrorsTableProps) {
  const [selectedError, setSelectedError] = useState<PipelineErrorRow | null>(null);
  const [currentOffset, setCurrentOffset] = useState(0);

  const handleRowClick = (error: PipelineErrorRow) => {
    setSelectedError(error);
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

  if (errors.length === 0) {
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
              <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Created At</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Run ID</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Stage</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Error Code</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Message</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Node</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Link</th>
            </tr>
          </thead>
          <tbody>
            {errors.map((error, idx) => (
              <tr
                key={error.id}
                onClick={() => handleRowClick(error)}
                className={`border-b border-slate-100 hover:bg-slate-50 cursor-pointer ${
                  idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                }`}
              >
                <td className="px-4 py-3 text-sm text-slate-700">
                  {formatDateTime(error.created_at)}
                </td>
                <td className="px-4 py-3 text-sm">
                  {error.run_id ? (
                    <span title={error.run_id} className="font-mono text-slate-900">
                      {error.run_id.substring(0, 8)}
                    </span>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-slate-700">
                  {error.stage || '-'}
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className="font-medium text-red-700">
                    {error.error_code || 'Unknown'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-slate-700">
                  {truncate(error.message_short, 60)}
                </td>
                <td className="px-4 py-3 text-sm text-slate-700">
                  {error.node_name || '-'}
                </td>
                <td className="px-4 py-3 text-sm">
                  {error.error_url ? (
                    <a
                      href={error.error_url}
                      target="_blank"
                      rel="noopener"
                      className="text-blue-600 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View
                    </a>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 px-4">
        <div className="text-sm text-slate-600">
          Showing {currentOffset + 1} to {Math.min(currentOffset + LIMIT, total)} of {total} errors
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

      {/* Error Drawer */}
      {selectedError && (
        <ErrorDrawer
          error={selectedError}
          open={!!selectedError}
          onClose={() => setSelectedError(null)}
        />
      )}
    </>
  );
}
