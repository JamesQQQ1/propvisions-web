// src/components/StickyKPIHeader.tsx
"use client";

import { type ComputedKPIs } from '@/lib/financeCore';

/* ========== TYPES ========== */

type StickyKPIHeaderProps = {
  price: number;
  refurbTotal: number;
  rent: number;
  valuation: number;
  isUpdating?: boolean;
  lastUpdated?: Date;
};

/* ========== FORMATTING ========== */

const nfGBP0 = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 });
const money0 = (x?: number) => (x == null ? '—' : nfGBP0.format(x));

/* ========== COMPONENT ========== */

export default function StickyKPIHeader({
  price,
  refurbTotal,
  rent,
  valuation,
  isUpdating = false,
  lastUpdated,
}: StickyKPIHeaderProps) {

  return (
    <div className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b-2 border-slate-200 dark:border-slate-700 shadow-lg">
      <div className="max-w-[2000px] mx-auto px-4 py-3">
        {/* Top row: Title + Update indicator */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50 tracking-tight">
            Key Metrics
          </h2>
          {lastUpdated && (
            <div className="flex items-center gap-2">
              {isUpdating ? (
                <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                  <div className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
                  <span>Updating...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <div className="w-2 h-2 rounded-full bg-green-600 dark:bg-green-400" />
                  <span>Updated • {getTimeSince(lastUpdated)}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <KPIMini label="Price" value={money0(price)} />
          <KPIMini label="Refurb" value={money0(refurbTotal)} subtitle="Rooms + EPC" />
          <KPIMini label="Rent" value={money0(rent)} subtitle="per month" />
          <KPIMini label="Valuation" value={money0(valuation)} subtitle="ARV" />
        </div>
      </div>
    </div>
  );
}

function KPIMini({
  label,
  value,
  subtitle,
  tone
}: {
  label: string;
  value: string;
  subtitle?: string;
  tone?: string;
}) {
  return (
    <div className="flex flex-col">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
        {label}
      </div>
      <div className={`text-sm font-bold ${tone ? `px-2 py-1 rounded ${tone}` : 'text-slate-900 dark:text-slate-50'}`}>
        {value}
      </div>
      {subtitle && (
        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
          {subtitle}
        </div>
      )}
    </div>
  );
}

function getTimeSince(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 1) return '0s ago';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}
