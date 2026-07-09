import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { dbConnect } from '@/lib/db';
import { Report2Model } from '@/lib/models';
import { getSessionFromRequest } from '@/lib/auth';

async function guard(req: NextRequest) {
  const s = await getSessionFromRequest(req);
  if (!s || s.role !== 'admin') return null;
  return s;
}

// Update item-level fields (tag, purity, weight, salesDate)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await guard(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const b = await req.json();
  const salesDate = String(b.salesDate ?? '').trim();

  await dbConnect();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = await (Report2Model as any).findByIdAndUpdate(
    id,
    {
      tagNo: String(b.tagNo ?? '').trim(),
      salesDate,
      purity: String(b.purity ?? '22').trim(),
      initialGoldWeight: Number(b.initialGoldWeight ?? 0),
      fineGoldWeight: Number(b.fineGoldWeight ?? b.initialGoldWeight ?? 0),
      batch: String(b.batch ?? '').trim(),
      batchIntroDate: String(b.batchIntroDate ?? '').trim(),
      notes: String(b.notes ?? '').trim(),
      status: salesDate ? 'sold' : 'pending',
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
  await (Report2Model as any).findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
