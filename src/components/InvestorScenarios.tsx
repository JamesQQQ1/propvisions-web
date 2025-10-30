// src/components/InvestorScenarios.tsx
"use client";

import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  type ScenarioBaseline,
  type ScenarioOverrides,
  type ComputedKPIs,
  recomputeKPIs,
  buildBaselineFromPayload,
} from '@/lib/financeCore';

/* ========== TYPES ========== */

type InvestorScenariosProps = {
  payload: any; // backend data payload
  onSaveScenario?: (overrides: ScenarioOverrides, kpis: ComputedKPIs) => void;
};

/* ========== FORMATTING HELPERS ========== */

const nfGBP0 = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 });
const nfGBP2 = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const nfPct1 = new Intl.NumberFormat('en-GB', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 });
const nfPct2 = new Intl.NumberFormat('en-GB', { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 });

const money0 = (x?: number) => (x == null ? '—' : nfGBP0.format(x));
const money2 = (x?: number) => (x == null ? '—' : nfGBP2.format(x));
const pct1 = (x?: number) => (x == null ? '—' : nfPct1.format(x / 100));
const pct2 = (x?: number) => (x == null ? '—' : nfPct2.format(x / 100));

/* ========== UI COMPONENTS ========== */

function classNames(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(' ');
}

function Badge({ children, tone = 'slate' }: { children: React.ReactNode; tone?: 'green' | 'red' | 'amber' | 'slate' | 'blue' }) {
  const styles: Record<string, string> = {
    green: 'bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-300 ring-green-200/60 dark:ring-green-800/60',
    red: 'bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-300 ring-red-200/60 dark:ring-red-800/60',
    amber: 'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 ring-amber-200/60 dark:ring-amber-800/60',
    slate: 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 ring-slate-200/60 dark:ring-slate-700/60',
    blue: 'bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 ring-blue-200/60 dark:ring-blue-800/60',
  };
  return (
    <span className={classNames('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 shadow-sm', styles[tone])}>
      {children}
    </span>
  );
}

function DeltaBadge({ current, baseline, format = 'money' }: { current: number; baseline: number; format?: 'money' | 'percent' }) {
  const delta = current - baseline;
  if (Math.abs(delta) < (format === 'money' ? 10 : 0.01)) return null;

  const tone = delta > 0 ? 'green' : 'red';
  const sign = delta > 0 ? '+' : '';
  const text = format === 'money' ? `${sign}${money0(delta)}` : `${sign}${pct1(delta)}`;

  return <Badge tone={tone}>{text}</Badge>;
}

function KPICard({
  label,
  value,
  subtitle,
  tone,
  delta,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  subtitle?: React.ReactNode;
  tone?: 'green' | 'red' | 'amber' | 'slate' | 'blue';
  delta?: React.ReactNode;
}) {
  return (
    <div className="group rounded-2xl border-2 border-slate-200 dark:border-slate-700 p-5 bg-gradient-to-br from-white via-white to-slate-50/50 dark:from-slate-800 dark:via-slate-850 dark:to-slate-900 shadow-lg hover:shadow-2xl hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-300 hover:-translate-y-0.5">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400 leading-tight">{label}</div>
        {tone && <Badge tone={tone}>{tone.toUpperCase()}</Badge>}
      </div>
      <div className="flex items-baseline gap-2">
        <div className="font-extrabold text-3xl text-slate-900 dark:text-slate-50 tracking-tight leading-none">{value}</div>
        {delta}
      </div>
      {subtitle && <div className="mt-2.5 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium">{subtitle}</div>}
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  baseline,
  format = 'money',
  hint,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  baseline?: number;
  format?: 'money' | 'percent';
  hint?: string;
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

  const displayValue = format === 'money' ? money0(localValue) : `${(localValue * 100).toFixed(1)}%`;
  const isDifferent = baseline != null && Math.abs(localValue - baseline) > (format === 'money' ? 10 : 0.001);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
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
      {hint && <div className="text-xs text-slate-500 dark:text-slate-400">{hint}</div>}
    </div>
  );
}

