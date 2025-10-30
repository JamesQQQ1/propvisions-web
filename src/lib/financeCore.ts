// src/lib/financeCore.ts
/**
 * Pure calculation module for PropertyScout scenario analysis.
 * All functions are pure - no side effects, no state mutation.
 * Units: Always GBP for currency, decimals for percentages (e.g., 0.10 = 10%)
 */

/* ========== TYPES ========== */

export type ScenarioBaseline = {
  // Acquisition
  purchase_price_gbp: number;

  // Refurb (baseline from backend)
  refurb_total_gbp: number;
  rooms_baseline: Record<string, number>; // room key -> total £ with VAT
  epc_total_gbp: number;

  // Rent
  monthly_rent_gbp: number;

  // Bridge financing
  bridge_loan_gbp: number;
  bridge_rate_annual: number; // decimal (e.g., 0.089 = 8.9%)
  bridge_term_months: number;
  bridge_arrangement_fee_gbp?: number;
  bridge_exit_fee_pct?: number; // decimal
  funds_refurb: boolean; // true if refurb is included in bridge loan
  refurb_months: number;

  // SDLT & fees
  sdlt_gbp: number;
  legal_fees_gbp?: number;

  // Refi
  refi_value_gbp: number; // ARV or refi valuation
  btl_rate_annual: number; // decimal
  btl_ltv_max: number; // decimal (e.g., 0.75)
  btl_product_fee_gbp?: number;
  btl_product_fee_added_to_loan?: boolean;

  // Overheads (annualized where applicable)
  management_pct: number; // decimal, % of rent
  voids_pct: number; // decimal, % of rent
  maintenance_mode: 'value_pct_pa' | 'gbp_per_month';
  maintenance_pct_of_value_pa?: number; // decimal
  maintenance_gbp_per_month?: number;
  insurance_gbp_pa: number;
  safety_certs_gbp_pa: number;
  ground_rent_gbp_pa: number;
  service_charge_gbp_pa: number;

  // Appreciation/growth
  rent_growth_annual?: number; // decimal
  expense_growth_annual?: number; // decimal

  // Sale
  sale_price_method?: 'refi_value' | 'custom'; // defaults to refi_value
  sale_price_gbp?: number; // if custom
  selling_costs_pct?: number; // decimal, % of sale price (default 0.02)
};

export type ScenarioOverrides = {
  // Room-level refurb overrides
  rooms?: Record<string, number>; // room key -> override total £
  epc_total_gbp?: number;

  // Rent
  monthly_rent_gbp?: number;

  // Overheads
  management_pct?: number;
  voids_pct?: number;
  maintenance_mode?: 'value_pct_pa' | 'gbp_per_month';
  maintenance_pct_of_value_pa?: number;
  maintenance_gbp_per_month?: number;
  insurance_gbp_pa?: number;
  safety_certs_gbp_pa?: number;
  ground_rent_gbp_pa?: number;
  service_charge_gbp_pa?: number;
};

export type ComputedKPIs = {
  // Aggregate refurb
  refurb_total_gbp: number;

  // Bridge period
  deposit_gbp: number;
  refurb_cash_gbp: number; // cash paid for refurb (if not funded)
  bridge_interest_gbp: number;
  bridge_fees_gbp: number;
  months_on_bridge: number;
  months_refurb: number;
  months_rented: number; // max(0, term - refurb_months)
  total_cash_in_gbp: number;
  yield_on_cost_percent: number; // stabilised, full-year

  // Exit A - Sell
  sell_price_gbp: number;
  selling_costs_gbp: number;
  repay_bridge_gbp: number;
  net_profit_gbp: number;
  roi_percent: number;

  // Exit B - Refi & Hold 24m
  btl_loan_planned_gbp: number; // before DSCR cap
  btl_loan_final_gbp: number; // after DSCR cap
  btl_product_fee_actual_gbp: number; // final fee (may be in cap calc)
  cash_from_refi_gbp: number; // loan proceeds minus repay
  net_cash_left_in_gbp: number; // total_cash_in - cash_from_refi

  // Month-1 DSCR & opex
  monthly_rent_after_opex_gbp: number;
  monthly_opex_gbp: number;
  monthly_btl_payment_gbp: number;
  dscr_month1: number;

  // 24-month totals
  total_rent_24m_gbp: number;
  total_opex_24m_gbp: number;
  total_btl_interest_24m_gbp: number;
  net_cashflow_24m_gbp: number;
  roi_cash_on_cash_percent_24m: number;
};

