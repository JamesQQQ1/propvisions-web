# Investor Scenarios - Live KPI Calculator

## Overview

This implementation provides a **live, interactive scenario analysis tool** for property investors. Every slider adjustment instantly updates **all** financial metrics across the entire analysis, including:

- Bridge period cash flow
- Exit A (Sell) profitability
- Exit B (Refi & Hold) 24-month projections
- DSCR calculations
- ROI percentages

## Key Features

### ✅ Live Updates
- **Instant recalculation**: All KPIs update within <150ms after you stop adjusting a slider (250ms debounce)
- **No server calls**: All calculations happen client-side using pure TypeScript functions
- **Unit correctness**: Rigorous percent/decimal handling prevents common calculation errors

### ✅ Investor-Focused UI
- Only the most important KPIs are shown by default
- Advanced overheads can be revealed with a toggle
- Delta badges show changes from baseline (e.g., "+£3,400" or "+1.2pp")
- DSCR gauge provides visual feedback on loan safety

### ✅ Comprehensive Controls

#### Per-Room Refurb Sliders
- Adjust individual room costs (inclusive of VAT)
- Range: 0 to 2.5× baseline
- Step: £50
- Shows delta vs baseline

#### EPC Pack
- Single control for all EPC works
- Range: 0 to 2× baseline
- Step: £25

#### Rent
- Monthly rent slider
- Default range: 70% to 130% of baseline
- Step: £5
- Can be unlocked for wider range

#### Overheads
- **Management**: 5-15% of rent (decimal input: 0.05-0.15)
- **Voids**: 0-10% of rent (decimal input: 0.00-0.10)
- **Maintenance**: Toggle between:
  - % of property value per year (0.5-1.5%)
  - Direct £/month input
- **Insurance**: £0-£1000/year
- **Safety Certs**: £0-£500/year
- **Ground Rent**: £0-£1000/year (override)
- **Service Charge**: £0-£2000/year (override)

## Architecture

### Core Files

#### 1. `src/lib/financeCore.ts`
Pure calculation module with zero side effects. All functions are testable and predictable.

**Key Functions:**
- `buildBaselineFromPayload(payload)`: Extracts baseline data from backend payload
- `recomputeKPIs(baseline, overrides)`: Single source of truth for all calculations
- `mergeOverrides()`: Combines baseline + user adjustments
- `computeMonthlyOpex()`: Calculates all operating expenses
- `computeDSCRCappedLoan()`: Implements DSCR cap logic with iterative solver

**Types:**
- `ScenarioBaseline`: Complete property data from backend
- `ScenarioOverrides`: User adjustments (stored client-side only)
- `ComputedKPIs`: All calculated metrics

#### 2. `src/components/InvestorScenarios.tsx`
React component providing the UI and state management.

**Features:**
- Debounced slider inputs (250ms)
- Memoized KPI calculations
- Delta badges comparing to baseline
- Reset and Save buttons
- Responsive grid layouts

#### 3. `src/app/demo/page.tsx`
Integration point - adds InvestorScenarios above the legacy Financial Summary section.

## Calculations Performed

### Bridge Period
```typescript
deposit = purchase_price - bridge_loan
refurb_cash = funds_refurb ? 0 : refurb_total
bridge_interest = bridge_principal × rate_monthly × term_months
months_rented = max(0, term - refurb_months)
total_cash_in = deposit + refurb_cash + sdlt + fees
yield_on_cost = (annual_rent / (purchase + refurb)) × 100
```

### Exit A - Sell
```typescript
sale_price = refi_value (or custom)
selling_costs = sale_price × 0.02
repay_bridge = principal + interest + exit_fee
net_profit = sale_price - selling_costs - repay_bridge - total_cash_in
roi_percent = (net_profit / total_cash_in) × 100
```

### Exit B - Refi & Hold
```typescript
// Monthly opex
management = rent × management_pct
voids = rent × voids_pct
maintenance = (property_value × maintenance_pct) / 12  // or direct £/mo
other = (insurance + safety + ground + service) / 12
monthly_opex = management + voids + maintenance + other

// DSCR cap (target: 1.20)
planned_loan = refi_value × ltv_max
max_payment = (rent - opex) / 1.20
max_loan = (max_payment × 12) / btl_rate
final_loan = min(planned_loan, max_loan)

// If product fee added to loan, solve iteratively
if (fee_added_to_loan) {
  for (i = 0; i < 10; i++) {
    loan_with_fee = loan + fee
    max_loan = compute_max_from_dscr()
    loan = min(loan_with_fee, max_loan) - fee
  }
}

// 24-month totals (with growth)
for (month = 1 to 24) {
  year_frac = month / 12
  rent_this_month = rent × (1 + rent_growth)^year_frac
  opex_this_month = opex × (1 + expense_growth)^year_frac
  interest_this_month = btl_payment  // IO, so constant

  total_rent_24m += rent_this_month
  total_opex_24m += opex_this_month
  total_interest_24m += interest_this_month
}

net_cashflow_24m = total_rent_24m - total_opex_24m - total_interest_24m
net_cash_left_in = total_cash_in - (final_loan - repay_bridge)
roi_24m = (net_cashflow_24m / net_cash_left_in) × 100
dscr_month1 = (rent - opex) / btl_payment
```

## Unit Correctness

### Percent vs Decimal
**CRITICAL**: All percentages are stored as decimals internally.

