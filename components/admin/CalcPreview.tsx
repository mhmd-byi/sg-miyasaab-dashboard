'use client';

import { fmt, fmtGold, fmtRate } from '@/lib/utils';

interface R1Calc {
  goldSellPrice: number;
  labourProfitCharged: number;
  labourSharableProfit: number;
  operatingCost: number;
  msShare: number;
  sgShare: number;
}

interface MonthCalc {
  salesPM: number;
  labourCostPrice: number;
  labourCostCharged: number;
  labourSellPrice: number;
  labourProfitCharged: number;
  labourSharableProfit: number;
  operatingCost: number;
  msShare: number;
  sgShare: number;
  msProfitInGold: number;
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-zinc-100 last:border-0">
      <span className="text-xs text-zinc-500">{label}</span>
      <span className={`text-sm font-semibold ${accent ? 'text-amber-700' : 'text-zinc-700'}`}>
        {value}
      </span>
    </div>
  );
}

export function R1CalcPreview({ calc }: { calc: R1Calc }) {
  return (
    <div className="bg-amber-50/60 rounded-xl border border-amber-100 p-4 space-y-0.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-2">
        Calculated Fields (auto)
      </p>
      <Row label="Gold Sell Price" value={fmt(calc.goldSellPrice)} />
      <Row label="Labour Profit Charged" value={fmt(calc.labourProfitCharged)} />
      <Row label="Sharable Profit" value={fmt(calc.labourSharableProfit)} />
      <Row label="Operating Cost (15%)" value={fmt(calc.operatingCost)} />
      <Row label="MS Share (60%)" value={fmt(calc.msShare)} accent />
      <Row label="SG Share (40%)" value={fmt(calc.sgShare)} />
    </div>
  );
}

export function MonthCalcPreview({
  calc,
  cumulativeGoldWeight,
}: {
  calc: MonthCalc;
  cumulativeGoldWeight: number;
}) {
  return (
    <div className="bg-amber-50/60 rounded-xl border border-amber-100 p-4 space-y-0.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-2">
        Calculated Fields (auto)
      </p>
      <Row label="Cumulative Gold (g)" value={fmtGold(cumulativeGoldWeight)} />
      <Row label="Sales PM (g)" value={fmtGold(calc.salesPM)} />
      <Row label="Labour Sell Price" value={fmtRate(calc.labourSellPrice)} />
      <Row label="Labour Profit Charged" value={fmt(calc.labourProfitCharged)} />
      <Row label="Labour Cost Charged" value={fmt(calc.labourCostCharged)} />
      <Row label="Sharable Profit" value={fmt(calc.labourSharableProfit)} />
      <Row label="Operating Cost (15%)" value={fmt(calc.operatingCost)} />
      <Row label="MS Share (60%)" value={fmt(calc.msShare)} accent />
      <Row label="SG Share (40%)" value={fmt(calc.sgShare)} />
      <Row label="MS Profit in Gold (g)" value={fmtGold(calc.msProfitInGold)} />
    </div>
  );
}