/* ========== HELPER FUNCTIONS ========== */

const isNum = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);
const n = (x: unknown, fallback = 0): number => (isNum(x) ? x : fallback);

/**
 * Apply overrides to baseline, returning merged values.
 */
function mergeOverrides(baseline: ScenarioBaseline, overrides: ScenarioOverrides): Required<Omit<ScenarioBaseline, 'sale_price_method' | 'sale_price_gbp' | 'selling_costs_pct'>> & Pick<ScenarioBaseline, 'sale_price_method' | 'sale_price_gbp' | 'selling_costs_pct'> {
  // Compute final rooms total
  const roomsTotal = Object.keys(baseline.rooms_baseline).reduce((sum, key) => {
    const override = overrides.rooms?.[key];
    return sum + (isNum(override) ? override : baseline.rooms_baseline[key]);
  }, 0);

  const epcTotal = overrides.epc_total_gbp ?? baseline.epc_total_gbp;
  const refurbTotal = roomsTotal + epcTotal;

  return {
    ...baseline,
    refurb_total_gbp: refurbTotal,
    monthly_rent_gbp: overrides.monthly_rent_gbp ?? baseline.monthly_rent_gbp,
    management_pct: overrides.management_pct ?? baseline.management_pct,
    voids_pct: overrides.voids_pct ?? baseline.voids_pct,
    maintenance_mode: overrides.maintenance_mode ?? baseline.maintenance_mode,
    maintenance_pct_of_value_pa: overrides.maintenance_pct_of_value_pa ?? baseline.maintenance_pct_of_value_pa ?? 0.01,
    maintenance_gbp_per_month: overrides.maintenance_gbp_per_month ?? baseline.maintenance_gbp_per_month ?? 0,
    insurance_gbp_pa: overrides.insurance_gbp_pa ?? baseline.insurance_gbp_pa,
    safety_certs_gbp_pa: overrides.safety_certs_gbp_pa ?? baseline.safety_certs_gbp_pa,
    ground_rent_gbp_pa: overrides.ground_rent_gbp_pa ?? baseline.ground_rent_gbp_pa,
    service_charge_gbp_pa: overrides.service_charge_gbp_pa ?? baseline.service_charge_gbp_pa,
    rooms_baseline: baseline.rooms_baseline,
  };
}

/**
 * Compute monthly operating expenses (management, voids, maintenance, insurance, safety, ground+service).
 * All inputs must be in decimal form (e.g., 0.10 = 10%).
 */
function computeMonthlyOpex(params: {
  monthly_rent_gbp: number;
  management_pct: number; // decimal
  voids_pct: number; // decimal
  maintenance_mode: 'value_pct_pa' | 'gbp_per_month';
  maintenance_pct_of_value_pa: number; // decimal
  maintenance_gbp_per_month: number;
  property_value_for_maintenance_gbp: number; // use refi value or purchase+alpha*refurb
  insurance_gbp_pa: number;
  safety_certs_gbp_pa: number;
  ground_rent_gbp_pa: number;
  service_charge_gbp_pa: number;
}): number {
  const {
    monthly_rent_gbp,
    management_pct,
    voids_pct,
    maintenance_mode,
    maintenance_pct_of_value_pa,
    maintenance_gbp_per_month,
    property_value_for_maintenance_gbp,
    insurance_gbp_pa,
    safety_certs_gbp_pa,
    ground_rent_gbp_pa,
    service_charge_gbp_pa,
  } = params;

  // Management & Voids: % of rent
  const mgmtAndVoids = monthly_rent_gbp * (management_pct + voids_pct);

  // Maintenance: either % of value pa (annualized then divided by 12) or direct £/mo
  const maintenance = maintenance_mode === 'value_pct_pa'
    ? (property_value_for_maintenance_gbp * maintenance_pct_of_value_pa) / 12
    : maintenance_gbp_per_month;

  // Other costs: annualized, divided by 12
  const other = (insurance_gbp_pa + safety_certs_gbp_pa + ground_rent_gbp_pa + service_charge_gbp_pa) / 12;

  return mgmtAndVoids + maintenance + other;
}

