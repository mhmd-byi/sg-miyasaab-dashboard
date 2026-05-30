import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { dbConnect } from '@/lib/db';
import { Report1Model } from '@/lib/models';
import { getSessionFromRequest } from '@/lib/auth';
import { calcR1 } from '@/lib/calculations';

async function guard(req: NextRequest) {
  const s = await getSessionFromRequest(req);
  if (!s || s.role !== 'admin') return null;
  return s;
}

export async function GET(req: NextRequest) {
  if (!await guard(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  await dbConnect();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = await (Report1Model as any).find({}).select('-__v').lean();
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  if (!await guard(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const b = await req.json();
  const goldWeightG    = Number(b.goldWeightG ?? 0);
  const goldRate22K    = Number(b.goldRate22K ?? 0);
  const labourRatePct  = Number(b.labourRatePct ?? 0);
  const labourCostCharged = Number(b.labourCostCharged ?? 0);

  const calc = calcR1(goldWeightG, goldRate22K, labourRatePct, labourCostCharged);

  await dbConnect();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = await (Report1Model as any).create({
    tagNo: String(b.tagNo ?? '').trim(),
    salesDate: String(b.salesDate ?? ''),
    goldWeightG,
    goldRate22K,
    purity: Number(b.purity ?? 22),
    labourRatePct,
    labourCostPrice: 0,
    labourCostCharged,
    ...calc,
  });

  return NextResponse.json({ ok: true, item: doc.toObject() });
}
