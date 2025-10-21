// src/components/FinancialSliders.tsx
"use client";
import { useMemo, useState } from "react";

type Props = {
  priceGBP: number;           // purchase price P
  rentMonthlyGBP: number;     // current selected rent band mid
  refurbTotalGBP: number;     // Cr
  defaults?: Partial<Assumptions>;
  onChange?: (a: Assumptions, derived: Derived) => void;
};

export type Assumptions = {
  mgmtPct: number;        // 0..30
  voidsPct: number;       // 0..25
  maintPct: number;       // 0..20
  insuranceAnnual: number;
  aprPct: number;         // 0..12
  ltvPct: number;         // 0..85
  productFee: number;
  stampDutyOverride?: number | null;
  contingencyPct: number; // 0..20
};

export type Derived = {
  noiAnnual: number;
  totalInvestment: number;   // P + Cr(1+cont) + fees
  mortgageMonthly: number;
  cashflowMonthly: number;
  netYieldPct: number;
  roiPctYear1: number;
};

function Slider({
  label, value, min, max, step, suffix, onChange,
}: { label: string; value: number; min: number; max: number; step: number; suffix?: string; onChange: (v:number)=>void }) {
  return (
    <div className="grid grid-cols-12 gap-3 items-center py-2">
      <div className="col-span-4 text-sm text-slate-600 dark:text-slate-400">{label}</div>
      <input className="col-span-6 accent-blue-600 dark:accent-blue-500" type="range" min={min} max={max} step={step} value={value}
             onChange={(e)=>onChange(parseFloat(e.target.value))}/>
      <div className="col-span-2 text-right text-sm font-medium text-slate-900 dark:text-slate-100">{value}{suffix}</div>
    </div>
  );
}

export default function FinancialSliders(p: Props) {
  const [a, setA] = useState<Assumptions>({
    mgmtPct: 10, voidsPct: 5, maintPct: 5,
    insuranceAnnual: 300, aprPct: 5.5, ltvPct: 70,
    productFee: 999, stampDutyOverride: null, contingencyPct: 10,
    ...p.defaults,
  });

  const d = useMemo<Derived>(() => {
    const P = p.priceGBP;
    const Cr = p.refurbTotalGBP * (1 + a.contingencyPct/100);
    const stamp = Number.isFinite(a.stampDutyOverride as number) ? (a.stampDutyOverride as number) : Math.round(P * 0.05); // simple 5% default
    const fees = stamp + a.productFee + a.insuranceAnnual;
    const totalInvestment = P + Cr + fees;

    const annualRent = p.rentMonthlyGBP * 12;
    const opex = annualRent * ((a.mgmtPct + a.voidsPct + a.maintPct)/100);
    const noiAnnual = annualRent - opex - a.insuranceAnnual;

    // simple repayment approximation (monthly amortization)
    const loan = (P + Cr) * (a.ltvPct/100);
    const r = (a.aprPct/100)/12;
    const n = 25*12;
    const mortgageMonthly = r === 0 ? loan/n : (loan * r) / (1 - Math.pow(1+r, -n));

    const cashflowMonthly = (noiAnnual/12) - mortgageMonthly;
    const netYieldPct = (noiAnnual / totalInvestment) * 100;
    const roiPctYear1 = ((cashflowMonthly*12) / (P + Cr + fees - loan)) * 100; // ROI on cash in

    return { noiAnnual, totalInvestment, mortgageMonthly, cashflowMonthly, netYieldPct, roiPctYear1 };
  }, [a, p.priceGBP, p.refurbTotalGBP, p.rentMonthlyGBP]);

  return (
    <div className="rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-sm">
      <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-slate-100">Financial assumptions</h3>
      <div className="space-y-1">
        <Slider label="Management" value={a.mgmtPct} min={0} max={25} step={0.5} suffix="%" onChange={v=>setA(x=>({...x, mgmtPct:v}))}/>
        <Slider label="Voids" value={a.voidsPct} min={0} max={25} step={0.5} suffix="%" onChange={v=>setA(x=>({...x, voidsPct:v}))}/>
        <Slider label="Maintenance" value={a.maintPct} min={0} max={20} step={0.5} suffix="%" onChange={v=>setA(x=>({...x, maintPct:v}))}/>
        <Slider label="APR" value={a.aprPct} min={0} max={12} step={0.1} suffix="%" onChange={v=>setA(x=>({...x, aprPct:v}))}/>
        <Slider label="LTV" value={a.ltvPct} min={0} max={85} step={1} suffix="%" onChange={v=>setA(x=>({...x, ltvPct:v}))}/>
        <Slider label="Contingency" value={a.contingencyPct} min={0} max={20} step={0.5} suffix="%" onChange={v=>setA(x=>({...x, contingencyPct:v}))}/>
      </div>

      {/* numeric steppers for £ fields */}
      <div className="grid grid-cols-2 gap-3 mt-3">
        <label className="text-sm text-slate-600 dark:text-slate-400">Insurance (£/yr)
          <input type="number" className="mt-1 w-full rounded border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                 value={a.insuranceAnnual} onChange={e=>setA(x=>({...x, insuranceAnnual:+e.target.value || 0}))}/>
        </label>
        <label className="text-sm text-slate-600 dark:text-slate-400">Product fee (£)
          <input type="number" className="mt-1 w-full rounded border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                 value={a.productFee} onChange={e=>setA(x=>({...x, productFee:+e.target.value || 0}))}/>
        </label>
        <label className="text-sm text-slate-600 dark:text-slate-400">Stamp duty override (£)
          <input type="number" className="mt-1 w-full rounded border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                 placeholder="auto (5%)"
                 value={a.stampDutyOverride ?? ''}
                 onChange={e=>setA(x=>({...x, stampDutyOverride: e.target.value === '' ? null : (+e.target.value||0)}))}/>
        </label>
      </div>

      {/* Derived KPIs */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
        <KPI label="NOI (annual)" value={`£${Math.round(d.noiAnnual).toLocaleString()}`} />
        <KPI label="Net yield" value={`${d.netYieldPct.toFixed(2)}%`} />
        <KPI label="Mortgage (mo)" value={`£${Math.round(d.mortgageMonthly).toLocaleString()}`} />
        <KPI label="Cashflow (mo)" value={`£${Math.round(d.cashflowMonthly).toLocaleString()}`} />
        <KPI label="Total investment" value={`£${Math.round(d.totalInvestment).toLocaleString()}`} />
        <KPI label="Year-1 ROI (cash-on-cash)" value={`${d.roiPctYear1.toFixed(1)}%`} />
      </div>
    </div>
  );
}

function KPI({label, value}:{label:string; value:string}) {
  return (
    <div className="rounded-xl border-2 border-slate-200 dark:border-slate-700 p-3 shadow-sm bg-white dark:bg-slate-800">
      <div className="text-slate-500 dark:text-slate-400 text-xs">{label}</div>
      <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">{value}</div>
    </div>
  );
}