/**
 * Compute BTL monthly payment (interest-only approximation).
 */
function computeBTLPayment(loan_gbp: number, annual_rate: number): number {
  return (loan_gbp * annual_rate) / 12;
}

/**
 * Compute DSCR-capped BTL loan.
 * If product fee is added to loan, we solve iteratively.
 */
function computeDSCRCappedLoan(params: {
  planned_loan_gbp: number;
  monthly_rent_after_opex_gbp: number;
  btl_rate_annual: number; // decimal
  dscr_target: number;
  product_fee_gbp: number;
  product_fee_added_to_loan: boolean;
}): { final_loan_gbp: number; final_fee_gbp: number } {
  const { planned_loan_gbp, monthly_rent_after_opex_gbp, btl_rate_annual, dscr_target, product_fee_gbp, product_fee_added_to_loan } = params;

  if (!product_fee_added_to_loan) {
    // Fee paid separately; simple cap
    const max_payment = monthly_rent_after_opex_gbp / dscr_target;
    const max_loan = (max_payment * 12) / btl_rate_annual;
    const final_loan = Math.min(planned_loan_gbp, max_loan);
    return { final_loan_gbp: final_loan, final_fee_gbp: product_fee_gbp };
  }

  // Fee added to loan; solve iteratively
  // L_final = min(L_planned + fee, (NOI / DSCR) / rate * 12)
  // But fee may be % of L_final, so iterate
  let L = planned_loan_gbp;
  for (let i = 0; i < 10; i++) {
    const fee = product_fee_gbp; // assume flat fee for now
    const L_with_fee = L + fee;
    const max_payment = monthly_rent_after_opex_gbp / dscr_target;
    const max_loan_with_fee = (max_payment * 12) / btl_rate_annual;
    const L_next = Math.min(L_with_fee, max_loan_with_fee);
    if (Math.abs(L_next - L_with_fee) < 1) {
      return { final_loan_gbp: L_next, final_fee_gbp: fee };
    }
    L = L_next - fee; // back out fee for next iteration
  }

  // Fallback
  const max_payment = monthly_rent_after_opex_gbp / dscr_target;
  const max_loan_gross = (max_payment * 12) / btl_rate_annual;
  const final_loan = Math.min(planned_loan_gbp + product_fee_gbp, max_loan_gross);
  return { final_loan_gbp: final_loan, final_fee_gbp: product_fee_gbp };
}

/* ========== MAIN CALCULATION FUNCTION ========== */

/**
 * Recompute all KPIs based on baseline + overrides.
 * This is the single source of truth for live scenario updates.
 */
