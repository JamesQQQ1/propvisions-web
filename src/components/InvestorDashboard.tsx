// src/components/InvestorDashboard.tsx
"use client";

import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  type ScenarioBaseline,
  type ScenarioOverrides,
  type ComputedKPIs,
  recomputeKPIs,
  buildBaselineFromPayload,
} from '@/lib/financeCore';
import StickyKPIHeader from './StickyKPIHeader';

/* ========== TYPES ========== */

type InvestorDashboardProps = {
  payload: any;
  onSaveScenario?: (overrides: ScenarioOverrides, kpis: ComputedKPIs) => void;
};

type RoomData = {
  key: string;
  label: string;
  total_with_vat: number;
  images: string[];
  topCosts: Array<{ label: string; value: number; pct: number }>;
};

/* ========== FORMATTING ========== */

const nfGBP0 = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 });
const nfPct1 = new Intl.NumberFormat('en-GB', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 });
const money0 = (x?: number) => (x == null ? '—' : nfGBP0.format(x));
const money0NoSymbol = (x?: number) => (x == null ? '—' : x.toLocaleString('en-GB', { maximumFractionDigits: 0 }));
const pct1 = (x?: number) => (x == null ? '—' : `${x.toFixed(1)}%`);

/* ========== UTILITIES ========== */

function classNames(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(' ');
}

function Tooltip({ children, text }: { children: React.ReactNode; text: string }) {
  return (
    <span className="group relative inline-block cursor-help">
      {children}
      <span className="invisible group-hover:visible absolute z-10 w-64 p-2 mt-2 text-xs text-white bg-slate-800 dark:bg-slate-700 rounded-lg shadow-lg -left-24 top-full">
        {text}
      </span>
    </span>
  );
}

/* ========== MAIN COMPONENT ========== */

