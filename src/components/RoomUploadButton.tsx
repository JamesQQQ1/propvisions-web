// components/RoomUploadButton.tsx
'use client';

import type { PendingUpload } from './MissingRoomRequestsCard';

function isTokenExpired(tokenExpiresAt: string | null): boolean {
  if (!tokenExpiresAt) return true;
  try {
    return new Date(tokenExpiresAt) <= new Date();
  } catch {
    return true;
  }
}

export interface RoomUploadButtonProps {
  pendingUploads: PendingUpload[];
}

export default function RoomUploadButton({ pendingUploads }: RoomUploadButtonProps) {
  if (!pendingUploads || pendingUploads.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 space-y-2">
      {pendingUploads.map((upload) => {
        const expired = isTokenExpired(upload.token_expires_at);
        const hasUrl = !!upload.upload_url;

        return (
          <div key={upload.id} className="bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-800 rounded-lg p-2">
            <div className="text-xs text-amber-800 dark:text-amber-300 font-medium mb-1">Missing photo</div>
            {hasUrl && !expired ? (
              <>
                <a
                  href={upload.upload_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full px-3 py-2 bg-amber-500 dark:bg-amber-600 text-white text-sm font-medium rounded-md hover:bg-amber-600 dark:hover:bg-amber-700 transition-colors text-center"
                >
                  Upload photo
                </a>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-2 leading-tight">
                  Price shown is an estimate from our model. Upload a photo to reprice for higher accuracy.
                </p>
              </>
            ) : (
              <button
                disabled
                className="block w-full px-3 py-2 bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-sm font-medium rounded-md cursor-not-allowed text-center"
              >
                {expired ? 'Link expired' : 'No link'}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