export function recomputeKPIs(baseline: ScenarioBaseline, overrides: ScenarioOverrides = {}): ComputedKPIs {
  const merged = mergeOverrides(baseline, overrides);

  // ===== REFURB TOTAL =====
  const refurbTotal = merged.refurb_total_gbp;

  // ===== BRIDGE PERIOD =====
  const purchasePrice = merged.purchase_price_gbp;
  const bridgeLoan = merged.bridge_loan_gbp;
  const deposit = purchasePrice - bridgeLoan;

  // Cash for refurb
  const refurbCash = merged.funds_refurb ? 0 : refurbTotal;

  // Bridge principal (includes refurb if funded)
  const bridgePrincipal = merged.funds_refurb ? bridgeLoan + refurbTotal : bridgeLoan;

  // Bridge interest (interest-only approximation)
  const bridgeRateMonthly = merged.bridge_rate_annual / 12;
  const bridgeTermMonths = merged.bridge_term_months;
  const bridgeInterest = bridgePrincipal * bridgeRateMonthly * bridgeTermMonths;

  // Bridge fees
  const arrangementFee = merged.bridge_arrangement_fee_gbp ?? 0;
  const exitFeePct = merged.bridge_exit_fee_pct ?? 0;
  const exitFee = bridgePrincipal * exitFeePct;
  const bridgeFees = arrangementFee + exitFee;

  // Months rented
  const refurbMonths = merged.refurb_months;
  const monthsRented = Math.max(0, bridgeTermMonths - refurbMonths);

  // Total cash in
  const sdlt = merged.sdlt_gbp;
  const legalFees = merged.legal_fees_gbp ?? 0;
  const totalCashIn = deposit + refurbCash + sdlt + legalFees + bridgeFees;

  // Yield on cost (stabilised, full-year reference)
  const annualRent = merged.monthly_rent_gbp * 12;
  const yieldOnCost = (annualRent / (purchasePrice + refurbTotal)) * 100;

  // ===== EXIT A - SELL =====
  const saleMethod = merged.sale_price_method ?? 'refi_value';
  const salePrice = saleMethod === 'custom' && merged.sale_price_gbp ? merged.sale_price_gbp : merged.refi_value_gbp;
  const sellingCostsPct = merged.selling_costs_pct ?? 0.02;
  const sellingCosts = salePrice * sellingCostsPct;

  // Repay bridge (principal + interest + fees already included in totalCashIn, but repay is principal+interest+exit fee)
  const repayBridge = bridgePrincipal + bridgeInterest + exitFee;

  const netProfit = salePrice - sellingCosts - repayBridge - totalCashIn + bridgeFees; // adjust for double-counting fees
  const roiPercent = (netProfit / totalCashIn) * 100;

  // ===== EXIT B - REFI & HOLD 24M =====
  const refiValue = merged.refi_value_gbp;
  const btlLtvMax = merged.btl_ltv_max;
  const btlRate = merged.btl_rate_annual;
  const btlProductFee = merged.btl_product_fee_gbp ?? 0;
  const btlProductFeeAddedToLoan = merged.btl_product_fee_added_to_loan ?? false;

  // Planned loan (before DSCR cap)
  const btlLoanPlanned = refiValue * btlLtvMax;

  // Monthly opex (use refi value as maintenance base)
  const monthlyOpex = computeMonthlyOpex({
    monthly_rent_gbp: merged.monthly_rent_gbp,
    management_pct: merged.management_pct,
    voids_pct: merged.voids_pct,
    maintenance_mode: merged.maintenance_mode,
    maintenance_pct_of_value_pa: merged.maintenance_pct_of_value_pa ?? 0.01,
    maintenance_gbp_per_month: merged.maintenance_gbp_per_month ?? 0,
    property_value_for_maintenance_gbp: refiValue,
    insurance_gbp_pa: merged.insurance_gbp_pa,
    safety_certs_gbp_pa: merged.safety_certs_gbp_pa,
    ground_rent_gbp_pa: merged.ground_rent_gbp_pa,
    service_charge_gbp_pa: merged.service_charge_gbp_pa,
  });

  const monthlyRentAfterOpex = merged.monthly_rent_gbp - monthlyOpex;

  // DSCR cap (target 1.20)
  const dscrTarget = 1.20;
  const { final_loan_gbp: btlLoanFinal, final_fee_gbp: btlProductFeeActual } = computeDSCRCappedLoan({
    planned_loan_gbp: btlLoanPlanned,
    monthly_rent_after_opex_gbp: monthlyRentAfterOpex,
    btl_rate_annual: btlRate,
    dscr_target: dscrTarget,
    product_fee_gbp: btlProductFee,
    product_fee_added_to_loan: btlProductFeeAddedToLoan,
  });

  // Cash from refi (after repaying bridge)
  const cashFromRefi = btlLoanFinal - repayBridge;
  const netCashLeftIn = totalCashIn - cashFromRefi;

  // BTL payment (interest-only)
  const monthlyBTLPayment = computeBTLPayment(btlLoanFinal, btlRate);

  // Month-1 DSCR
  const dscrMonth1 = monthlyRentAfterOpex / monthlyBTLPayment;

  // 24-month totals (with growth)
  const rentGrowth = merged.rent_growth_annual ?? 0;
  const expenseGrowth = merged.expense_growth_annual ?? 0;

  let totalRent24m = 0;
  let totalOpex24m = 0;
  let totalBTLInterest24m = 0;

  for (let month = 1; month <= 24; month++) {
    const yearFrac = month / 12;
    const rentThisMonth = merged.monthly_rent_gbp * Math.pow(1 + rentGrowth, yearFrac);
    const opexThisMonth = monthlyOpex * Math.pow(1 + expenseGrowth, yearFrac);
    const interestThisMonth = monthlyBTLPayment; // IO, so constant

    totalRent24m += rentThisMonth;
    totalOpex24m += opexThisMonth;
    totalBTLInterest24m += interestThisMonth;
  }

  const netCashflow24m = totalRent24m - totalOpex24m - totalBTLInterest24m;
  const roiCashOnCash24m = (netCashflow24m / netCashLeftIn) * 100;

  return {
    // Refurb
    refurb_total_gbp: refurbTotal,

    // Bridge period
    deposit_gbp: deposit,
    refurb_cash_gbp: refurbCash,
    bridge_interest_gbp: bridgeInterest,
    bridge_fees_gbp: bridgeFees,
    months_on_bridge: bridgeTermMonths,
    months_refurb: refurbMonths,
    months_rented: monthsRented,
    total_cash_in_gbp: totalCashIn,
    yield_on_cost_percent: yieldOnCost,

    // Exit A - Sell
    sell_price_gbp: salePrice,
    selling_costs_gbp: sellingCosts,
    repay_bridge_gbp: repayBridge,
    net_profit_gbp: netProfit,
    roi_percent: roiPercent,

    // Exit B - Refi & Hold
    btl_loan_planned_gbp: btlLoanPlanned,
    btl_loan_final_gbp: btlLoanFinal,
    btl_product_fee_actual_gbp: btlProductFeeActual,
    cash_from_refi_gbp: cashFromRefi,
    net_cash_left_in_gbp: netCashLeftIn,

    // Month-1
    monthly_rent_after_opex_gbp: monthlyRentAfterOpex,
    monthly_opex_gbp: monthlyOpex,
    monthly_btl_payment_gbp: monthlyBTLPayment,
    dscr_month1: dscrMonth1,

    // 24m
    total_rent_24m_gbp: totalRent24m,
    total_opex_24m_gbp: totalOpex24m,
    total_btl_interest_24m_gbp: totalBTLInterest24m,
    net_cashflow_24m_gbp: netCashflow24m,
    roi_cash_on_cash_percent_24m: roiCashOnCash24m,
  };
}

