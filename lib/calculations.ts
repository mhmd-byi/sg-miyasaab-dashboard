import type { MonthRow } from './types';

// Precision helper
const r2 = (v: number) => Math.round(v * 100) / 100;
const r3 = (v: number) => Math.round(v * 1000) / 1000;

// ── Report 1: Ornaments Sold ─────────────────────────────────────────────────
// Manual inputs: goldWeightG, goldRate22K, labourRatePct (%), labourCostCharged
// Everything else is calculated.

export function calcR1(
  goldWeightG: number,
  goldRate22K: number,
  labourRatePct: number,
  labourCostCharged = 0,
) {
  const goldSellPrice = r2(goldWeightG * goldRate22K);
  const labourProfitCharged = r2(goldSellPrice * labourRatePct / 100);
  const labourSharableProfit = r2(labourProfitCharged - labourCostCharged);
  const operatingCost = r2(labourSharableProfit * 0.15);
  const net = r2(labourSharableProfit - operatingCost);
  return {
    goldSellPrice,
    labourProfitCharged,
    labourSharableProfit,
    operatingCost,
    msShare: r2(net * 0.60),
    sgShare: r2(net * 0.40),
  };
}

// ── Reports 2 & 3: Monthly rows ──────────────────────────────────────────────
// Manual input per month: goldRate24K
// cumulativeGoldWeight is derived from chain (see recalcMonths)

const SALES_RATE = 0.07;   // 7% of gold sold per month (H1 global constant)
const PURITY    = 0.92;    // 92% purity conversion
const COST_RATE = 0.97;    // 97% cost basis
const LABOUR_PCT = 0.11;   // 11% labour profit on sell price

export function calcMonthRow(cumulativeGoldWeight: number, goldRate24K: number) {
  const salesPM = r3(cumulativeGoldWeight * SALES_RATE);
  const labourCostPrice = r3(salesPM * COST_RATE);
  const labourCostCharged = r2((labourCostPrice - salesPM * PURITY) * goldRate24K);
  const labourSellPrice = r2(goldRate24K * PURITY * salesPM);
  const labourProfitCharged = r2(labourSellPrice * LABOUR_PCT);
  const labourSharableProfit = r2(labourProfitCharged - labourCostCharged);
  const operatingCost = r2(labourSharableProfit * 0.15);
  const net = r2(labourSharableProfit - operatingCost);
  const msShare = r2(net * 0.60);
  const sgShare = r2(net * 0.40);
  const msProfitInGold = goldRate24K > 0 ? r3(msShare * PURITY / goldRate24K) : 0;
  return {
    salesPM, labourCostPrice, labourCostCharged,
    labourSellPrice, labourProfitCharged, labourSharableProfit,
    operatingCost, msShare, sgShare, msProfitInGold,
  };
}

// Recalculate an entire months array from a given index onward.
// Keeps month labels and goldRate24K; recalculates everything else.
export function recalcMonths(
  months: Array<{ month: string; goldRate24K: number }>,
  initialGoldWeight: number,
  fromIndex = 0,
  existingResult: MonthRow[] = [],
): MonthRow[] {
  const result: MonthRow[] = [...existingResult.slice(0, fromIndex)];

  for (let i = fromIndex; i < months.length; i++) {
    const prevCumulative =
      i === 0
        ? initialGoldWeight
        : r3(result[i - 1].cumulativeGoldWeight + result[i - 1].msProfitInGold);

    result.push({
      month: months[i].month,
      cumulativeGoldWeight: prevCumulative,
      goldRate24K: months[i].goldRate24K,
      ...calcMonthRow(prevCumulative, months[i].goldRate24K),
    });
  }
  return result;
}

// Month label from a YYYY-MM string  e.g. "2025-04" → "Apr 2025"
export function monthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  const names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${names[m - 1]} ${y}`;
}

// Derive labour rate % from existing data (for pre-filling edit form on seeded data)
export function inferLabourRatePct(goldSellPrice: number, labourProfitCharged: number): number {
  if (!goldSellPrice) return 0;
  return Math.round((labourProfitCharged / goldSellPrice) * 10000) / 100; // 2 decimals
}
