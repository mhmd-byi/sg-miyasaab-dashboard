import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { dbConnect } from '@/lib/db';
import { Report2Model } from '@/lib/models';
import { getSessionFromRequest } from '@/lib/auth';
import { recalcMonths } from '@/lib/calculations';

async function guard(req: NextRequest) {
  const s = await getSessionFromRequest(req);
  if (!s || s.role !== 'admin') return null;
  return s;
}

type Ctx = { params: Promise<{ id: string; idx: string }> };

function sumTotals(months: { msShare: number; sgShare: number; operatingCost: number }[]) {
  return months.reduce(
    (s, m) => ({ msShare: s.msShare + m.msShare, sgShare: s.sgShare + m.sgShare, operatingCost: s.operatingCost + m.operatingCost }),
    { msShare: 0, sgShare: 0, operatingCost: 0 },
  );
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  if (!await guard(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id, idx } = await params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  const monthIdx = Number(idx);

  const { goldRate24K } = await req.json();

  await dbConnect();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const item = await (Report2Model as any).findById(id).lean() as Record<string, unknown>;
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const months = (item.months as Array<{ month: string; goldRate24K: number }>) ?? [];
  if (monthIdx < 0 || monthIdx >= months.length) return NextResponse.json({ error: 'Index out of range' }, { status: 400 });

  months[monthIdx] = { ...months[monthIdx], goldRate24K: Number(goldRate24K) };
  const recalculated = recalcMonths(months, item.initialGoldWeight as number, monthIdx);
  const totals = sumTotals(recalculated);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updated = await (Report2Model as any).findByIdAndUpdate(
    id,
    { months: recalculated, totalMsShare: totals.msShare, totalSgShare: totals.sgShare, totalOperatingCost: totals.operatingCost },
    { new: true },
  ).lean();

  return NextResponse.json({ ok: true, item: updated });
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  if (!await guard(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id, idx } = await params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  const monthIdx = Number(idx);

  await dbConnect();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const item = await (Report2Model as any).findById(id).lean() as Record<string, unknown>;
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const months = [...((item.months as Array<{ month: string; goldRate24K: number }>) ?? [])];
  months.splice(monthIdx, 1);

  const recalculated = months.length > 0
    ? recalcMonths(months, item.initialGoldWeight as number)
    : [];
  const totals = sumTotals(recalculated);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updated = await (Report2Model as any).findByIdAndUpdate(
    id,
    { months: recalculated, totalMsShare: totals.msShare, totalSgShare: totals.sgShare, totalOperatingCost: totals.operatingCost },
    { new: true },
  ).lean();

  return NextResponse.json({ ok: true, item: updated });
}
