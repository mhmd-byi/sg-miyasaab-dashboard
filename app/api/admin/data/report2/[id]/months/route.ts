import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { dbConnect } from '@/lib/db';
import { Report2Model } from '@/lib/models';
import { getSessionFromRequest } from '@/lib/auth';
import { recalcMonths, monthLabel } from '@/lib/calculations';

async function guard(req: NextRequest) {
  const s = await getSessionFromRequest(req);
  if (!s || s.role !== 'admin') return null;
  return s;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await guard(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const { monthYM, goldRate24K } = await req.json();
  if (!monthYM || !goldRate24K) {
    return NextResponse.json({ error: 'monthYM and goldRate24K are required.' }, { status: 400 });
  }

  await dbConnect();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const item = await (Report2Model as any).findById(id).lean() as Record<string, unknown>;
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const existingMonths = (item.months as Array<{ month: string; goldRate24K: number }>) ?? [];
  const newMonths = [...existingMonths, { month: monthLabel(monthYM), goldRate24K: Number(goldRate24K) }];
  const recalculated = recalcMonths(newMonths, item.initialGoldWeight as number);

  const totals = recalculated.reduce(
    (s, m) => ({ msShare: s.msShare + m.msShare, sgShare: s.sgShare + m.sgShare, operatingCost: s.operatingCost + m.operatingCost }),
    { msShare: 0, sgShare: 0, operatingCost: 0 },
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updated = await (Report2Model as any).findByIdAndUpdate(
    id,
    { months: recalculated, totalMsShare: totals.msShare, totalSgShare: totals.sgShare, totalOperatingCost: totals.operatingCost },
    { new: true },
  ).lean();

  return NextResponse.json({ ok: true, item: updated });
}