function Section({
  title,
  children,
  right,
  desc,
}: {
  title: string;
  children: React.ReactNode;
  right?: React.ReactNode;
  desc?: string;
}) {
  return (
    <section className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-3xl shadow-xl p-8 md:p-10 hover:shadow-2xl transition-all duration-300">
      <div className="flex items-start md:items-center justify-between mb-6 pb-6 border-b-2 border-slate-100 dark:border-slate-800">
        <div className="flex-1">
          <h3 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50 mb-2 tracking-tight leading-tight">{title}</h3>
          {desc && <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl font-medium">{desc}</p>}
        </div>
        {right && <div className="ml-4">{right}</div>}
      </div>
      {children}
    </section>
  );
}

/** DSCR Gauge */
function DSCRGauge({ value }: { value?: number }) {
  const raw = Number(value);
  const v = Number.isFinite(raw) ? Math.max(0, Math.min(2, raw)) : 0;
  const pct = v / 2;
  const angle = Math.PI * (1 + pct);
  const r = 42,
    cx = 50,
    cy = 50;
  const x = cx + r * Math.cos(angle);
  const y = cy + r * Math.sin(angle);
  const critical = v < 1.0;
  const ok = v >= 1.25;
  const tone = critical ? '#ef4444' : ok ? '#22c55e' : '#f59e0b';

  return (
    <div className="inline-flex items-center gap-3">
      <svg width="120" height="70" viewBox="0 0 100 60" aria-label="DSCR gauge" className="dark:[&_path:first-child]:stroke-slate-700 dark:[&_text]:fill-slate-100">
        <path d="M8,50 A42,42 0 1 1 92,50" fill="none" stroke="#e5e7eb" strokeWidth="8" strokeLinecap="round" />
        <path d={`M8,50 A42,42 0 ${pct > 0.5 ? 1 : 0} 1 ${x},${y}`} fill="none" stroke={tone} strokeWidth="8" strokeLinecap="round" />
        <text x="50" y="52" textAnchor="middle" fontSize="10" fill="#111827" fontWeight={700}>
          {value == null ? '—' : value.toFixed(2)}
        </text>
      </svg>
      <div className="text-sm">
        <div className="font-medium text-slate-900 dark:text-slate-100">DSCR (Month-1)</div>
        <div className="text-slate-600 dark:text-slate-400">≥ 1.25 preferred</div>
      </div>
    </div>
  );
}

/* ========== MAIN COMPONENT ========== */

export default function InvestorScenarios({ payload, onSaveScenario }: InvestorScenariosProps) {
  const baseline = useMemo(() => buildBaselineFromPayload(payload), [payload]);
  const [overrides, setOverrides] = useState<ScenarioOverrides>({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Recompute KPIs whenever baseline or overrides change
  const kpis = useMemo(() => recomputeKPIs(baseline, overrides), [baseline, overrides]);
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

  // Room data
  const roomKeys = Object.keys(baseline.rooms_baseline);
  const currentRentGBP = overrides.monthly_rent_gbp ?? baseline.monthly_rent_gbp;
  const currentEPCGBP = overrides.epc_total_gbp ?? baseline.epc_total_gbp;

  return (
    <div className="space-y-8">
      {/* Header with actions */}
      <Section
        title="Investor Analysis"
        desc="Adjust assumptions below and see all financial metrics update instantly"
        right={
          <div className="flex gap-2">
            {hasOverrides && (
              <button
                onClick={resetToBaseline}
                className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-medium text-sm transition-colors"
              >
                Reset to Baseline
              </button>
            )}
            {onSaveScenario && (
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors shadow-sm"
              >
                Save Scenario
              </button>
            )}
          </div>
        }
      />

      {/* ===== CONTROLS ===== */}
      <Section title="Adjustable Inputs" desc="Move sliders to test different scenarios">
        <div className="space-y-6">
          {/* Rent */}
          <div>
            <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">Monthly Rent</h4>
            <Slider
              label="Monthly Rent"
              value={currentRentGBP}
              min={baseline.monthly_rent_gbp * 0.7}
              max={baseline.monthly_rent_gbp * 1.3}
              step={5}
              onChange={(v) => updateOverride('monthly_rent_gbp', v)}
              baseline={baseline.monthly_rent_gbp}
              format="money"
              hint={`Base: ${money0(baseline.monthly_rent_gbp)} | Range: ${money0(baseline.monthly_rent_gbp * 0.7)} – ${money0(baseline.monthly_rent_gbp * 1.3)}`}
            />
          </div>

          {/* EPC */}
          <div>
            <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">EPC Works Total</h4>
            <Slider
              label="EPC Total"
              value={currentEPCGBP}
              min={0}
              max={baseline.epc_total_gbp * 2}
              step={25}
              onChange={(v) => updateOverride('epc_total_gbp', v)}
              baseline={baseline.epc_total_gbp}
              format="money"
              hint={`Base: ${money0(baseline.epc_total_gbp)} | Max: ${money0(baseline.epc_total_gbp * 2)}`}
            />
          </div>

          {/* Room-level sliders */}
          {roomKeys.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">Room Refurb Costs</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {roomKeys.map((roomKey) => {
                  const baselineValue = baseline.rooms_baseline[roomKey];
                  const currentValue = overrides.rooms?.[roomKey] ?? baselineValue;
                  return (
                    <Slider
                      key={roomKey}
                      label={String(roomKey)}
                      value={currentValue}
                      min={0}
                      max={baselineValue * 2.5}
                      step={50}
                      onChange={(v) => updateRoomOverride(roomKey, v)}
                      baseline={baselineValue}
                      format="money"
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Overheads */}
          <div>
            <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">Operating Overheads</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Slider
                label="Management (% of rent)"
                value={overrides.management_pct ?? baseline.management_pct}
                min={0.05}
                max={0.15}
                step={0.005}
                onChange={(v) => updateOverride('management_pct', v)}
                baseline={baseline.management_pct}
                format="percent"
              />
              <Slider
                label="Voids (% of rent)"
                value={overrides.voids_pct ?? baseline.voids_pct}
                min={0}
                max={0.1}
                step={0.005}
                onChange={(v) => updateOverride('voids_pct', v)}
                baseline={baseline.voids_pct}
                format="percent"
              />
              <Slider
                label="Maintenance (% of value pa)"
                value={overrides.maintenance_pct_of_value_pa ?? baseline.maintenance_pct_of_value_pa ?? 0.01}
                min={0.005}
                max={0.015}
                step={0.001}
                onChange={(v) => updateOverride('maintenance_pct_of_value_pa', v)}
                baseline={baseline.maintenance_pct_of_value_pa ?? 0.01}
                format="percent"
                hint="% of property value per year"
              />
              <Slider
                label="Insurance (£/year)"
                value={overrides.insurance_gbp_pa ?? baseline.insurance_gbp_pa}
                min={0}
                max={1000}
                step={25}
                onChange={(v) => updateOverride('insurance_gbp_pa', v)}
                baseline={baseline.insurance_gbp_pa}
                format="money"
              />
            </div>
          </div>

          {/* Advanced */}
          <div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              {showAdvanced ? '− Hide' : '+ Show'} Advanced Overheads
            </button>
            {showAdvanced && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <Slider
                  label="Safety Certs (£/year)"
                  value={overrides.safety_certs_gbp_pa ?? baseline.safety_certs_gbp_pa}
                  min={0}
                  max={500}
                  step={25}
                  onChange={(v) => updateOverride('safety_certs_gbp_pa', v)}
                  baseline={baseline.safety_certs_gbp_pa}
                  format="money"
                />
                <Slider
                  label="Ground Rent (£/year)"
                  value={overrides.ground_rent_gbp_pa ?? baseline.ground_rent_gbp_pa}
                  min={0}
                  max={1000}
                  step={25}
                  onChange={(v) => updateOverride('ground_rent_gbp_pa', v)}
                  baseline={baseline.ground_rent_gbp_pa}
                  format="money"
                />
                <Slider
                  label="Service Charge (£/year)"
                  value={overrides.service_charge_gbp_pa ?? baseline.service_charge_gbp_pa}
                  min={0}
                  max={2000}
                  step={50}
                  onChange={(v) => updateOverride('service_charge_gbp_pa', v)}
                  baseline={baseline.service_charge_gbp_pa}
                  format="money"
                />
              </div>
            )}
          </div>
        </div>
      </Section>

      {/* ===== KEY METRICS (ALWAYS VISIBLE) ===== */}
      <Section title="Key Investor Metrics" desc="All values update instantly as you adjust inputs above">
        <div className="space-y-8">
          {/* Bridge Period */}
          <div>
            <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">Bridge Period</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard
                label="Total Cash In"
                value={money0(kpis.total_cash_in_gbp)}
                subtitle="Deposit + Refurb + SDLT + Fees"
                delta={<DeltaBadge current={kpis.total_cash_in_gbp} baseline={baselineKPIs.total_cash_in_gbp} format="money" />}
              />
              <KPICard
                label="Months on Bridge"
                value={kpis.months_on_bridge}
                subtitle={`Refurb: ${kpis.months_refurb}m | Rented: ${kpis.months_rented}m`}
              />
              <KPICard
                label="Yield on Cost"
                value={pct1(kpis.yield_on_cost_percent)}
                subtitle="Stabilised full-year reference"
                delta={<DeltaBadge current={kpis.yield_on_cost_percent} baseline={baselineKPIs.yield_on_cost_percent} format="percent" />}
              />
              <KPICard
                label="Total Refurb"
                value={money0(kpis.refurb_total_gbp)}
                subtitle="Rooms + EPC"
                delta={<DeltaBadge current={kpis.refurb_total_gbp} baseline={baselineKPIs.refurb_total_gbp} format="money" />}
              />
            </div>
          </div>

          {/* Exit A - Sell */}
          <div>
            <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">Exit A: Sell</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <KPICard
                label="Net Profit"
                value={money0(kpis.net_profit_gbp)}
                tone={kpis.net_profit_gbp > 0 ? 'green' : 'red'}
                delta={<DeltaBadge current={kpis.net_profit_gbp} baseline={baselineKPIs.net_profit_gbp} format="money" />}
              />
              <KPICard
                label="ROI"
                value={pct1(kpis.roi_percent)}
                subtitle="Return on total cash in"
                delta={<DeltaBadge current={kpis.roi_percent} baseline={baselineKPIs.roi_percent} format="percent" />}
              />
              <KPICard label="Sale Price" value={money0(kpis.sell_price_gbp)} subtitle={`Costs: ${money0(kpis.selling_costs_gbp)}`} />
            </div>
          </div>

          {/* Exit B - Refi & Hold */}
          <div>
            <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">Exit B: Refi & Hold (24 months)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <KPICard
                label="Final BTL Loan"
                value={money0(kpis.btl_loan_final_gbp)}
                subtitle={`Planned: ${money0(kpis.btl_loan_planned_gbp)}${kpis.btl_loan_final_gbp < kpis.btl_loan_planned_gbp ? ' (DSCR capped)' : ''}`}
                delta={<DeltaBadge current={kpis.btl_loan_final_gbp} baseline={baselineKPIs.btl_loan_final_gbp} format="money" />}
              />
              <KPICard
                label="Net Cash Left In"
                value={money0(kpis.net_cash_left_in_gbp)}
                subtitle="After refinance"
                tone={kpis.net_cash_left_in_gbp < kpis.total_cash_in_gbp * 0.3 ? 'green' : 'slate'}
                delta={<DeltaBadge current={kpis.net_cash_left_in_gbp} baseline={baselineKPIs.net_cash_left_in_gbp} format="money" />}
              />
              <KPICard
                label="24m Net Cashflow"
                value={money0(kpis.net_cashflow_24m_gbp)}
                tone={kpis.net_cashflow_24m_gbp > 0 ? 'green' : 'red'}
                delta={<DeltaBadge current={kpis.net_cashflow_24m_gbp} baseline={baselineKPIs.net_cashflow_24m_gbp} format="money" />}
              />
              <KPICard
                label="24m Cash-on-Cash ROI"
                value={pct1(kpis.roi_cash_on_cash_percent_24m)}
                subtitle="Return on net cash left in"
                delta={<DeltaBadge current={kpis.roi_cash_on_cash_percent_24m} baseline={baselineKPIs.roi_cash_on_cash_percent_24m} format="percent" />}
              />
              <div className="flex items-center justify-center">
                <DSCRGauge value={kpis.dscr_month1} />
              </div>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
