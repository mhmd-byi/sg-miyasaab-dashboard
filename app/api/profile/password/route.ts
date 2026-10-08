import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { dbConnect } from '@/lib/db';
import { UserModel } from '@/lib/models';
import { getSessionFromRequest } from '@/lib/auth';

const MIN_LENGTH = 8;

// Any signed-in user can change their own password (admin or viewer).
export async function PUT(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || !mongoose.isValidObjectId(session.id)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const currentPassword: string = body.currentPassword ?? '';
    const newPassword: string = body.newPassword ?? '';

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Current and new password are required.' }, { status: 400 });
    }
    if (newPassword.length < MIN_LENGTH) {
      return NextResponse.json({ error: `New password must be at least ${MIN_LENGTH} characters.` }, { status: 400 });
    }
    if (newPassword === currentPassword) {
      return NextResponse.json({ error: 'New password must be different from the current one.' }, { status: 400 });
    }

    await dbConnect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = await (UserModel as any).findById(session.id).lean() as { passwordHash: string } | null;
    if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

    if (!await bcrypt.compare(currentPassword, user.passwordHash)) {
      return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (UserModel as any).findByIdAndUpdate(session.id, { passwordHash: await bcrypt.hash(newPassword, 12) });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[profile/password]', e);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
