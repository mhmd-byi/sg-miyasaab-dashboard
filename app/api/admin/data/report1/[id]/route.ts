import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { dbConnect } from '@/lib/db';
import { Report1Model } from '@/lib/models';
import { getSessionFromRequest } from '@/lib/auth';
import { buildR1Fields } from '@/lib/report1';

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

  await dbConnect();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = await (Report1Model as any).findByIdAndUpdate(id, buildR1Fields(b), { new: true }).lean();

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
