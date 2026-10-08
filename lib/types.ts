export interface Report1Item {
  status?: 'sold' | 'stock';  // missing on legacy docs → treated as sold
  tagNo: string;
  stockDate?: string;  // date the piece entered stock (dd/mm/yyyy)
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
  fineGoldWeight?: number;
  batch?: string;
  batchIntroDate?: string;
  notes?: string;
  status: 'sold' | 'pending';
  months: MonthRow[];
  totalMsShare: number;
  totalSgShare: number;
  totalOperatingCost: number;
}

export interface BatchSummary {
  batch: string;
  introDate: string;
  totalItems: number;
  totalFineGoldWeight: number;
  soldItems: number;
  inStock: number;
  soldFineGoldWeight: number;
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
    stockCount: number;
    stockWeight: number;
  };
  report2: {
    items: Report2Item[];
    sold: Report2Item[];
    pending: Report2Item[];
    totals: { operatingCost: number; msShare: number; sgShare: number; labourSharableProfit: number };
    batchSummary: BatchSummary[];
    totalPieces: number;
    soldPieces: number;
    inStock: number;
    totalFineGoldWeight: number;
  };
  report3: {
    months: MonthRow[];
    totals: { operatingCost: number; msShare: number; sgShare: number; labourSharableProfit: number };
    initialGoldWeight: number;
  };
}
