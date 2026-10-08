'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronDown, LogOut, PenLine, UserCircle, Users } from 'lucide-react';
import type { SessionUser } from '@/lib/auth';
import { ROLE_LABEL } from '@/lib/config';

export function UserMenu({ user }: { user: SessionUser }) {
  const router = useRouter();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    setOpen(false);
    await fetch('/api/auth/logout', { method: 'POST' });
    qc.clear();
    router.push('/login');
    router.refresh();
  }

  const initials = user.username.slice(0, 2).toUpperCase();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-amber-800/60 transition-colors"
        aria-label="User menu"
      >
        <span className="w-8 h-8 rounded-full bg-amber-200 text-amber-900 text-xs font-bold flex items-center justify-center shrink-0">
          {initials}
        </span>
        <div className="hidden sm:block text-left">
          <p className="text-sm font-medium text-white leading-tight">{user.username}</p>
          <p className="text-xs text-amber-300 leading-tight">{ROLE_LABEL[user.role]}</p>
        </div>
        <ChevronDown className="size-4 text-amber-400" aria-hidden />
      </button>

      {open && (
        <>
          {/* backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 w-52 bg-white rounded-xl shadow-xl border border-amber-100 z-20 overflow-hidden">
            <div className="px-4 py-3 bg-amber-50 border-b border-amber-100">
              <p className="text-sm font-semibold text-zinc-800">{user.username}</p>
              <p className="text-xs text-zinc-500 truncate">{user.email}</p>
              <span
                className={`mt-1.5 inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                  user.role === 'admin'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-zinc-100 text-zinc-600'
                }`}
              >
                {ROLE_LABEL[user.role]}
              </span>
            </div>

            <button
              onClick={() => { setOpen(false); router.push('/profile'); }}
              className="w-full text-left px-4 py-2.5 text-sm text-zinc-700 hover:bg-amber-50 transition-colors flex items-center gap-2"
            >
              <UserCircle className="size-4 text-zinc-500" aria-hidden /> My Profile
            </button>

            {user.role === 'admin' && (
              <>
                <button
                  onClick={() => { setOpen(false); router.push('/admin/data'); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-zinc-700 hover:bg-amber-50 transition-colors flex items-center gap-2"
                >
                  <PenLine className="size-4 text-zinc-500" aria-hidden /> Data Entry
                </button>
                <button
                  onClick={() => { setOpen(false); router.push('/admin/users'); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-zinc-700 hover:bg-amber-50 transition-colors flex items-center gap-2"
                >
                  <Users className="size-4 text-zinc-500" aria-hidden /> Manage Users
                </button>
              </>
            )}

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-zinc-100 disabled:opacity-60"
            >
              <span className="flex items-center gap-2">
                <LogOut className="size-4" aria-hidden />
                {loggingOut ? 'Signing out…' : 'Sign out'}
              </span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
