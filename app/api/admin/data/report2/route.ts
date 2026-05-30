import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { dbConnect } from '@/lib/db';
import { Report2Model } from '@/lib/models';
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
  const items = await (Report2Model as any).find({}).select('-__v').lean();
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  if (!await guard(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const b = await req.json();
  const salesDate = String(b.salesDate ?? '').trim();
  const status = salesDate ? 'sold' : 'pending';

  await dbConnect();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const existing = await (Report2Model as any).countDocuments({});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = await (Report2Model as any).create({
    srNo: existing + 1,
    tagNo: String(b.tagNo ?? '').trim(),
    salesDate,
    purity: String(b.purity ?? '22').trim(),
    initialGoldWeight: Number(b.initialGoldWeight ?? 0),
    status,
    months: [],
    totalMsShare: 0,
    totalSgShare: 0,
    totalOperatingCost: 0,
  });

  return NextResponse.json({ ok: true, item: doc.toObject() });
}
