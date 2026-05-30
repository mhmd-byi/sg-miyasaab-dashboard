import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { Report1Model, Report2Model, Report3Model } from '@/lib/models';
import { parseAllReports } from '@/lib/excel';

export async function POST() {
  try {
    await dbConnect();
    const { report1, report2, report3 } = parseAllReports();

    // Wipe and reseed all three collections
    await Promise.all([
      Report1Model.deleteMany({}),
      Report2Model.deleteMany({}),
      Report3Model.deleteMany({}),
    ]);

    await Promise.all([
      Report1Model.insertMany(report1.items),
      Report2Model.insertMany(report2.items),
      Report3Model.create({ initialGoldWeight: report3.initialGoldWeight, months: report3.months }),
    ]);

    return NextResponse.json({
      ok: true,
      seeded: {
        report1: report1.items.length,
        report2: report2.items.length,
        report3: report3.months.length,
      },
    });
  } catch (err) {
    console.error('[seed]', err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
