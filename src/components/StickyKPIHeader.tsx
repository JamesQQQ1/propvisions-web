// src/components/StickyKPIHeader.tsx
"use client";

import { type ComputedKPIs } from '@/lib/financeCore';

/* ========== TYPES ========== */

type StickyKPIHeaderProps = {
  price: number;
  refurbTotal: number;
  totalCashIn: number;
  rent: number;
  valuation: number;
  dscr: number;
  cashLeftIn: number;
  cocROI: number;
  isUpdating?: boolean;
  lastUpdated?: Date;
};

/* ========== FORMATTING ========== */

const nfGBP0 = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 });
const money0 = (x?: number) => (x == null ? '—' : nfGBP0.format(x));
const pct1 = (x?: number) => (x == null ? '—' : `${x.toFixed(1)}%`);

/* ========== COMPONENT ========== */

export default function StickyKPIHeader({
  price,
  refurbTotal,
  totalCashIn,
  rent,
  valuation,
  dscr,
  cashLeftIn,
  cocROI,
  isUpdating = false,
  lastUpdated,
}: StickyKPIHeaderProps) {
  const getDSCRTone = (value: number) => {
    if (value < 1.0) return 'bg-red-100 dark:bg-red-950/30 text-red-800 dark:text-red-300';
    if (value < 1.25) return 'bg-amber-100 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300';
    return 'bg-green-100 dark:bg-green-950/30 text-green-800 dark:text-green-300';
  };

  const getROITone = (value: number) => {
    if (value < 5) return 'bg-red-100 dark:bg-red-950/30 text-red-800 dark:text-red-300';
    if (value < 12) return 'bg-amber-100 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300';
    return 'bg-green-100 dark:bg-green-950/30 text-green-800 dark:text-green-300';
  };

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
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <KPIMini label="Price" value={money0(price)} />
          <KPIMini label="Refurb" value={money0(refurbTotal)} subtitle="Rooms + EPC" />
          <KPIMini label="Total In" value={money0(totalCashIn)} subtitle="Cash required" />
          <KPIMini label="Rent" value={money0(rent)} subtitle="per month" />
          <KPIMini label="Valuation" value={money0(valuation)} subtitle="ARV" />
          <KPIMini
            label="DSCR"
            value={dscr.toFixed(2)}
            tone={getDSCRTone(dscr)}
            subtitle="≥1.25 safe"
          />
          <KPIMini label="Cash Left In" value={money0(cashLeftIn)} subtitle="After refi" />
          <KPIMini
            label="CoC ROI"
            value={pct1(cocROI)}
            tone={getROITone(cocROI)}
            subtitle="24m annualized"
          />
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