export default function InvestorDashboard({ payload, onSaveScenario }: InvestorDashboardProps) {
  const baseline = useMemo(() => buildBaselineFromPayload(payload), [payload]);
  const [overrides, setOverrides] = useState<ScenarioOverrides>({});
  const [showExVAT, setShowExVAT] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isUpdating, setIsUpdating] = useState(false);

  // Recompute KPIs whenever baseline or overrides change
  const kpis = useMemo(() => {
    setIsUpdating(true);
    const result = recomputeKPIs(baseline, overrides);
    setTimeout(() => {
      setIsUpdating(false);
      setLastUpdated(new Date());
    }, 100);
    return result;
  }, [baseline, overrides]);

  const baselineKPIs = useMemo(() => recomputeKPIs(baseline, {}), [baseline]);

  const updateOverride = useCallback((key: keyof ScenarioOverrides, value: any) => {
    setOverrides((prev) => ({ ...prev, [key]: value }));
  }, []);

  const updateRoomOverride = useCallback((roomKey: string, value: number) => {
    setOverrides((prev) => ({
      ...prev,
      rooms: { ...prev.rooms, [roomKey]: value },
    }));
  }, []);

  const resetToBaseline = useCallback(() => {
    setOverrides({});
  }, []);

  const handleSave = useCallback(() => {
    if (onSaveScenario) {
      onSaveScenario(overrides, kpis);
    }
  }, [overrides, kpis, onSaveScenario]);

  const hasOverrides = Object.keys(overrides).length > 0 && JSON.stringify(overrides) !== '{}';

  // Extract room data from payload
  const roomsData = useMemo(() => extractRoomsData(payload, baseline), [payload, baseline]);
  const epcData = useMemo(() => extractEPCData(payload), [payload]);

  // Current values (with overrides)
  const currentRent = overrides.monthly_rent_gbp ?? baseline.monthly_rent_gbp;
  const currentEPC = overrides.epc_total_gbp ?? baseline.epc_total_gbp;

  return (
    <div className="space-y-0">
      {/* Sticky Header */}
      <StickyKPIHeader
        price={baseline.purchase_price_gbp}
        refurbTotal={kpis.refurb_total_gbp}
        rent={currentRent}
        valuation={baseline.refi_value_gbp}
        isUpdating={isUpdating}
        lastUpdated={lastUpdated}
      />

      <div className="max-w-[2000px] mx-auto px-4 py-8 space-y-8">
        {/* 1. Investment Snapshot */}
        <Section
          title="Investment Snapshot"
          desc="Core metrics at a glance"
          right={
            <div className="flex gap-2">
              {hasOverrides && (
                <button
                  onClick={resetToBaseline}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-medium text-sm transition-colors"
                >
                  Reset
                </button>
              )}
              {onSaveScenario && (
                <button
                  onClick={handleSave}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors shadow-sm"
                >
                  Save Scenario
                </button>
              )}
            </div>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              label="Total Cash In"
              value={money0(kpis.total_cash_in_gbp)}
              subtitle="Deposit + Refurb + SDLT + Fees"
              delta={getDelta(kpis.total_cash_in_gbp, baselineKPIs.total_cash_in_gbp)}
            />
            <KPICard
              label="Net Profit (Sell)"
              value={money0(kpis.net_profit_gbp)}
              subtitle={`ROI: ${pct1(kpis.roi_percent)}`}
              tone={kpis.net_profit_gbp > 0 ? 'green' : 'red'}
              delta={getDelta(kpis.net_profit_gbp, baselineKPIs.net_profit_gbp)}
            />
            <KPICard
              label="Cash Left In (Refi)"
              value={money0(kpis.net_cash_left_in_gbp)}
              subtitle="After refinance"
              delta={getDelta(kpis.net_cash_left_in_gbp, baselineKPIs.net_cash_left_in_gbp)}
            />
            <KPICard
              label="24m Cashflow"
              value={money0(kpis.net_cashflow_24m_gbp)}
              subtitle={`CoC ROI: ${pct1(kpis.roi_cash_on_cash_percent_24m)}`}
              tone={kpis.net_cashflow_24m_gbp > 0 ? 'green' : 'red'}
              delta={getDelta(kpis.net_cashflow_24m_gbp, baselineKPIs.net_cashflow_24m_gbp)}
            />
          </div>
        </Section>

        {/* 2. Adjustable Inputs */}
        <Section title="Adjustable Inputs" desc="Move sliders to test different scenarios">
          <div className="space-y-6">
            {/* Rent */}
            <SliderControl
              label="Monthly Rent"
              value={currentRent}
              min={baseline.monthly_rent_gbp * 0.7}
              max={baseline.monthly_rent_gbp * 1.3}
              step={5}
              onChange={(v) => updateOverride('monthly_rent_gbp', v)}
              baseline={baseline.monthly_rent_gbp}
              format="money"
              tooltip="Affects yield, DSCR, and all cashflow metrics"
            />

            {/* EPC */}
            <SliderControl
              label="EPC Works Total"
              value={currentEPC}
              min={0}
              max={baseline.epc_total_gbp * 2}
              step={25}
              onChange={(v) => updateOverride('epc_total_gbp', v)}
              baseline={baseline.epc_total_gbp}
              format="money"
              tooltip="Energy Performance Certificate improvements"
            />

            {/* Overheads */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SliderControl
                label="Management"
                value={(overrides.management_pct ?? baseline.management_pct) * 100}
                min={5}
                max={15}
                step={0.5}
                onChange={(v) => updateOverride('management_pct', v / 100)}
                baseline={baseline.management_pct * 100}
                format="percent"
                tooltip="Property management fee as % of rent"
              />
              <SliderControl
                label="Voids"
                value={(overrides.voids_pct ?? baseline.voids_pct) * 100}
                min={0}
                max={10}
                step={0.5}
                onChange={(v) => updateOverride('voids_pct', v / 100)}
                baseline={baseline.voids_pct * 100}
                format="percent"
                tooltip="Vacancy allowance as % of rent"
              />
              <SliderControl
                label="Maintenance"
                value={(overrides.maintenance_pct_of_value_pa ?? baseline.maintenance_pct_of_value_pa ?? 0.01) * 100}
                min={0.5}
                max={1.5}
                step={0.1}
                onChange={(v) => updateOverride('maintenance_pct_of_value_pa', v / 100)}
                baseline={(baseline.maintenance_pct_of_value_pa ?? 0.01) * 100}
                format="percent"
                tooltip="Annual maintenance as % of property value"
              />
            </div>
          </div>
        </Section>

        {/* 3. Refurbishment Breakdown */}
        <Section
          title="Refurbishment Breakdown"
          desc="Adjust individual room costs to see instant impact"
          right={
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showExVAT}
                onChange={(e) => setShowExVAT(e.target.checked)}
                className="rounded"
              />
              <span className="text-slate-700 dark:text-slate-300">Show ex-VAT</span>
            </label>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {roomsData.map((room) => (
              <RoomCardWithSlider
                key={room.key}
                room={room}
                showExVAT={showExVAT}
                baseline={baseline.rooms_baseline[room.key] || room.total_with_vat}
                current={overrides.rooms?.[room.key] ?? baseline.rooms_baseline[room.key] ?? room.total_with_vat}
                onChange={(v) => updateRoomOverride(room.key, v)}
              />
            ))}
          </div>

          {/* Totals Footer */}
          <div className="border-t-2 border-slate-200 dark:border-slate-700 pt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <TotalCard label="Rooms" value={getRoomsTotal(baseline, overrides)} showExVAT={showExVAT} />
              <TotalCard label="EPC" value={currentEPC} showExVAT={showExVAT} />
              <TotalCard label="Overheads" value={0} showExVAT={showExVAT} isEstimate />
              <TotalCard
                label="Grand Total"
                value={kpis.refurb_total_gbp}
                showExVAT={showExVAT}
                highlight
              />
            </div>
          </div>
        </Section>

        {/* 4. Financing & Scenarios */}
        <Section title="Financing & Scenarios" desc="Bridge loan, refinance, and exit strategies">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bridge Period */}
            <FinanceCard title="Bridge Period" tone="blue">
              <MetricRow label="Months on bridge" value={kpis.months_on_bridge} />
              <MetricRow label="Refurb months" value={kpis.months_refurb} />
              <MetricRow label="Months rented" value={kpis.months_rented} />
              <MetricRow label="Bridge interest" value={money0(kpis.bridge_interest_gbp)} />
              <MetricRow label="Yield on cost" value={pct1(kpis.yield_on_cost_percent)} tooltip="Stabilised full-year reference" />
            </FinanceCard>

            {/* Refi & Hold */}
            <FinanceCard title="Refi & Hold (24m)" tone="green">
              <MetricRow label="BTL Loan (final)" value={money0(kpis.btl_loan_final_gbp)} />
              <MetricRow label="DSCR (month 1)" value={kpis.dscr_month1.toFixed(2)} tone={getDSCRTone(kpis.dscr_month1)} />
              <MetricRow label="Monthly opex" value={money0(kpis.monthly_opex_gbp)} />
              <MetricRow label="24m net cashflow" value={money0(kpis.net_cashflow_24m_gbp)} />
              <MetricRow label="Cash-on-cash ROI" value={pct1(kpis.roi_cash_on_cash_percent_24m)} />
            </FinanceCard>
          </div>
        </Section>
      </div>
    </div>
  );
}

