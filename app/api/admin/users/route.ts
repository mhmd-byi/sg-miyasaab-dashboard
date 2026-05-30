import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { dbConnect } from '@/lib/db';
import { UserModel } from '@/lib/models';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  await dbConnect();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const users = await (UserModel as any).find({}).select('-passwordHash').lean();
  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    const body = await req.json();
    const username: string = (body.username ?? '').trim();
    const email: string = (body.email ?? '').trim().toLowerCase();
    const password: string = body.password ?? '';
    const role: string = body.role === 'admin' ? 'admin' : 'user';

    if (!username || !email || !password) {
      return NextResponse.json({ error: 'username, email, and password are required.' }, { status: 400 });
    }

    await dbConnect();
    const passwordHash = await bcrypt.hash(password, 12);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = await (UserModel as any).create({
      username,
      email,
      passwordHash,
      role,
      createdBy: session.username,
    });

    return NextResponse.json({
      ok: true,
      user: { id: String(user._id), username: user.username, email: user.email, role: user.role },
    });
  } catch (e: unknown) {
    if ((e as { code?: number }).code === 11000) {
      return NextResponse.json({ error: 'Username or email already exists.' }, { status: 409 });
    }
    console.error('[admin/users POST]', e);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
