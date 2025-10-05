'use client';

import { useState } from 'react';

export interface RefurbRoom {
  id?: string;
  room_type?: string | null;
  detected_room_type?: string | null;
  room_label?: string | null;
  materials?: any[] | string | null;
  labour?: any[] | string | null;
  materials_total_gbp?: number | null;
  materials_total_with_vat_gbp?: number | null;
  labour_total_gbp?: number | null;
  room_total_gbp?: number | null;
  room_total_with_vat_gbp?: number | null;
  extrasCount?: number;
  images?: string[];
  primaryImage?: string;
}

const titleize = (s: string) => s.replace(/\b\w/g, (m) => m.toUpperCase()).replace(/_/g, ' ');
const money = (x?: number | null) => x == null ? '—' : `£${x.toLocaleString()}`;

interface RoomCardProps {
  room: RefurbRoom;
}

export default function RoomCard({ room }: RoomCardProps) {
  const images = room.images || [];
  const primaryImage = room.primaryImage;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const displayImages = images.length > 0 ? images : (primaryImage ? [primaryImage] : []);
  const hasImages = displayImages.length > 0;
  const currentImage = hasImages ? displayImages[currentImageIndex] : null;

  const nextImage = () => {
    if (displayImages.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % displayImages.length);
    }
  };

  const prevImage = () => {
    if (displayImages.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
    }
  };

  const placeholderSvg = `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#f8fafc;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#f1f5f9;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)"/>
      <g transform="translate(320,210)">
        <circle cx="0" cy="-30" r="24" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="2"/>
        <path d="M-12,-38 L-12,-30 L-6,-24 L6,-30 L12,-30 L12,-38 Z" fill="#94a3b8"/>
        <circle cx="-6" cy="-33" r="3" fill="#64748b"/>
        <text x="0" y="15" font-family="system-ui,-apple-system,sans-serif" font-size="14" font-weight="500" fill="#64748b" text-anchor="middle">No image available</text>
      </g>
    </svg>
  `)}`;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-slate-300 transition-all duration-300 group">
      {/* Image Section */}
      <div className="relative w-full h-48 bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="w-full h-48 object-cover object-center group-hover:scale-105 transition-transform duration-300"
          src={currentImage || placeholderSvg}
          alt={currentImage ? `${titleize(room.room_type || '')} ${room.room_label || ''}` : 'No image available'}
          loading="lazy"
        />

        {/* Image counter and extras badge */}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          {hasImages && displayImages.length > 1 && (
            <div className="bg-black/70 backdrop-blur text-white text-xs px-2 py-1 rounded-full">
              {currentImageIndex + 1}/{displayImages.length}
            </div>
          )}
          {room.extrasCount && room.extrasCount > 0 && (
            <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
              +{room.extrasCount} extra photos
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        {hasImages && displayImages.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-slate-700 hover:bg-white transition-colors"
              aria-label="Previous image"
            >
              ‹
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-slate-700 hover:bg-white transition-colors"
            >
              ›
            </button>
          </>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4">
        {/* Room Title */}
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-slate-900 line-clamp-2">
            {room.room_label || titleize(room.room_type || room.detected_room_type || 'Room')}
          </h3>
        </div>

        {/* Cost Pills */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
            <div className="text-xs font-medium text-emerald-800 mb-1">Materials</div>
            <div className="text-sm font-bold text-emerald-900">
              {room.materials_total_with_vat_gbp === undefined ? '—' :
               room.materials_total_with_vat_gbp === 0 ? '£0' : money(room.materials_total_with_vat_gbp)}
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
            <div className="text-xs font-medium text-blue-800 mb-1">Labour</div>
            <div className="text-sm font-bold text-blue-900">
              {room.labour_total_gbp === undefined ? '—' :
               room.labour_total_gbp === 0 ? '£0' : money(room.labour_total_gbp)}
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
            <div className="text-xs font-medium text-slate-800 mb-1">Total</div>
            <div className="text-sm font-bold text-slate-900">
              {room.room_total_with_vat_gbp === undefined ? '—' :
               room.room_total_with_vat_gbp === 0 ? '£0' : money(room.room_total_with_vat_gbp)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}