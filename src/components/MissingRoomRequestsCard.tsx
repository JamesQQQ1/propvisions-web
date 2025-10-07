// components/MissingRoomRequestsCard.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { subscribeMissingRoomRequests } from '@/lib/realtime/subscribe';
import { mergeRowUpsert, mergeRowDelete } from '@/lib/realtime/merge';

interface MissingRoomRequest {
  id: string;
  property_id: string;
  room_name: string;
  upload_url?: string | null;
  token?: string | null;
  token_expires_at?: string | null;
  status?: string | null;
  created_at: string;
  updated_at: string;
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
  const [requests, setRequests] = useState<MissingRoomRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const handleUpsert = useCallback((row: MissingRoomRequest) => {
    setRequests((prev) => mergeRowUpsert(prev, row));
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

  // Filter to only show requests with valid upload URLs and non-expired tokens
  const activeRequests = requests.filter(
    (req) => req.upload_url && !isTokenExpired(req.token_expires_at)
  );

  // If loading or no active requests, don't render anything
  if (isLoading || activeRequests.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-6 md:p-8 shadow-lg">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-amber-900 mb-2">Missing Room Photos</h3>
          <p className="text-sm text-amber-800 leading-relaxed">
            We need additional photos to complete the AI analysis for the following rooms. Please upload photos using the buttons below. Each upload link expires after a set time for security.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {activeRequests.map((request) => (
          <MissingRoomRequestItem key={request.id} request={request} />
        ))}
      </div>
    </div>
  );
}

function MissingRoomRequestItem({ request }: { request: MissingRoomRequest }) {
  const isExpired = isTokenExpired(request.token_expires_at);
  const uploadUrl = request.upload_url;

  // Format room name for display
  const displayName = request.room_name
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Format expiry time
  const expiryDate = request.token_expires_at ? new Date(request.token_expires_at) : null;
  const expiryText = expiryDate
    ? expiryDate.toLocaleString('en-GB', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'Unknown';

  return (
    <div className="bg-white border-2 border-amber-200 rounded-xl p-4 flex items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-10 h-10 bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-slate-900 truncate">{displayName}</div>
          <div className="text-xs text-slate-500 mt-0.5">
            {isExpired ? (
              <span className="text-red-600 font-medium">Link expired</span>
            ) : (
              <span>Expires: {expiryText}</span>
            )}
          </div>
        </div>
      </div>

      {uploadUrl && !isExpired ? (
        <a
          href={uploadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium text-sm rounded-lg hover:from-amber-600 hover:to-orange-600 active:scale-95 transition-all shadow-md hover:shadow-lg flex items-center gap-2 whitespace-nowrap"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Upload Photos
        </a>
      ) : (
        <button
          disabled
          className="px-4 py-2 bg-slate-300 text-slate-500 font-medium text-sm rounded-lg cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Link Expired
        </button>
      )}
    </div>
  );
}