/* ========== SUB-COMPONENTS ========== */

function Section({
  title,
  desc,
  children,
  right,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm p-6">
      <div className="flex items-start justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-1">{title}</h3>
          {desc && <p className="text-sm text-slate-600 dark:text-slate-400">{desc}</p>}
        </div>
        {right && <div className="ml-4">{right}</div>}
      </div>
      {children}
    </section>
  );
}

function KPICard({
  label,
  value,
  subtitle,
  tone,
  delta,
}: {
  label: string;
  value: string;
  subtitle?: string;
  tone?: 'green' | 'red' | 'amber';
  delta?: React.ReactNode;
}) {
  const toneStyles = {
    green: 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20',
    red: 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20',
    amber: 'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20',
  };

  return (
    <div className={classNames(
      'rounded-xl border-2 p-4 transition-all hover:shadow-md',
      tone ? toneStyles[tone] : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
    )}>
      <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
        {label}
      </div>
      <div className="flex items-baseline gap-2">
        <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">{value}</div>
        {delta}
      </div>
      {subtitle && (
        <div className="text-xs text-slate-600 dark:text-slate-400 mt-2">{subtitle}</div>
      )}
    </div>
  );
}

function SliderControl({
  label,
  value,
  min,
  max,
  step,
  onChange,
  baseline,
  format = 'money',
  tooltip,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  baseline?: number;
  format?: 'money' | 'percent';
  tooltip?: string;
}) {
  const [localValue, setLocalValue] = useState(value);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (newValue: number) => {
    setLocalValue(newValue);
    if (timeoutId) clearTimeout(timeoutId);
    const id = setTimeout(() => onChange(newValue), 250);
    setTimeoutId(id);
  };

  const displayValue = format === 'money' ? money0(localValue) : `${localValue.toFixed(1)}%`;
  const isDifferent = baseline != null && Math.abs(localValue - baseline) > (format === 'money' ? 10 : 0.1);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {tooltip ? (
            <Tooltip text={tooltip}><span className="border-b border-dotted border-slate-400">{label}</span></Tooltip>
          ) : label}
        </label>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{displayValue}</span>
          {isDifferent && baseline != null && (
            <DeltaBadge current={localValue} baseline={baseline} format={format} />
          )}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={localValue}
        onChange={(e) => handleChange(parseFloat(e.target.value))}
        className="w-full accent-blue-600 dark:accent-blue-500"
      />
    </div>
  );
}

