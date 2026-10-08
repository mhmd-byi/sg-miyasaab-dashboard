import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { dbConnect } from '@/lib/db';
import { Report1Model } from '@/lib/models';
import { getSessionFromRequest } from '@/lib/auth';
import { buildR1Fields } from '@/lib/report1';

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

  await dbConnect();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = await (Report1Model as any).create(buildR1Fields(b));

  return NextResponse.json({ ok: true, item: doc.toObject() });
}
