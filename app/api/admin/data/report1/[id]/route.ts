import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { dbConnect } from '@/lib/db';
import { Report1Model } from '@/lib/models';
import { getSessionFromRequest } from '@/lib/auth';
import { calcR1 } from '@/lib/calculations';

async function guard(req: NextRequest) {
  const s = await getSessionFromRequest(req);
  if (!s || s.role !== 'admin') return null;
  return s;
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await guard(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const b = await req.json();
  const goldWeightG       = Number(b.goldWeightG ?? 0);
  const goldRate22K       = Number(b.goldRate22K ?? 0);
  const labourRatePct     = Number(b.labourRatePct ?? 0);
  const labourCostCharged = Number(b.labourCostCharged ?? 0);

  const calc = calcR1(goldWeightG, goldRate22K, labourRatePct, labourCostCharged);

  await dbConnect();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = await (Report1Model as any).findByIdAndUpdate(
    id,
    {
      tagNo: String(b.tagNo ?? '').trim(),
      salesDate: String(b.salesDate ?? ''),
      goldWeightG,
      goldRate22K,
      purity: Number(b.purity ?? 22),
      labourRatePct,
      labourCostCharged,
      ...calc,
    },
    { new: true },
  ).lean();

  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true, item: doc });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await guard(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  await dbConnect();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (Report1Model as any).findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
