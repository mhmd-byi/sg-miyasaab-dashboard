import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { Report1Model } from '@/lib/models';
import type { Report1Item } from '@/lib/types';

const EMPTY_TOTALS = { goldSellPrice: 0, labourProfitCharged: 0, labourSharableProfit: 0, operatingCost: 0, msShare: 0, sgShare: 0 };

export async function GET() {
  try {
    await dbConnect();
    const items: Report1Item[] = await Report1Model.find({}).select('-_id').lean().exec();

    // Legacy docs have no status → sold. Stock rows carry no profit and stay out of totals.
    const sold = items.filter(i => i.status !== 'stock');
    const stock = items.filter(i => i.status === 'stock');

    const totals = {
      goldSellPrice: sold.reduce((s, i) => s + i.goldSellPrice, 0),
      labourProfitCharged: sold.reduce((s, i) => s + i.labourProfitCharged, 0),
      labourSharableProfit: sold.reduce((s, i) => s + i.labourSharableProfit, 0),
      operatingCost: sold.reduce((s, i) => s + i.operatingCost, 0),
      msShare: sold.reduce((s, i) => s + i.msShare, 0),
      sgShare: sold.reduce((s, i) => s + i.sgShare, 0),
    };

    return NextResponse.json({
      items,
      totals,
      stockCount: stock.length,
      stockWeight: stock.reduce((s, i) => s + i.goldWeightG, 0),
    });
  } catch (err) {
    console.error('[report1]', err);
    return NextResponse.json({ items: [], totals: EMPTY_TOTALS, stockCount: 0, stockWeight: 0 }, { status: 500 });
  }
}
