// components/MissingRoomRequestsCard.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { subscribeMissingRoomRequests } from '@/lib/realtime/subscribe';
import { mergeRowUpsert, mergeRowDelete } from '@/lib/realtime/merge';

export interface PendingUpload {
  id: string;
  property_id: string;
  room_key?: string | null;
  room_type?: string | null;
  room_label?: string | null;
  floor?: string | null;
  status?: string | null;
  upload_url?: string | null;
  token_expires_at?: string | null;
  summary?: any;
  route?: string | null;
  room_index?: number | null;
  fingerprint_key?: string | null;
}

function isTokenExpired(tokenExpiresAt: string | null): boolean {
  if (!tokenExpiresAt) return true;
  try {
    return new Date(tokenExpiresAt) <= new Date();
  } catch {
    return true;
  }
}

export interface MissingRoomRequestsCardProps {
  propertyId: string;
}

export default function MissingRoomRequestsCard({ propertyId }: MissingRoomRequestsCardProps) {
  const [requests, setRequests] = useState<PendingUpload[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const handleUpsert = useCallback((row: PendingUpload) => {
    // Only keep pending items
    if (row.status === 'received' || row.status === 'cancelled') {
      setRequests((prev) => mergeRowDelete(prev, row.id));
    } else {
      setRequests((prev) => mergeRowUpsert(prev, row));
    }
  }, []);

  const handleDelete = useCallback((row: { id: string }) => {
    setRequests((prev) => mergeRowDelete(prev, row.id));
  }, []);

  useEffect(() => {
    async function fetchRequests() {
      try {
        const response = await fetch(`/api/missing-rooms?property_id=${encodeURIComponent(propertyId)}&status=pending`);
        if (response.ok) {
          const data = await response.json();
          setRequests(data.items || []);
        }
      } catch (error) {
        console.error('[MissingRoomRequestsCard] Error:', error);
      } finally {
        setIsLoading(false);
      }
    }

    if (propertyId) {
      fetchRequests();
    }
  }, [propertyId]);

  useEffect(() => {
    if (!propertyId) return;
    const unsub = subscribeMissingRoomRequests(propertyId, handleUpsert, handleDelete);
    return unsub;
  }, [propertyId, handleUpsert, handleDelete]);

  if (isLoading || requests.length === 0) {
    return null;
  }

  // Calculate coverage from summary if available
  const coverageSummary = requests.find(r => r.summary)?.summary;
  const coverageText = coverageSummary ?
    `Coverage: ${coverageSummary.coverage_pct || 0}% · Missing ${coverageSummary.missing || 0} / ${coverageSummary.expected || 0}` :
    null;

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl p-4 shadow-md">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-amber-900">Missing Photos</h3>
          {coverageText && <p className="text-xs text-amber-700">{coverageText}</p>}
        </div>
      </div>

      <div className="space-y-2">
        {requests.map((req) => {
          const expired = isTokenExpired(req.token_expires_at);
          const hasUrl = !!req.upload_url;
          const displayLabel = req.room_label || req.room_type || 'Unknown room';
          const floorText = req.floor ? ` (${req.floor})` : '';

          return (
            <div key={req.id} className="flex items-center gap-2 bg-white rounded-lg p-2 border border-amber-200">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-900 truncate">
                  {displayLabel}{floorText}
                </div>
                {hasUrl && !expired && (
                  <div className="text-xs text-slate-500 truncate">
                    Open link: {req.upload_url}
                  </div>
                )}
              </div>
              {hasUrl && !expired ? (
                <a
                  href={req.upload_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-amber-500 text-white text-sm font-medium rounded-md hover:bg-amber-600 transition-colors whitespace-nowrap"
                >
                  Upload photo
                </a>
              ) : (
                <button
                  disabled
                  className="px-3 py-1.5 bg-slate-300 text-slate-500 text-sm font-medium rounded-md cursor-not-allowed whitespace-nowrap"
                >
                  {expired ? 'Link expired' : 'No link'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Export hook for other components to use the same data
export function useMissingRoomRequests(propertyId: string) {
  const [requests, setRequests] = useState<PendingUpload[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const handleUpsert = useCallback((row: PendingUpload) => {
    if (row.status === 'received' || row.status === 'cancelled') {
      setRequests((prev) => mergeRowDelete(prev, row.id));
    } else {
      setRequests((prev) => mergeRowUpsert(prev, row));
    }
  }, []);

  const handleDelete = useCallback((row: { id: string }) => {
    setRequests((prev) => mergeRowDelete(prev, row.id));
  }, []);

  useEffect(() => {
    async function fetchRequests() {
      try {
        const response = await fetch(`/api/missing-rooms?property_id=${encodeURIComponent(propertyId)}&status=pending`);
        if (response.ok) {
          const data = await response.json();
          setRequests(data.items || []);
        }
      } catch (error) {
        console.error('[useMissingRoomRequests] Error:', error);
      } finally {
        setIsLoading(false);
      }
    }

    if (propertyId) {
      fetchRequests();
    }
  }, [propertyId]);

  useEffect(() => {
    if (!propertyId) return;
    const unsub = subscribeMissingRoomRequests(propertyId, handleUpsert, handleDelete);
    return unsub;
  }, [propertyId, handleUpsert, handleDelete]);

  return { requests, isLoading };
}