```typescript
// ✅ CORRECT
management_pct: 0.10  // 10%
voids_pct: 0.05       // 5%
monthly_opex = rent × (management_pct + voids_pct)
// = 1000 × (0.10 + 0.05) = £150

// ❌ WRONG (double-applying %)
monthly_opex = rent × ((management_pct / 100) + (voids_pct / 100))
// = 1000 × (0.10/100 + 0.05/100) = £1.50 ⚠️
```

### Maintenance Modes
```typescript
// Mode 1: % of value pa
maintenance_monthly = (property_value × maintenance_pct) / 12
// e.g., (250000 × 0.01) / 12 = £208.33/mo

// Mode 2: Direct £/mo
maintenance_monthly = maintenance_gbp_per_month
// e.g., £150/mo (exact input, no % applied)
```

### DSCR Target
Fixed at **1.20** (lender standard). The cap ensures:
```typescript
monthly_btl_payment ≤ (rent - opex) / 1.20
```

## Testing

Run the comprehensive test suite:
```bash
npm test src/lib/__tests__/financeCore.test.ts
```

**Test Coverage:**
- ✅ Percent vs decimal conversion
- ✅ Maintenance mode toggle
- ✅ Months rented = max(0, term - refurb_months)
- ✅ DSCR cap math (with and without fee in loan)
- ✅ Override propagation
- ✅ 24-month growth calculations
- ✅ Edge cases (zero rent, zero refurb, high LTV)

## Usage

### For Users
1. Navigate to `/demo` page
2. Scroll to "Investor Analysis" section
3. Adjust any slider
4. Watch **all** KPIs update instantly
5. Click "Reset to Baseline" to undo changes
6. Click "Save Scenario" to persist (TODO: implement DB save)

### For Developers

#### Adding a New Control
1. Add field to `ScenarioOverrides` type in `financeCore.ts`
2. Update `mergeOverrides()` to handle new field
3. Update calculation logic in `recomputeKPIs()`
4. Add slider in `InvestorScenarios.tsx`
5. Add tests in `financeCore.test.ts`

#### Example: Adding "Legal Fees" Override
```typescript
// 1. Add to ScenarioOverrides
export type ScenarioOverrides = {
  // ... existing fields
  legal_fees_gbp?: number;
};

// 2. Update mergeOverrides
function mergeOverrides(baseline, overrides) {
  return {
    ...baseline,
    legal_fees_gbp: overrides.legal_fees_gbp ?? baseline.legal_fees_gbp,
  };
}

// 3. Use in calculations (already included in total_cash_in)
// No change needed - legal_fees_gbp is already in the formula

// 4. Add slider
<Slider
  label="Legal Fees"
  value={overrides.legal_fees_gbp ?? baseline.legal_fees_gbp}
  min={0}
  max={5000}
  step={100}
  onChange={(v) => updateOverride('legal_fees_gbp', v)}
  baseline={baseline.legal_fees_gbp}
  format="money"
/>

// 5. Add test
it('should apply legal fees override', () => {
  const baseline = createBaseline({ legal_fees_gbp: 1000 });
  const overrides = { legal_fees_gbp: 1500 };
  const kpis = recomputeKPIs(baseline, overrides);
  expect(kpis.total_cash_in_gbp).toBeGreaterThan(baseline.legal_fees_gbp + 1500);
});
```

## Data Flow

```
Backend Payload
     ↓
buildBaselineFromPayload()
     ↓
ScenarioBaseline (immutable)
     ↓
User adjusts slider → ScenarioOverrides (state)
     ↓
mergeOverrides(baseline, overrides)
     ↓
recomputeKPIs() - SINGLE SOURCE OF TRUTH
     ↓
ComputedKPIs (memoized)
     ↓
UI displays all metrics
```

## No Backend Changes

**IMPORTANT**: This implementation requires **zero changes** to backend schemas or node outputs.

- Baseline data is extracted from existing payload structure
- Overrides are stored client-side only (in React state)
- Optional: Save to `analysis_scenarios` table for persistence (TODO)

## Performance

- **Debounce**: 250ms delay after slider stops moving
- **Memoization**: `useMemo` prevents unnecessary recalculations
- **Pure functions**: Easy to optimize and test
- **No API calls**: Instant feedback

## Future Enhancements

### Planned
- [ ] Save scenarios to `analysis_scenarios` table
- [ ] Compare multiple scenarios side-by-side
- [ ] Export scenario as PDF
- [ ] Share scenario via URL
- [ ] Undo/redo support
- [ ] Preset templates (e.g., "Conservative", "Aggressive")

### Advanced Features
- [ ] Monte Carlo simulation (risk analysis)
- [ ] Sensitivity analysis (tornado charts)
- [ ] Custom exit strategies (e.g., hold 5 years)
- [ ] Multiple property portfolio analysis
- [ ] Tax calculations (CGT, income tax)

## Troubleshooting

### KPIs Not Updating
1. Check browser console for errors
2. Verify `payload` prop is valid in `InvestorScenarios`
3. Ensure `recomputeKPIs()` is being called (add console.log)
4. Check if `useMemo` dependencies are correct

### Incorrect Calculations
1. Run unit tests: `npm test financeCore.test.ts`
2. Check if percentages are in decimal form (not 10 instead of 0.10)
3. Verify DSCR cap is working (should never allow DSCR < 1.20)
4. Check maintenance mode toggle is working correctly

### Performance Issues
1. Reduce debounce timeout (currently 250ms)
2. Check for unnecessary re-renders (use React DevTools)
3. Ensure `useMemo` is used for expensive calculations
4. Consider throttling instead of debouncing for real-time feel

## Support

For questions or issues, please contact the development team or open a GitHub issue.

## License

Proprietary - PropertyScout UI
