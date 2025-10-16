'use client';

import useSWR from 'swr';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatDateTime, msToHuman, getStageColor, getStatusColor } from '@/utils/format';
import { normalizeStatus } from '@/types/dashboard';
import type { PipelineStageRunRow, PipelineErrorRow } from '@/types/dashboard';

interface RunDrawerProps {
  run_id: string;
  open: boolean;
  onClose: () => void;
}

interface StagesResponse {
  rows: PipelineStageRunRow[];
  run?: {
    run_id: string;
    property_id: string | null;
    url: string | null;
    property_pdf: string | null;
  };
}

interface ErrorsResponse {
  errors: PipelineErrorRow[];
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function RunDrawer({ run_id, open, onClose }: RunDrawerProps) {
  const { data: stagesData, error: stagesError } = useSWR<StagesResponse>(
    open ? `/api/dashboard/stages?run_id=${run_id}` : null,
    fetcher
  );

  const { data: errorsData, error: errorsError } = useSWR<ErrorsResponse>(
    open ? `/api/dashboard/errors?run_id=${run_id}` : null,
    fetcher
  );

  const isLoading = !stagesData && !stagesError;
  const hasError = stagesError || errorsError;

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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Run Details</DialogTitle>
          <div className="text-sm text-slate-600 font-mono">{run_id}</div>
        </DialogHeader>

        {isLoading && (
          <div className="py-8 text-center text-slate-600">Loading...</div>
        )}

        {hasError && (
          <div className="py-4 text-red-600 text-sm">
            Error loading run details. Please try again.
          </div>
        )}

        {stagesData && (
          <>
            {/* Run Info */}
            {stagesData.run && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold mb-2">Run Information</h3>
                <div className="space-y-1 text-sm">
                  {stagesData.run.property_id && (
                    <div>
                      <span className="text-slate-600">Property ID:</span>{' '}
                      <span className="font-mono">{stagesData.run.property_id}</span>
                    </div>
                  )}
                  {stagesData.run.url && (
                    <div>
                      <span className="text-slate-600">Source URL:</span>{' '}
                      <a
                        href={stagesData.run.url}
                        target="_blank"
                        rel="noopener"
                        className="text-blue-600 hover:underline"
                      >
                        {stagesData.run.url}
                      </a>
                    </div>
                  )}
                  {stagesData.run.property_pdf && (
                    <div>
                      <span className="text-slate-600">Property PDF:</span>{' '}
                      <a
                        href={stagesData.run.property_pdf}
                        target="_blank"
                        rel="noopener"
                        className="text-blue-600 hover:underline"
                      >
                        View PDF
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            <Separator />

            {/* Stage Timeline */}
            <div className="mt-4">
              <h3 className="text-sm font-semibold mb-3">Stage Timeline</h3>
              {stagesData.rows && stagesData.rows.length > 0 ? (
                <div className="space-y-3">
                  {stagesData.rows.map((stage, idx) => {
                    const stageColors = getStageColor(stage.stage);
                    const statusColors = getStatusColor(stage.status);
                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-3 bg-slate-50 rounded-md border-l-4"
                        style={{ borderLeftColor: stageColors.chart }}
                      >
                        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                             style={{ backgroundColor: stageColors.chart, color: 'white' }}>
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={`${stageColors.bg} ${stageColors.text} border-0`}>
                              {stage.stage || 'Unknown'}
                            </Badge>
                            <Badge className={`${statusColors.bg} ${statusColors.text} border-0`}>
                              {stage.status || 'unknown'}
                            </Badge>
                          </div>
                          <div className="text-xs text-slate-600">
                            Started: {formatDateTime(stage.started_at)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-slate-900">
                            {msToHuman(stage.duration_sec)}
                          </div>
                          <div className="text-xs text-slate-600">duration</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-slate-600">No stage data available</div>
              )}
            </div>

            <Separator className="my-4" />

            {/* Errors */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Errors</h3>
              {errorsData && errorsData.errors && errorsData.errors.length > 0 ? (
                <div className="space-y-2">
                  {errorsData.errors.map((error) => (
                    <div
                      key={error.id}
                      className="p-3 bg-red-50 border border-red-200 rounded-md"
                    >
                      <div className="flex items-start justify-between mb-1">
                        <div className="font-medium text-sm text-red-800">
                          {error.error_code || 'Unknown Error'}
                        </div>
                        <div className="text-xs text-slate-600">
                          {formatDateTime(error.created_at)}
                        </div>
                      </div>
                      {error.stage && (
                        <div className="text-xs text-slate-600 mb-1">
                          Stage: {error.stage}
                        </div>
                      )}
                      {error.message_short && (
                        <div className="text-sm text-slate-700">
                          {error.message_short}
                        </div>
                      )}
                      {error.node_name && (
                        <div className="text-xs text-slate-600 mt-1">
                          Node: {error.node_name}
                        </div>
                      )}
                      {error.error_url && (
                        <div className="mt-2">
                          <a
                            href={error.error_url}
                            target="_blank"
                            rel="noopener"
                            className="text-xs text-blue-600 hover:underline"
                          >
                            View error details
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-slate-600">No errors recorded</div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