function RoomCardWithSlider({
  room,
  showExVAT,
  baseline,
  current,
  onChange,
}: {
  room: RoomData;
  showExVAT: boolean;
  baseline: number;
  current: number;
  onChange: (v: number) => void;
}) {
  const [localValue, setLocalValue] = useState(current);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setLocalValue(current);
  }, [current]);

  const handleChange = (newValue: number) => {
    setLocalValue(newValue);
    if (timeoutId) clearTimeout(timeoutId);
    const id = setTimeout(() => onChange(newValue), 250);
    setTimeoutId(id);
  };

  const displayValue = showExVAT ? localValue / 1.2 : localValue;
  const isDifferent = Math.abs(localValue - baseline) > 10;

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800 hover:shadow-md transition-all">
      {/* Image */}
      {room.images.length > 0 && (
        <div className="h-40 bg-slate-100 dark:bg-slate-700 relative">
          <img
            src={room.images[0]}
            alt={room.label}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        <h4 className="font-semibold text-slate-900 dark:text-slate-50 mb-2">{room.label}</h4>

        {/* Total */}
        <div className="mb-3">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-50">
              {money0(displayValue)}
            </span>
            {showExVAT && <span className="text-xs text-slate-500">ex-VAT</span>}
            {isDifferent && (
              <DeltaBadge current={localValue} baseline={baseline} format="money" />
            )}
          </div>
        </div>

        {/* Slider */}
        <div className="mb-3">
          <input
            type="range"
            min={0}
            max={baseline * 2.5}
            step={50}
            value={localValue}
            onChange={(e) => handleChange(parseFloat(e.target.value))}
            className="w-full accent-blue-600 dark:accent-blue-500"
          />
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
            <span>£0</span>
            <span>{money0(baseline * 2.5)}</span>
          </div>
        </div>

        {/* Top costs */}
        {room.topCosts.length > 0 && (
          <div className="space-y-1">
            {room.topCosts.slice(0, 3).map((cost, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 dark:bg-blue-400"
                    style={{ width: `${cost.pct}%` }}
                  />
                </div>
                <span className="text-xs text-slate-600 dark:text-slate-400 w-20 text-right">
                  {cost.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TotalCard({
  label,
  value,
  showExVAT,
  highlight,
  isEstimate,
}: {
  label: string;
  value: number;
  showExVAT: boolean;
  highlight?: boolean;
  isEstimate?: boolean;
}) {
  const displayValue = showExVAT ? value / 1.2 : value;

  return (
    <div className={classNames(
      'rounded-lg p-3',
      highlight
        ? 'bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-200 dark:border-blue-800'
        : 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
    )}>
      <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
        {label}
      </div>
      <div className="flex items-baseline gap-2">
        <span className={classNames(
          'font-bold',
          highlight ? 'text-2xl text-blue-900 dark:text-blue-100' : 'text-xl text-slate-900 dark:text-slate-50'
        )}>
          {money0(displayValue)}
        </span>
        {showExVAT && <span className="text-xs text-slate-500">ex-VAT</span>}
        {isEstimate && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300">
            Est
          </span>
        )}
      </div>
    </div>
  );
}

function FinanceCard({
  title,
  tone,
  children,
}: {
  title: string;
  tone?: 'blue' | 'green' | 'amber';
  children: React.ReactNode;
}) {
  const toneStyles = {
    blue: 'border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/20',
    green: 'border-green-200 dark:border-green-800 bg-green-50/30 dark:bg-green-950/20',
    amber: 'border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/20',
  };

  return (
    <div className={classNames(
      'rounded-xl border-2 p-5',
      tone ? toneStyles[tone] : 'border-slate-200 dark:border-slate-700'
    )}>
      <h4 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-4">{title}</h4>
      <div className="space-y-2">
        {children}
      </div>
    </div>
  );
}

function MetricRow({
  label,
  value,
  tone,
  tooltip,
}: {
  label: string;
  value: string | number;
  tone?: 'green' | 'red' | 'amber';
  tooltip?: string;
}) {
  const toneStyles = {
    green: 'text-green-700 dark:text-green-300 font-semibold',
    red: 'text-red-700 dark:text-red-300 font-semibold',
    amber: 'text-amber-700 dark:text-amber-300 font-semibold',
  };

  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-600 dark:text-slate-400">
        {tooltip ? (
          <Tooltip text={tooltip}><span className="border-b border-dotted border-slate-400">{label}</span></Tooltip>
        ) : label}
      </span>
      <span className={tone ? toneStyles[tone] : 'text-slate-900 dark:text-slate-50 font-medium'}>
        {value}
      </span>
    </div>
  );
}

function DeltaBadge({
  current,
  baseline,
  format,
}: {
  current: number;
  baseline: number;
  format: 'money' | 'percent';
}) {
  const delta = current - baseline;
  if (Math.abs(delta) < (format === 'money' ? 10 : 0.01)) return null;

  const tone = delta > 0 ? 'green' : 'red';
  const sign = delta > 0 ? '+' : '';
  const text = format === 'money' ? `${sign}${money0NoSymbol(delta)}` : `${sign}${delta.toFixed(1)}pp`;

  const styles = {
    green: 'bg-green-100 dark:bg-green-950/30 text-green-800 dark:text-green-300',
    red: 'bg-red-100 dark:bg-red-950/30 text-red-800 dark:text-red-300',
  };

  return (
    <span className={classNames('inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium', styles[tone])}>
      {text}
    </span>
  );
}

/* ========== HELPERS ========== */

function getDelta(current: number, baseline: number): React.ReactNode {
  return <DeltaBadge current={current} baseline={baseline} format="money" />;
}

function getDSCRTone(dscr: number): 'green' | 'amber' | 'red' {
  if (dscr < 1.0) return 'red';
  if (dscr < 1.25) return 'amber';
  return 'green';
}

function getRoomsTotal(baseline: ScenarioBaseline, overrides: ScenarioOverrides): number {
  return Object.keys(baseline.rooms_baseline).reduce((sum, key) => {
    const override = overrides.rooms?.[key];
    return sum + (override ?? baseline.rooms_baseline[key]);
  }, 0);
}

function extractRoomsData(payload: any, baseline: ScenarioBaseline): RoomData[] {
  const roomTotals = payload?.property?.room_totals || [];
  const rooms: RoomData[] = [];

  for (const rt of roomTotals) {
    const type = String(rt.type || '').toLowerCase();
    if (['epc_totals', 'epc', 'rooms_totals', 'overheads', 'property_totals', 'unmapped'].includes(type)) {
      continue;
    }

    const key = rt.floorplan_room_id ?? rt.room_index ?? rt.room_name ?? rt.label;
    if (!key) continue;

    const total = rt.room_total_with_vat_gbp || rt.room_total_with_vat || rt.total_with_vat || rt.total_gbp || 0;
    if (total === 0) continue;

    const label = rt.room_name || rt.label || String(key);
    const images: string[] = [];
    if (rt.image_url) images.push(rt.image_url);
    if (Array.isArray(rt.image_urls)) images.push(...rt.image_urls);

    // Extract top costs (mock data for now - would come from line items)
    const topCosts = [
      { label: 'Labour', value: total * 0.4, pct: 40 },
      { label: 'Materials', value: total * 0.35, pct: 35 },
      { label: 'Fixtures', value: total * 0.25, pct: 25 },
    ];

    rooms.push({
      key: String(key),
      label,
      total_with_vat: total,
      images,
      topCosts,
    });
  }

  return rooms;
}

function extractEPCData(payload: any): { total: number; items: Array<{ label: string; value: number }> } {
  const roomTotals = payload?.property?.room_totals || [];
  const epcRow = roomTotals.find((rt: any) => {
    const type = String(rt.type || '').toLowerCase();
    return type === 'epc_totals' || type === 'epc';
  });

  if (!epcRow) return { total: 0, items: [] };

  const total = epcRow.epc_total_with_vat || epcRow.total_with_vat || epcRow.total_gbp || 0;
  return { total, items: [] };
}
