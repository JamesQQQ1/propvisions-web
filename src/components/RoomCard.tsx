'use client';

import { useState } from 'react';
import type { UiRoom } from '@/lib/rooms';
import { formatCurrency, getTopRoomsByCost } from '@/lib/rooms';
import RoomUploadButton from './RoomUploadButton';
import type { PendingUpload } from './MissingRoomRequestsCard';

interface RoomCardProps {
  room: UiRoom;
  allRooms?: UiRoom[];
  showCharts?: boolean;
  pendingUploads?: PendingUpload[];
}

const PLACEHOLDER_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="320" height="240" viewBox="0 0 320 240">
    <rect width="100%" height="100%" fill="#f8fafc"/>
    <g transform="translate(160,120)">
      <circle r="20" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="2"/>
      <path d="M-8,-8 L8,-8 L8,8 L-8,8 Z" fill="#94a3b8"/>
      <circle cx="-4" cy="-4" r="2" fill="#64748b"/>
      <text y="40" font-family="system-ui" font-size="12" fill="#64748b" text-anchor="middle">No image available</text>
    </g>
  </svg>
`)}`;

function MiniBarChart({ rooms, maxRooms = 5 }: { rooms: UiRoom[]; maxRooms?: number }) {
  const topRooms = getTopRoomsByCost(rooms, maxRooms);
  const maxValue = Math.max(...topRooms.map(r => r.total_with_vat));

  if (topRooms.length === 0) return null;

  return (
    <div className="space-y-1">
      <div className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">Top Rooms by Cost</div>
      {topRooms.map((room) => {
        const width = maxValue > 0 ? (room.total_with_vat / maxValue) * 100 : 0;
        return (
          <div key={room.room_name} className="flex items-center gap-2 text-xs">
            <div className="w-20 truncate text-slate-600 dark:text-slate-400">{room.display_name}</div>
            <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 dark:bg-blue-400 transition-all duration-300"
                style={{ width: `${width}%` }}
              />
            </div>
            <div className="w-16 text-right tabular-nums text-slate-700 dark:text-slate-300">{formatCurrency(room.total_with_vat)}</div>
          </div>
        );
      })}
    </div>
  );
}

export default function RoomCard({ room, allRooms = [], showCharts = false, pendingUploads = [] }: RoomCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images = room.image_urls;
  const hasImages = images.length > 0;
  const currentImage = hasImages ? images[currentImageIndex] : null;
  const thumbnails = images.slice(1, 5); // Show up to 4 thumbnails

  const isZeroCost = room.total_with_vat === 0;

  const nextImage = () => {
    if (images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }
  };

  const prevImage = () => {
    if (images.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  // Format room subtitle with area and windows
  const subtitle = [
    room.area_sqm ? `${room.area_sqm.toFixed(1)} m²` : null,
    room.area_sq_ft ? `${room.area_sq_ft.toFixed(1)} ft²` : null,
    room.window_count ? `${room.window_count} window${room.window_count !== 1 ? 's' : ''}` : null,
  ].filter(Boolean).join(' · ');

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-300 group max-w-full">
      {/* Header */}
      <div className="p-4 pb-2">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 break-words">
          {room.display_name}
        </h3>
        {room.floor && (
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{room.floor} Floor</p>
        )}
        {subtitle && (
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{subtitle}</p>
        )}
      </div>

      {/* Image Section */}
      <div className="relative w-full h-48 bg-slate-50 dark:bg-slate-800 overflow-hidden px-4 rounded-lg">
        <img
          className="w-full h-48 object-cover object-center group-hover:scale-105 transition-transform duration-300 rounded-lg"
          src={currentImage || PLACEHOLDER_SVG}
          alt={currentImage ? `${room.display_name}` : 'No image available'}
          loading="lazy"
        />

        {/* Image counter */}
        <div className="absolute top-3 right-7 flex flex-col gap-2">
          {hasImages && images.length > 1 && (
            <div className="bg-black/70 dark:bg-black/80 backdrop-blur text-white text-xs px-2 py-1 rounded-full">
              {currentImageIndex + 1}/{images.length}
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        {hasImages && images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-6 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 dark:bg-slate-800/90 backdrop-blur rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition-colors shadow-sm"
              aria-label="Previous image"
            >
              ‹
            </button>
            <button
              onClick={nextImage}
              className="absolute right-6 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 dark:bg-slate-800/90 backdrop-blur rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition-colors shadow-sm"
              aria-label="Next image"
            >
              ›
            </button>
          </>
        )}
      </div>

      {/* Thumbnail strip */}
      {thumbnails.length > 0 && (
        <div className="px-4 pt-2">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {thumbnails.map((url, i) => (
              <button
                key={i}
                onClick={() => setCurrentImageIndex(i + 1)}
                className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
              >
                <img
                  src={url}
                  alt={`${room.display_name} view ${i + 2}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="p-4 pt-3">
        {/* Cost Information or Zero Message */}
        {isZeroCost ? (
          <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
            <p className="text-sm text-green-800 dark:text-green-300 font-medium">
              No refurbishment work required for this room/area.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Total Cost */}
            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4 shadow-sm">
              <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Total Refurbishment Cost</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {formatCurrency(room.total_with_vat)}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">Including VAT</div>
              {room.total_without_vat && (
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Ex VAT: {formatCurrency(room.total_without_vat)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Charts - only show if not zero cost */}
        {!isZeroCost && showCharts && allRooms.length > 1 && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <MiniBarChart rooms={allRooms} />
          </div>
        )}

        {/* Upload buttons for missing photos */}
        <RoomUploadButton pendingUploads={pendingUploads} />
      </div>
    </div>
  );
}
