import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import type { DashboardData, Report1Item, MonthRow, Report2Item, BatchSummary } from './types';

const EXCEL_FILE = path.join(process.cwd(), 'miyaa_saab_dashboard 3005261325.xlsx');

function readWorkbook(): XLSX.WorkBook {
  const buf = fs.readFileSync(EXCEL_FILE);
  return XLSX.read(buf, { cellDates: true });
}

// ── helpers ─────────────────────────────────────────────────────────────────

function n(v: unknown): number {
  if (v === null || v === undefined || v === '') return 0;
  const num = Number(v);
  return isNaN(num) ? 0 : Math.round(num * 100) / 100;
}

function n3(v: unknown): number {
  if (v === null || v === undefined || v === '') return 0;
  const num = Number(v);
  return isNaN(num) ? 0 : Math.round(num * 1000) / 1000;
}

function toDate(v: unknown): Date | null {
  if (!v) return null;
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
  // Excel serial date: days since 1900-01-01 (with Lotus 1-2-3 leap year bug)
  if (typeof v === 'number' && v > 1 && v < 100000) {
    const utc = (v - 25569) * 86400 * 1000;
    const d = new Date(utc);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function dateStr(v: unknown): string {
  const d = toDate(v);
  if (!d) return '';
  const day = d.getUTCDate().toString().padStart(2, '0');
  const mon = (d.getUTCMonth() + 1).toString().padStart(2, '0');
  return `${day}/${mon}/${d.getUTCFullYear()}`;
}

function monthLabel(v: unknown): string {
  const d = toDate(v);
  if (!d) return '';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function buildMonthRow(row: unknown[]): MonthRow {
  return {
    month: monthLabel(row[5]),
    cumulativeGoldWeight: n3(row[6]),
    salesPM: n3(row[7]),
    goldRate24K: n(row[8]),
    labourCostPrice: n3(row[10]),
    labourCostCharged: n(row[11]),
    labourSellPrice: n(row[12]),
    labourProfitCharged: n(row[13]),
    labourSharableProfit: n(row[14]),
    operatingCost: n(row[15]),
    msShare: n(row[16]),
    sgShare: n(row[17]),
    msProfitInGold: n3(row[18]),
  };
}

// ── Report 1: Ornaments Sold ─────────────────────────────────────────────────
// Structure: Row 0 = headers, Rows 1–N = items (TAG starts with letter),
//            last row = TOTAL (col A is null or 'TOTAL')

function parseReport1() {
  const wb = readWorkbook();
  const ws = wb.Sheets['P&L REPORT 1'];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null });

  const items: Report1Item[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] as unknown[];
    const tagNo = row[0];
    if (!tagNo || typeof tagNo !== 'string') continue;
    const upper = tagNo.toUpperCase();
    if (upper.includes('TAG') || upper.includes('TOTAL')) continue;
    items.push({
      tagNo,
      salesDate: dateStr(row[1]),
      goldWeightG: n3(row[2]),
      goldRate22K: n(row[3]),
      purity: n(row[4]),
      labourCostPrice: n(row[5]),
      labourCostCharged: n(row[6]),
      goldSellPrice: n(row[7]),
      labourProfitCharged: n(row[8]),
      labourSharableProfit: n(row[9]),
      operatingCost: n(row[10]),
      msShare: n(row[11]),
      sgShare: n(row[12]),
    });
  }

  const sum = (key: keyof Report1Item) => items.reduce((s, i) => s + (i[key] as number), 0);

  return {
    items,
    totals: {
      goldSellPrice: sum('goldSellPrice'),
      labourProfitCharged: sum('labourProfitCharged'),
      labourSharableProfit: sum('labourSharableProfit'),
      operatingCost: sum('operatingCost'),
      msShare: sum('msShare'),
      sgShare: sum('sgShare'),
    },
  };
}

// ── Report 2: Ornaments + Inventory ─────────────────────────────────────────
// Structure: Row 0 = config, Row 1 = global header,
//            then blocks: [sub-header?] + [item row: colA=number] + [12 monthly rows: colA=null]

