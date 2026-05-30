import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { Report1Model } from '@/lib/models';
import type { Report1Item } from '@/lib/types';

export async function GET() {
  try {
    await dbConnect();
    const items: Report1Item[] = await Report1Model.find({}).select('-_id').lean().exec();

    const totals = {
      goldSellPrice: items.reduce((s, i) => s + i.goldSellPrice, 0),
      labourProfitCharged: items.reduce((s, i) => s + i.labourProfitCharged, 0),
      labourSharableProfit: items.reduce((s, i) => s + i.labourSharableProfit, 0),
      operatingCost: items.reduce((s, i) => s + i.operatingCost, 0),
      msShare: items.reduce((s, i) => s + i.msShare, 0),
      sgShare: items.reduce((s, i) => s + i.sgShare, 0),
    };

    return NextResponse.json({ items, totals });
  } catch (err) {
    console.error('[report1]', err);
    return NextResponse.json({ items: [], totals: { goldSellPrice: 0, labourProfitCharged: 0, labourSharableProfit: 0, operatingCost: 0, msShare: 0, sgShare: 0 } }, { status: 500 });
  }
}
