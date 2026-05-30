import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { dbConnect } from '@/lib/db';
import { Report3Model } from '@/lib/models';
import { getSessionFromRequest } from '@/lib/auth';
import { recalcMonths, monthLabel } from '@/lib/calculations';

async function guard(req: NextRequest) {
  const s = await getSessionFromRequest(req);
  if (!s || s.role !== 'admin') return null;
  return s;
}

export async function POST(req: NextRequest) {
  if (!await guard(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { monthYM, goldRate24K } = await req.json();
  if (!monthYM || !goldRate24K) {
    return NextResponse.json({ error: 'monthYM and goldRate24K are required.' }, { status: 400 });
  }

  await dbConnect();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let doc = await (Report3Model as any).findOne({}).lean() as Record<string, unknown> | null;
  if (!doc) {
    return NextResponse.json({ error: 'Report 3 not initialised. Set initial gold weight first.' }, { status: 404 });
  }

  const existing = (doc.months as Array<{ month: string; goldRate24K: number }>) ?? [];
  const newMonths = [...existing, { month: monthLabel(monthYM), goldRate24K: Number(goldRate24K) }];
  const recalculated = recalcMonths(newMonths, doc.initialGoldWeight as number);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  doc = await (Report3Model as any).findByIdAndUpdate(
    (doc as { _id: unknown })._id,
    { months: recalculated },
    { new: true },
  ).lean();

  return NextResponse.json({ ok: true, doc });
}
