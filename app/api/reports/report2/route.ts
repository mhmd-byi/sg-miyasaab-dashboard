import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { Report2Model } from '@/lib/models';
import type { Report2Item } from '@/lib/types';

export async function GET() {
  try {
    await dbConnect();
    const items: Report2Item[] = await Report2Model.find({}).select('-_id').lean().exec();

    const sold = items.filter(i => i.status === 'sold');
    const pending = items.filter(i => i.status === 'pending');

    const totals = {
      operatingCost: items.reduce((s, i) => s + i.totalOperatingCost, 0),
      msShare: items.reduce((s, i) => s + i.totalMsShare, 0),
      sgShare: items.reduce((s, i) => s + i.totalSgShare, 0),
    };

    return NextResponse.json({ items, sold, pending, totals });
  } catch (err) {
    console.error('[report2]', err);
    return NextResponse.json({ items: [], sold: [], pending: [], totals: { operatingCost: 0, msShare: 0, sgShare: 0 } }, { status: 500 });
  }
}
