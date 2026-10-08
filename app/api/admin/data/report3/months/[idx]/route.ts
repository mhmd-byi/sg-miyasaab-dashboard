import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { dbConnect } from '@/lib/db';
import { Report3Model } from '@/lib/models';
import { getSessionFromRequest } from '@/lib/auth';
import { recalcMonths } from '@/lib/calculations';

async function guard(req: NextRequest) {
  const s = await getSessionFromRequest(req);
  if (!s || s.role !== 'admin') return null;
  return s;
}

type Ctx = { params: Promise<{ idx: string }> };

export async function PUT(req: NextRequest, { params }: Ctx) {
  if (!await guard(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { idx } = await params;
  const monthIdx = Number(idx);
  const { goldRate24K } = await req.json();

  await dbConnect();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = await (Report3Model as any).findOne({}).lean() as Record<string, unknown> | null;
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const months = [...((doc.months as Array<{ month: string; goldRate24K: number }>) ?? [])];
  if (!Number.isInteger(monthIdx) || monthIdx < 0 || monthIdx >= months.length) return NextResponse.json({ error: 'Index out of range' }, { status: 400 });

  months[monthIdx] = { ...months[monthIdx], goldRate24K: Number(goldRate24K) };
  // Recalculate the whole chain: each month's weight depends on the previous row's result.
  const recalculated = recalcMonths(months, doc.initialGoldWeight as number);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updated = await (Report3Model as any).findByIdAndUpdate(
    (doc as { _id: unknown })._id,
    { months: recalculated },
    { new: true },
  ).lean();

  return NextResponse.json({ ok: true, doc: updated });
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  if (!await guard(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { idx } = await params;
  const monthIdx = Number(idx);

  await dbConnect();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = await (Report3Model as any).findOne({}).lean() as Record<string, unknown> | null;
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const months = [...((doc.months as Array<{ month: string; goldRate24K: number }>) ?? [])];
  months.splice(monthIdx, 1);
  const recalculated = months.length > 0 ? recalcMonths(months, doc.initialGoldWeight as number) : [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updated = await (Report3Model as any).findByIdAndUpdate(
    (doc as { _id: unknown })._id,
    { months: recalculated },
    { new: true },
  ).lean();

  return NextResponse.json({ ok: true, doc: updated });
}
