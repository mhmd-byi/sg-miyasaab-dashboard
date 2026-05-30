import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { dbConnect } from '@/lib/db';
import { Report3Model } from '@/lib/models';
import { getSessionFromRequest } from '@/lib/auth';

async function guard(req: NextRequest) {
  const s = await getSessionFromRequest(req);
  if (!s || s.role !== 'admin') return null;
  return s;
}

export async function GET(req: NextRequest) {
  if (!await guard(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  await dbConnect();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = await (Report3Model as any).findOne({}).lean();
  return NextResponse.json({ doc: doc ?? { initialGoldWeight: 0, months: [] } });
}

// PATCH: update initialGoldWeight only (triggers full month recalculation)
export async function PATCH(req: NextRequest) {
  if (!await guard(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { initialGoldWeight } = await req.json();
  if (initialGoldWeight === undefined) return NextResponse.json({ error: 'initialGoldWeight required' }, { status: 400 });

  const { recalcMonths } = await import('@/lib/calculations');

  await dbConnect();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let doc = await (Report3Model as any).findOne({}).lean() as Record<string, unknown> | null;

  const newWeight = Number(initialGoldWeight);
  const months = (doc?.months as Array<{ month: string; goldRate24K: number }>) ?? [];
  const recalculated = months.length > 0 ? recalcMonths(months, newWeight) : [];

  if (doc) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    doc = await (Report3Model as any).findByIdAndUpdate(
      (doc as { _id: unknown })._id,
      { initialGoldWeight: newWeight, months: recalculated },
      { new: true },
    ).lean();
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    doc = await (Report3Model as any).create({ initialGoldWeight: newWeight, months: [] });
  }

  return NextResponse.json({ ok: true, doc });
}
