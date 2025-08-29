'use client';
import React from 'react';

export type Derived = {
  noiAnnual: number;
  totalInvestment: number;
  mortgageMonthly: number;
  cashflowMonthly: number;
  netYieldPct: number;
  roiPctYear1: number;
};

type Props = {
  // If you pass `derived`, we display those values.
  derived?: Derived | null;

  // Fallbacks if you want to render without the sliders wired in yet:
  fallback?: Partial<Derived>;

  className?: string;
  title?: string;
};

const asGBP = (n?: number) =>
  Number.isFinite(n as number) ? `£${Math.round(n as number).toLocaleString()}` : '—';

const asPct = (n?: number, dp = 2) =>
  Number.isFinite(n as number) ? `${(n as number).toFixed(dp)}%` : '—';

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="text-slate-500 text-sm">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}

export default function MetricsCards({ derived, fallback, className = '', title = 'Financial summary' }: Props) {
  const d = {
    noiAnnual: derived?.noiAnnual ?? fallback?.noiAnnual,
    totalInvestment: derived?.totalInvestment ?? fallback?.totalInvestment,
    mortgageMonthly: derived?.mortgageMonthly ?? fallback?.mortgageMonthly,
    cashflowMonthly: derived?.cashflowMonthly ?? fallback?.cashflowMonthly,
    netYieldPct: derived?.netYieldPct ?? fallback?.netYieldPct,
    roiPctYear1: derived?.roiPctYear1 ?? fallback?.roiPctYear1,
  };

  return (
    <section className={className}>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Card label="NOI (annual)" value={asGBP(d.noiAnnual)} />
        <Card label="Net yield" value={asPct(d.netYieldPct)} />
        <Card label="Mortgage (mo)" value={asGBP(d.mortgageMonthly)} />
        <Card label="Cashflow (mo)" value={asGBP(d.cashflowMonthly)} />
        <Card label="Total investment" value={asGBP(d.totalInvestment)} />
        <Card label="Year-1 ROI (cash-on-cash)" value={asPct(d.roiPctYear1, 1)} />
      </div>
    </section>
  );
}
