import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { Report3Model } from '@/lib/models';
import type { MonthRow } from '@/lib/types';

export async function GET() {
  try {
    await dbConnect();
    const doc = await Report3Model.findOne({}).select('-_id').lean().exec() as
      | { initialGoldWeight: number; months: MonthRow[] }
      | null;

    if (!doc) {
      return NextResponse.json({ months: [], totals: { operatingCost: 0, msShare: 0, sgShare: 0, labourSharableProfit: 0 }, initialGoldWeight: 0 });
    }

    const { months, initialGoldWeight } = doc;
    const totals = {
      operatingCost: months.reduce((s, m) => s + m.operatingCost, 0),
      msShare: months.reduce((s, m) => s + m.msShare, 0),
      sgShare: months.reduce((s, m) => s + m.sgShare, 0),
      labourSharableProfit: months.reduce((s, m) => s + m.labourSharableProfit, 0),
    };

    return NextResponse.json({ months, totals, initialGoldWeight });
  } catch (err) {
    console.error('[report3]', err);
    return NextResponse.json({ months: [], totals: { operatingCost: 0, msShare: 0, sgShare: 0, labourSharableProfit: 0 }, initialGoldWeight: 0 }, { status: 500 });
  }
}
