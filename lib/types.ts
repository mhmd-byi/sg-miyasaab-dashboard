export interface Report1Item {
  tagNo: string;
  salesDate: string;
  goldWeightG: number;
  goldRate22K: number;
  purity: number;
  labourRatePct?: number;  // manual per-item %, e.g. 7 or 11 (optional for seeded data)
  labourCostPrice: number;
  labourCostCharged: number;
  goldSellPrice: number;
  labourProfitCharged: number;
  labourSharableProfit: number;
  operatingCost: number;
  msShare: number;
  sgShare: number;
}

export interface MonthRow {
  month: string;
  cumulativeGoldWeight: number;
  salesPM: number;
  goldRate24K: number;
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

export interface Report2Item {
  srNo: number;
  tagNo: string;
  salesDate: string;
  purity: string;
  initialGoldWeight: number;
  status: 'sold' | 'pending';
  months: MonthRow[];
  totalMsShare: number;
  totalSgShare: number;
  totalOperatingCost: number;
}

export interface DashboardData {
  report1: {
    items: Report1Item[];
    totals: {
      goldSellPrice: number;
      labourProfitCharged: number;
      labourSharableProfit: number;
      operatingCost: number;
      msShare: number;
      sgShare: number;
    };
  };
  report2: {
    items: Report2Item[];
    sold: Report2Item[];
    pending: Report2Item[];
    totals: { operatingCost: number; msShare: number; sgShare: number };
  };
  report3: {
    months: MonthRow[];
    totals: { operatingCost: number; msShare: number; sgShare: number };
    initialGoldWeight: number;
  };
}
