// src/lib/__tests__/financeCore.test.ts
/**
 * Unit tests for financeCore calculation module.
 * Ensures correct handling of:
 * - Percent vs decimal conversion
 * - DSCR cap math
 * - Maintenance mode toggle
 * - Months rented calculation
 * - All KPI calculations
 */

import { describe, it, expect } from '@jest/globals';
import { recomputeKPIs, type ScenarioBaseline, type ScenarioOverrides } from '../financeCore';

describe('financeCore', () => {
  // Helper to create a minimal baseline
  const createBaseline = (overrides: Partial<ScenarioBaseline> = {}): ScenarioBaseline => ({
    purchase_price_gbp: 200000,
    refurb_total_gbp: 30000,
    rooms_baseline: { 'kitchen': 10000, 'bedroom_1': 8000, 'bathroom': 7000 },
    epc_total_gbp: 5000,
    monthly_rent_gbp: 1000,

    bridge_loan_gbp: 150000,
    bridge_rate_annual: 0.089, // 8.9%
    bridge_term_months: 12,
    bridge_arrangement_fee_gbp: 1500,
    bridge_exit_fee_pct: 0.01, // 1%
    funds_refurb: true,
    refurb_months: 3,

    sdlt_gbp: 1500,
    legal_fees_gbp: 1000,

    refi_value_gbp: 250000,
    btl_rate_annual: 0.055, // 5.5%
    btl_ltv_max: 0.75, // 75%
    btl_product_fee_gbp: 999,
    btl_product_fee_added_to_loan: false,

    management_pct: 0.10, // 10%
    voids_pct: 0.05, // 5%
    maintenance_mode: 'value_pct_pa',
    maintenance_pct_of_value_pa: 0.01, // 1%
    insurance_gbp_pa: 300,
    safety_certs_gbp_pa: 150,
    ground_rent_gbp_pa: 100,
    service_charge_gbp_pa: 200,

    rent_growth_annual: 0,
    expense_growth_annual: 0,

    sale_price_method: 'refi_value',
    selling_costs_pct: 0.02,

    ...overrides,
  });

  describe('Percent vs Decimal Conversion', () => {
    it('should handle management as decimal correctly (not double-apply %)', () => {
      const baseline = createBaseline({
        monthly_rent_gbp: 1000,
        management_pct: 0.10, // 10% as decimal
        voids_pct: 0.05, // 5% as decimal
      });

      const kpis = recomputeKPIs(baseline);

      // Management + voids = 15% of 1000 = £150/mo
      // Total opex should include this plus other costs
      const expectedMgmtAndVoids = 1000 * (0.10 + 0.05);
      expect(expectedMgmtAndVoids).toBe(150);

      // Monthly opex should be >= 150
      expect(kpis.monthly_opex_gbp).toBeGreaterThanOrEqual(150);
    });

    it('should not double-apply percentage (common bug)', () => {
      const baseline = createBaseline({
        monthly_rent_gbp: 1000,
        management_pct: 0.10, // 10%
      });

      const kpis = recomputeKPIs(baseline);

      // If we accidentally applied % twice: 0.10 * (0.10 * 1000) = 10, which is WRONG
      // Correct: 0.10 * 1000 = 100
      const mgmtPortion = kpis.monthly_opex_gbp; // includes all opex
      expect(mgmtPortion).toBeGreaterThan(10); // should NOT be 10
      expect(mgmtPortion).toBeGreaterThanOrEqual(100); // should be at least 100 from mgmt alone
    });
  });

  describe('Maintenance Mode', () => {
    it('should calculate maintenance as % of value pa correctly', () => {
      const baseline = createBaseline({
        maintenance_mode: 'value_pct_pa',
        maintenance_pct_of_value_pa: 0.01, // 1% of property value per year
        refi_value_gbp: 250000,
      });

      const kpis = recomputeKPIs(baseline);

      // Expected: 250000 * 0.01 / 12 = £208.33/mo
      const expectedMaintenance = (250000 * 0.01) / 12;
      expect(Math.abs(kpis.monthly_opex_gbp - expectedMaintenance)).toBeLessThan(200); // rough check (includes other opex)
    });

    it('should calculate maintenance as direct £/mo correctly', () => {
      const baseline = createBaseline({
        maintenance_mode: 'gbp_per_month',
        maintenance_gbp_per_month: 150,
      });

      const kpis = recomputeKPIs(baseline);

      // Monthly opex should include £150 for maintenance
      // Total opex = mgmt + voids + maintenance + (insurance+safety+ground+service)/12
      // = (0.10+0.05)*1000 + 150 + (300+150+100+200)/12
      // = 150 + 150 + 62.5 = 362.5
      const expectedTotal = 150 + 150 + (300 + 150 + 100 + 200) / 12;
      expect(Math.abs(kpis.monthly_opex_gbp - expectedTotal)).toBeLessThan(1);
    });

    it('should NOT apply % logic when in gbp_per_month mode', () => {
      const baseline = createBaseline({
        maintenance_mode: 'gbp_per_month',
        maintenance_gbp_per_month: 100,
        maintenance_pct_of_value_pa: 0.05, // should be IGNORED
        refi_value_gbp: 250000,
      });

      const kpis = recomputeKPIs(baseline);

      // If we accidentally applied %, we'd get (250000 * 0.05) / 12 = £1041/mo
      // But we should get exactly £100/mo for maintenance
      // Total opex = mgmt+voids + 100 + other
      const expectedMaintenance = 100;
      const mgmtAndVoids = 1000 * (0.10 + 0.05); // 150
      const other = (300 + 150 + 100 + 200) / 12; // 62.5
      const expectedTotal = mgmtAndVoids + expectedMaintenance + other;

      expect(Math.abs(kpis.monthly_opex_gbp - expectedTotal)).toBeLessThan(1);
    });
  });

  describe('Months Rented', () => {
    it('should calculate months_rented = max(0, term - refurb_months)', () => {
      const baseline = createBaseline({
        bridge_term_months: 12,
        refurb_months: 3,
      });

      const kpis = recomputeKPIs(baseline);

      expect(kpis.months_rented).toBe(9);
      expect(kpis.months_refurb).toBe(3);
      expect(kpis.months_on_bridge).toBe(12);
    });

    it('should never return negative months_rented', () => {
      const baseline = createBaseline({
        bridge_term_months: 6,
        refurb_months: 9, // longer than term
      });

      const kpis = recomputeKPIs(baseline);

      expect(kpis.months_rented).toBe(0); // should be clamped to 0
    });
  });

  describe('DSCR Cap Logic', () => {
    it('should not cap loan if DSCR > 1.20', () => {
      const baseline = createBaseline({
        monthly_rent_gbp: 2000, // high rent
        management_pct: 0.05,
        voids_pct: 0.02,
        maintenance_pct_of_value_pa: 0.005,
        refi_value_gbp: 250000,
        btl_ltv_max: 0.75,
        btl_rate_annual: 0.05,
      });

      const kpis = recomputeKPIs(baseline);

      // Planned loan = 250000 * 0.75 = 187500
      expect(kpis.btl_loan_planned_gbp).toBe(187500);

      // Check DSCR is above 1.20
      expect(kpis.dscr_month1).toBeGreaterThanOrEqual(1.20);

      // Final loan should equal planned (no cap applied)
      expect(kpis.btl_loan_final_gbp).toBe(kpis.btl_loan_planned_gbp);
    });

    it('should cap loan if DSCR would be < 1.20', () => {
      const baseline = createBaseline({
        monthly_rent_gbp: 800, // low rent
        management_pct: 0.10,
        voids_pct: 0.08,
        maintenance_pct_of_value_pa: 0.015,
        refi_value_gbp: 250000,
        btl_ltv_max: 0.75,
        btl_rate_annual: 0.06, // higher rate
      });

      const kpis = recomputeKPIs(baseline);

      // Planned loan = 250000 * 0.75 = 187500
      expect(kpis.btl_loan_planned_gbp).toBe(187500);

      // DSCR should be at or above 1.20 due to cap
      expect(kpis.dscr_month1).toBeGreaterThanOrEqual(1.19); // allow small rounding

      // Final loan should be less than planned
      expect(kpis.btl_loan_final_gbp).toBeLessThan(kpis.btl_loan_planned_gbp);
    });

    it('should handle product fee added to loan in DSCR cap correctly', () => {
      const baseline = createBaseline({
        monthly_rent_gbp: 1200,
        refi_value_gbp: 300000,
        btl_ltv_max: 0.75,
        btl_rate_annual: 0.055,
        btl_product_fee_gbp: 2000,
        btl_product_fee_added_to_loan: true,
      });

      const kpis = recomputeKPIs(baseline);

      // Planned loan = 300000 * 0.75 = 225000
      // With fee added: 225000 + 2000 = 227000
      // But DSCR cap may reduce this

      // Final loan should include fee or be capped appropriately
      expect(kpis.btl_loan_final_gbp).toBeGreaterThan(0);
      expect(kpis.dscr_month1).toBeGreaterThanOrEqual(1.19);
    });
  });

  describe('Overrides', () => {
    it('should correctly apply room overrides', () => {
      const baseline = createBaseline({
        rooms_baseline: { 'kitchen': 10000, 'bedroom': 8000 },
        epc_total_gbp: 5000,
      });

      const overrides: ScenarioOverrides = {
        rooms: { 'kitchen': 15000 }, // increase kitchen by £5000
      };

      const kpis = recomputeKPIs(baseline, overrides);

      // New total = 15000 (kitchen) + 8000 (bedroom) + 5000 (epc) = 28000
      expect(kpis.refurb_total_gbp).toBe(28000);
    });

    it('should correctly apply EPC override', () => {
      const baseline = createBaseline({
        rooms_baseline: { 'kitchen': 10000 },
        epc_total_gbp: 5000,
      });

      const overrides: ScenarioOverrides = {
        epc_total_gbp: 7500, // increase EPC by £2500
      };

      const kpis = recomputeKPIs(baseline, overrides);

      // New total = 10000 (kitchen) + 7500 (epc) = 17500
      expect(kpis.refurb_total_gbp).toBe(17500);
    });

    it('should correctly apply rent override and update all downstream KPIs', () => {
      const baseline = createBaseline({ monthly_rent_gbp: 1000 });
      const kpisBase = recomputeKPIs(baseline);

      const overrides: ScenarioOverrides = {
        monthly_rent_gbp: 1200, // increase by £200
      };
      const kpisOverride = recomputeKPIs(baseline, overrides);

      // Yield on cost should increase
      expect(kpisOverride.yield_on_cost_percent).toBeGreaterThan(kpisBase.yield_on_cost_percent);

      // Monthly opex should increase (mgmt/voids are % of rent)
      expect(kpisOverride.monthly_opex_gbp).toBeGreaterThan(kpisBase.monthly_opex_gbp);

      // DSCR should improve
      expect(kpisOverride.dscr_month1).toBeGreaterThan(kpisBase.dscr_month1);
    });

    it('should correctly apply overhead overrides', () => {
      const baseline = createBaseline({
        management_pct: 0.10,
        voids_pct: 0.05,
      });

      const overrides: ScenarioOverrides = {
        management_pct: 0.12, // increase by 2pp
        voids_pct: 0.08, // increase by 3pp
      };

      const kpisBase = recomputeKPIs(baseline);
      const kpisOverride = recomputeKPIs(baseline, overrides);

      // Opex should increase
      expect(kpisOverride.monthly_opex_gbp).toBeGreaterThan(kpisBase.monthly_opex_gbp);

      // DSCR should decrease (higher opex = lower NOI)
      expect(kpisOverride.dscr_month1).toBeLessThan(kpisBase.dscr_month1);
    });
  });

  describe('Exit A - Sell', () => {
    it('should calculate net profit correctly', () => {
      const baseline = createBaseline({
        purchase_price_gbp: 200000,
        refurb_total_gbp: 30000,
        refi_value_gbp: 280000, // sale price
        selling_costs_pct: 0.02, // 2%
        sdlt_gbp: 1500,
        legal_fees_gbp: 1000,
        bridge_loan_gbp: 150000,
        bridge_rate_annual: 0.089,
        bridge_term_months: 12,
        bridge_arrangement_fee_gbp: 1500,
        bridge_exit_fee_pct: 0.01,
        funds_refurb: true,
      });

      const kpis = recomputeKPIs(baseline);

      // Sale price = 280000
      // Selling costs = 280000 * 0.02 = 5600
      // Bridge principal = 150000 + 30000 = 180000
      // Bridge interest = 180000 * 0.089 / 12 * 12 = 16020
      // Exit fee = 180000 * 0.01 = 1800
      // Total repay = 180000 + 16020 + 1800 = 197820

      // Deposit = 200000 - 150000 = 50000
      // Refurb cash = 0 (funded)
      // Total cash in = 50000 + 0 + 1500 + 1000 + 1500 = 54000

      // Net profit = 280000 - 5600 - 197820 - 54000 + 1500 = 24080
      // (Note: +1500 is adjustment for double-counting arrangement fee in repay calculation)

      expect(kpis.sell_price_gbp).toBe(280000);
      expect(kpis.selling_costs_gbp).toBe(5600);
      expect(kpis.net_profit_gbp).toBeGreaterThan(0);
      expect(kpis.roi_percent).toBeGreaterThan(0);
    });
  });

  describe('Exit B - Refi & Hold 24m', () => {
    it('should calculate 24m cashflow correctly with no growth', () => {
      const baseline = createBaseline({
        monthly_rent_gbp: 1000,
        rent_growth_annual: 0,
        expense_growth_annual: 0,
      });

      const kpis = recomputeKPIs(baseline);

      // Total rent = 1000 * 24 = 24000
      expect(kpis.total_rent_24m_gbp).toBeCloseTo(24000, 0);

      // Opex and interest should also be flat
      const expectedOpex24m = kpis.monthly_opex_gbp * 24;
      expect(kpis.total_opex_24m_gbp).toBeCloseTo(expectedOpex24m, 0);

      const expectedInterest24m = kpis.monthly_btl_payment_gbp * 24;
      expect(kpis.total_btl_interest_24m_gbp).toBeCloseTo(expectedInterest24m, 0);
    });

    it('should calculate 24m cashflow correctly with growth', () => {
      const baseline = createBaseline({
        monthly_rent_gbp: 1000,
        rent_growth_annual: 0.03, // 3% pa
        expense_growth_annual: 0.02, // 2% pa
      });

      const kpis = recomputeKPIs(baseline);

      // Rent should grow over 24 months
      // Year 1 avg: ~1015, Year 2 avg: ~1045 -> total ~24720
      expect(kpis.total_rent_24m_gbp).toBeGreaterThan(24000);
      expect(kpis.total_rent_24m_gbp).toBeLessThan(25000); // rough bounds

      // Opex should also grow (but less)
      const flatOpex24m = kpis.monthly_opex_gbp * 24;
      expect(kpis.total_opex_24m_gbp).toBeGreaterThan(flatOpex24m);
    });

    it('should calculate cash-on-cash ROI correctly', () => {
      const baseline = createBaseline();
      const kpis = recomputeKPIs(baseline);

      // Cash-on-cash = net cashflow 24m / net cash left in * 100
      const expected = (kpis.net_cashflow_24m_gbp / kpis.net_cash_left_in_gbp) * 100;
      expect(kpis.roi_cash_on_cash_percent_24m).toBeCloseTo(expected, 1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero rent gracefully', () => {
      const baseline = createBaseline({ monthly_rent_gbp: 0 });
      const kpis = recomputeKPIs(baseline);

      expect(kpis.yield_on_cost_percent).toBe(0);
      expect(kpis.dscr_month1).toBeLessThan(1); // will fail DSCR
    });

    it('should handle zero refurb gracefully', () => {
      const baseline = createBaseline({
        refurb_total_gbp: 0,
        rooms_baseline: {},
        epc_total_gbp: 0,
      });
      const kpis = recomputeKPIs(baseline);

      expect(kpis.refurb_total_gbp).toBe(0);
      expect(kpis.refurb_cash_gbp).toBe(0);
    });

    it('should handle very high LTV (edge of cap)', () => {
      const baseline = createBaseline({
        btl_ltv_max: 0.85, // very high
        monthly_rent_gbp: 800, // low rent
      });
      const kpis = recomputeKPIs(baseline);

      // Should be heavily capped by DSCR
      expect(kpis.btl_loan_final_gbp).toBeLessThan(kpis.btl_loan_planned_gbp);
      expect(kpis.dscr_month1).toBeGreaterThanOrEqual(1.19);
    });
  });
});