function parseReport2() {
  const wb = readWorkbook();
  const ws = wb.Sheets['P&L REPORT 2'];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null });

  const items: Report2Item[] = [];
  let current: Report2Item | null = null;

  for (let i = 2; i < rows.length; i++) {
    const row = rows[i] as unknown[];
    const colA = row[0];
    const colB = row[1];

    // Skip sub-header rows: colB is text containing 'TAG'
    if (typeof colB === 'string' && colB.toUpperCase().trim() === 'TAG NO') continue;

    // New item row: colA is a number (Sr. No)
    const srNo = Number(colA);
    if (colA !== null && colA !== '' && !isNaN(srNo) && srNo > 0) {
      if (current) items.push(current);
      const mr = buildMonthRow(row);
      current = {
        srNo,
        tagNo: String(colB ?? ''),
        salesDate: dateStr(row[2]),
        purity: String(row[9] ?? row[3] ?? '22'),
        initialGoldWeight: n3(row[4]),
        status: n3(row[4]) > 0 ? 'sold' : 'pending',
        months: mr.month ? [mr] : [],
        totalMsShare: mr.msShare,
        totalSgShare: mr.sgShare,
        totalOperatingCost: mr.operatingCost,
      };
      continue;
    }

    // Monthly continuation row: colA is null, colF (index 5) is a date
    if (current) {
      const colF = row[5];
      const isDate = colF instanceof Date || (typeof colF === 'number' && colF > 1 && colF < 100000);
      if (isDate) {
        const mr = buildMonthRow(row);
        if (mr.month) {
          current.months.push(mr);
          current.totalMsShare += mr.msShare;
          current.totalSgShare += mr.sgShare;
          current.totalOperatingCost += mr.operatingCost;
        }
      }
    }
  }
  if (current) items.push(current);

  const sold = items.filter(i => i.status === 'sold');
  const pending = items.filter(i => i.status === 'pending');

  const batchMap = new Map<string, BatchSummary>();
  for (const item of items) {
    const key = item.batch || 'Unassigned';
    if (!batchMap.has(key)) {
      batchMap.set(key, {
        batch: key,
        introDate: item.batchIntroDate || '',
        totalItems: 0,
        totalFineGoldWeight: 0,
        soldItems: 0,
        inStock: 0,
        soldFineGoldWeight: 0,
      });
    }
    const b = batchMap.get(key)!;
    b.totalItems += 1;
    b.totalFineGoldWeight += item.fineGoldWeight ?? item.initialGoldWeight ?? 0;
    if (item.status === 'sold') {
      b.soldItems += 1;
      b.soldFineGoldWeight += item.fineGoldWeight ?? item.initialGoldWeight ?? 0;
    } else {
      b.inStock += 1;
    }
    if (!b.introDate && item.batchIntroDate) b.introDate = item.batchIntroDate;
  }
  const batchSummary = Array.from(batchMap.values()).sort((a, b) => a.batch.localeCompare(b.batch));

  return {
    items,
    sold,
    pending,
    totals: {
      operatingCost: items.reduce((s, i) => s + i.totalOperatingCost, 0),
      msShare: items.reduce((s, i) => s + i.totalMsShare, 0),
      sgShare: items.reduce((s, i) => s + i.totalSgShare, 0),
      labourSharableProfit: items.reduce(
        (s, i) => s + i.totalOperatingCost + i.totalMsShare + i.totalSgShare,
        0,
      ),
    },
    batchSummary,
    totalPieces: items.length,
    soldPieces: sold.length,
    inStock: pending.length,
    totalFineGoldWeight: items.reduce((s, i) => s + (i.fineGoldWeight ?? i.initialGoldWeight ?? 0), 0),
  };
}

// ── Report 3: Pure Gold ───────────────────────────────────────────────────────
// Structure: Row 0 = config, Row 1 = headers, Rows 2–13 = monthly data, Row 14 = totals

function parseReport3() {
  const wb = readWorkbook();
  const ws = wb.Sheets['P&L REPORT 3'];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null });

  const months: MonthRow[] = [];
  let initialGoldWeight = 0;

  for (let i = 2; i < rows.length; i++) {
    const row = rows[i] as unknown[];
    const colF = row[5];
    const isDate = colF instanceof Date || (typeof colF === 'number' && colF > 1 && colF < 100000);
    if (!isDate) continue;

    if (i === 2) initialGoldWeight = n3(row[4]);
    const mr = buildMonthRow(row);
    if (mr.month) months.push(mr);
  }

  return {
    months,
    totals: {
      operatingCost: months.reduce((s, m) => s + m.operatingCost, 0),
      msShare: months.reduce((s, m) => s + m.msShare, 0),
      sgShare: months.reduce((s, m) => s + m.sgShare, 0),
      labourSharableProfit: months.reduce((s, m) => s + m.labourSharableProfit, 0),
    },
    initialGoldWeight,
  };
}

// ── Public entry point ───────────────────────────────────────────────────────

export function parseAllReports(): DashboardData {
  return {
    report1: { ...parseReport1(), stockCount: 0, stockWeight: 0 },
    report2: parseReport2(),
    report3: parseReport3(),
  };
}
