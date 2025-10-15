'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { formatDateTime } from '@/utils/format';
import type { PipelineErrorRow } from '@/types/dashboard';

interface ErrorDrawerProps {
  error: PipelineErrorRow;
  open: boolean;
  onClose: () => void;
}

export default function ErrorDrawer({ error, open, onClose }: ErrorDrawerProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Error Details</DialogTitle>
          <div className="text-sm text-slate-600">ID: {error.id}</div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Basic Info */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Basic Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex">
                <span className="text-slate-600 w-32">Created At:</span>
                <span className="text-slate-900">{formatDateTime(error.created_at)}</span>
              </div>
              {error.run_id && (
                <div className="flex">
                  <span className="text-slate-600 w-32">Run ID:</span>
                  <span className="font-mono text-slate-900">{error.run_id}</span>
                </div>
              )}
              {error.property_id && (
                <div className="flex">
                  <span className="text-slate-600 w-32">Property ID:</span>
                  <span className="font-mono text-slate-900">{error.property_id}</span>
                </div>
              )}
              {error.stage && (
                <div className="flex">
                  <span className="text-slate-600 w-32">Stage:</span>
                  <span className="text-slate-900">{error.stage}</span>
                </div>
              )}
              {error.error_code && (
                <div className="flex">
                  <span className="text-slate-600 w-32">Error Code:</span>
                  <span className="font-medium text-red-700">{error.error_code}</span>
                </div>
              )}
              {error.node_name && (
                <div className="flex">
                  <span className="text-slate-600 w-32">Node:</span>
                  <span className="text-slate-900">{error.node_name}</span>
                </div>
              )}
              {error.execution_id && (
                <div className="flex">
                  <span className="text-slate-600 w-32">Execution ID:</span>
                  <span className="font-mono text-slate-900">{error.execution_id}</span>
                </div>
              )}
              {error.prop_no && (
                <div className="flex">
                  <span className="text-slate-600 w-32">Prop No:</span>
                  <span className="text-slate-900">{error.prop_no}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Error Message */}
          {error.message_short && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Error Message</h3>
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-slate-900 whitespace-pre-wrap">
                  {error.message_short}
                </p>
              </div>
            </div>
          )}

          {/* Context JSON */}
          {error.context_json && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Context</h3>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-md overflow-x-auto">
                <pre className="text-xs text-slate-900">
                  {JSON.stringify(error.context_json, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Error URL */}
          {error.error_url && (
            <div>
              <h3 className="text-sm font-semibold mb-2">External Link</h3>
              <a
                href={error.error_url}
                target="_blank"
                rel="noopener"
                className="text-blue-600 hover:underline text-sm break-all"
              >
                {error.error_url}
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
