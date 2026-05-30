import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { dbConnect } from '@/lib/db';
import { UserModel } from '@/lib/models';
import { signToken, SESSION_COOKIE, SESSION_MAX_AGE, type SessionUser } from '@/lib/auth';

async function ensureAdminExists() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const exists = await (UserModel as any).findOne({ username: 'admin_sg' }).lean();
  if (!exists) {
    const hash = await bcrypt.hash('ObeyAllah@786', 12);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (UserModel as any).create({
      username: 'admin_sg',
      email: 'mohammed@buildyourinnovation.com',
      passwordHash: hash,
      role: 'admin',
      createdBy: 'system',
    });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const identifier: string = (body.identifier ?? '').trim();
    const password: string = body.password ?? '';

    if (!identifier || !password) {
      return NextResponse.json({ error: 'Username/email and password are required.' }, { status: 400 });
    }

    await dbConnect();
    await ensureAdminExists();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = await (UserModel as any)
      .findOne({ $or: [{ username: identifier }, { email: identifier.toLowerCase() }] })
      .lean() as Record<string, unknown> | null;

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash as string);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    const sessionUser: SessionUser = {
      id: String(user._id),
      username: user.username as string,
      email: user.email as string,
      role: user.role as 'admin' | 'user',
    };

    const token = await signToken(sessionUser);

    const res = NextResponse.json({ ok: true, user: sessionUser });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE,
      path: '/',
    });
    return res;
  } catch (e) {
    console.error('[auth/login]', e);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
