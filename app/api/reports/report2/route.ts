import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { Report2Model } from '@/lib/models';
import type { Report2Item, BatchSummary } from '@/lib/types';

export async function GET() {
  try {
    await dbConnect();
    const items: Report2Item[] = await Report2Model.find({}).select('-_id').lean().exec();

    const sold = items.filter(i => i.status === 'sold');
    const pending = items.filter(i => i.status === 'pending');

    const labourSharableProfit = items.reduce(
      (s, i) => s + i.totalOperatingCost + i.totalMsShare + i.totalSgShare,
      0,
    );

    const totals = {
      operatingCost: items.reduce((s, i) => s + i.totalOperatingCost, 0),
      msShare: items.reduce((s, i) => s + i.totalMsShare, 0),
      sgShare: items.reduce((s, i) => s + i.totalSgShare, 0),
      labourSharableProfit,
    };

    // Batch-wise summary — group items by batch name
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
      // Use earliest batchIntroDate as the batch date
      if (!b.introDate && item.batchIntroDate) b.introDate = item.batchIntroDate;
    }

    const batchSummary = Array.from(batchMap.values()).sort((a, b) => a.batch.localeCompare(b.batch));

    return NextResponse.json({
      items,
      sold,
      pending,
      totals,
      batchSummary,
      totalPieces: items.length,
      soldPieces: sold.length,
      inStock: pending.length,
      totalFineGoldWeight: items.reduce((s, i) => s + (i.fineGoldWeight ?? i.initialGoldWeight ?? 0), 0),
    });
  } catch (err) {
    console.error('[report2]', err);
    return NextResponse.json(
      {
        items: [],
        sold: [],
        pending: [],
        totals: { operatingCost: 0, msShare: 0, sgShare: 0, labourSharableProfit: 0 },
        batchSummary: [],
        totalPieces: 0,
        soldPieces: 0,
        inStock: 0,
        totalFineGoldWeight: 0,
      },
      { status: 500 },
    );
  }
}