/**
 * Helper: Build baseline from backend payload.
 * Maps the existing node output structure to our ScenarioBaseline type.
 */
export function buildBaselineFromPayload(payload: any): ScenarioBaseline {
  const scenarios = payload?.financials?.scenarios || payload?.property?.scenarios || {};
  const inputs = scenarios?.inputs || {};
  const summary = payload?.financials?.summary || payload?.property?.summary || {};
  const period = summary?.period || {};
  const exitRefi = summary?.exit_refi_24m || {};

  // Rooms baseline
  const roomTotals = payload?.property?.room_totals || [];
  const roomsBaseline: Record<string, number> = {};
  let epcTotal = 0;

  for (const rt of roomTotals) {
    const type = String(rt.type || '').toLowerCase();
    if (type === 'epc_totals' || type === 'epc') {
      epcTotal = n(rt.epc_total_with_vat) || n(rt.total_with_vat) || n(rt.total_gbp);
    } else if (!['rooms_totals', 'overheads', 'whole-house', 'property_totals', 'unmapped'].includes(type)) {
      const key = rt.floorplan_room_id ?? rt.room_index ?? rt.room_name ?? rt.label;
      if (key) {
        roomsBaseline[String(key)] = n(rt.room_total_with_vat_gbp) || n(rt.room_total_with_vat) || n(rt.total_with_vat) || n(rt.total_gbp);
      }
    }
  }

  const roomsTotal = Object.values(roomsBaseline).reduce((sum, v) => sum + v, 0);
  const refurbTotal = roomsTotal + epcTotal;

  // Extract other values
  const purchasePrice = n(inputs.purchase_price_gbp) || n(payload?.property?.purchase_price_gbp) || n(payload?.property?.guide_price_gbp);
  const monthlyRent = n(inputs.monthly_rent_gbp) || n(payload?.property?.monthly_rent_gbp) || n(payload?.financials?.monthly_rent_gbp);

  const bridgeLoan = n(inputs.loan_on_purchase_gbp) || n(period.loan_on_purchase_gbp);
  const bridgeRate = n(inputs.rate_bridge_annual) || n(period.rate_bridge_annual) || 0.089;
  const bridgeTerm = n(inputs.bridge_term_months) || n(period.term_months) || 12;
  const fundsRefurb = inputs.funds_refurb ?? period.funds_refurb ?? true;
  const refurbMonths = n(inputs.refurb_months) || n(period.refurb_months) || 3;

  const sdlt = n(inputs.sdlt_gbp) || n(period.sdlt_gbp);
  const legalFees = n(inputs.legal_fees_gbp) || n(period.legal_fees_gbp);

  const refiValue = n(inputs.refi_value_gbp) || n(exitRefi.refi_value_gbp) || n(payload?.property?.post_refurb_valuation_gbp);
  const btlRate = n(inputs.rate_btl_annual) || n(exitRefi.rate_btl_annual) || 0.055;
  const btlLtvMax = n(inputs.ltv_btl_max) || n(exitRefi.ltv_btl_max) || 0.75;
  const btlProductFee = n(inputs.product_fee_btl_gbp) || n(exitRefi.product_fee_gbp);
  const btlProductFeeAddedToLoan = inputs.product_fee_added_to_loan ?? exitRefi.product_fee_added_to_loan ?? false;

  // Overheads (defaults)
  const managementPct = n(inputs.management_pct) || 0.10;
  const voidsPct = n(inputs.voids_pct) || 0.05;
  const maintenancePct = n(inputs.maintenance_pct_of_value_pa) || 0.01;
  const insurancePA = n(inputs.insurance_gbp_pa) || 300;
  const safetyPA = n(inputs.safety_certs_gbp_pa) || 150;
  const groundRentPA = n(inputs.ground_rent_gbp_pa) || n(payload?.property?.ground_rent_gbp_pa) || 0;
  const serviceChargePA = n(inputs.service_charge_gbp_pa) || n(payload?.property?.service_charge_gbp_pa) || 0;

  return {
    purchase_price_gbp: purchasePrice,
    refurb_total_gbp: refurbTotal,
    rooms_baseline: roomsBaseline,
    epc_total_gbp: epcTotal,
    monthly_rent_gbp: monthlyRent,

    bridge_loan_gbp: bridgeLoan,
    bridge_rate_annual: bridgeRate,
    bridge_term_months: bridgeTerm,
    bridge_arrangement_fee_gbp: n(inputs.bridge_arrangement_fee_gbp),
    bridge_exit_fee_pct: n(inputs.bridge_exit_fee_pct),
    funds_refurb: fundsRefurb,
    refurb_months: refurbMonths,

    sdlt_gbp: sdlt,
    legal_fees_gbp: legalFees,

    refi_value_gbp: refiValue,
    btl_rate_annual: btlRate,
    btl_ltv_max: btlLtvMax,
    btl_product_fee_gbp: btlProductFee,
    btl_product_fee_added_to_loan: btlProductFeeAddedToLoan,

    management_pct: managementPct,
    voids_pct: voidsPct,
    maintenance_mode: 'value_pct_pa',
    maintenance_pct_of_value_pa: maintenancePct,
    insurance_gbp_pa: insurancePA,
    safety_certs_gbp_pa: safetyPA,
    ground_rent_gbp_pa: groundRentPA,
    service_charge_gbp_pa: serviceChargePA,

    rent_growth_annual: n(inputs.rent_growth_annual) || 0,
    expense_growth_annual: n(inputs.expense_growth_annual) || 0,

    sale_price_method: 'refi_value',
    selling_costs_pct: 0.02,
  };
}
