'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { ROLE_LABEL } from '@/lib/config';

const inputClass =
  'w-full px-3.5 py-2.5 rounded-lg border border-zinc-300 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition';
const lockedClass =
  'w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 bg-zinc-100 text-sm text-zinc-500 cursor-not-allowed';

const emptyForm = { currentPassword: '', newPassword: '', confirmPassword: '' };

export function ProfileClient() {
  const router = useRouter();
  const { data: user, isLoading } = useCurrentUser();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const changePassword = useMutation({
    mutationFn: (body: { currentPassword: string; newPassword: string }) =>
      fetch('/api/profile/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then(r => r.json()),
    onSuccess: result => {
      if (result.ok) {
        setForm(emptyForm);
        setSuccess(true);
      } else {
        setError(result.error ?? 'Could not update password.');
      }
    },
    onError: () => setError('Network error. Please try again.'),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess(false);
    if (form.newPassword !== form.confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }
    changePassword.mutate({ currentPassword: form.currentPassword, newPassword: form.newPassword });
  }

  const set = (k: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setSuccess(false);
    setForm(f => ({ ...f, [k]: e.target.value }));
  };

  return (
    <div className="min-h-screen bg-amber-50">
      <header className="bg-amber-900 text-white px-6 py-4 shadow-lg">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">My Profile</h1>
            <p className="text-amber-300 text-xs mt-0.5">Account details and password</p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="text-amber-200 hover:text-white text-sm transition-colors"
          >
            ← Dashboard
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Account details — read only */}
        <section className="bg-white rounded-2xl shadow-sm border border-amber-100 p-6">
          <h2 className="text-base font-semibold text-zinc-800 mb-1">Account</h2>
          <p className="text-xs text-zinc-400 mb-5">Username and email can only be changed by an administrator.</p>
          {isLoading || !user ? (
            <div className="h-32 animate-pulse rounded-lg bg-amber-50" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5" htmlFor="profile-username">Username</label>
                <input id="profile-username" type="text" value={user.username} readOnly disabled className={lockedClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5" htmlFor="profile-email">Email</label>
                <input id="profile-email" type="email" value={user.email} readOnly disabled className={lockedClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5" htmlFor="profile-role">Role</label>
                <input id="profile-role" type="text" value={ROLE_LABEL[user.role]} readOnly disabled className={lockedClass} />
              </div>
            </div>
          )}
        </section>

        {/* Change password */}
        <section className="bg-white rounded-2xl shadow-sm border border-amber-100 p-6">
          <h2 className="text-base font-semibold text-zinc-800 mb-5">Change Password</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5" htmlFor="current-password">Current password</label>
              <input id="current-password" type={showPw ? 'text' : 'password'} required autoComplete="current-password"
                value={form.currentPassword} onChange={set('currentPassword')} className={inputClass} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5" htmlFor="new-password">New password</label>
                <input id="new-password" type={showPw ? 'text' : 'password'} required minLength={8} autoComplete="new-password"
                  value={form.newPassword} onChange={set('newPassword')} placeholder="At least 8 characters" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5" htmlFor="confirm-password">Confirm new password</label>
                <input id="confirm-password" type={showPw ? 'text' : 'password'} required minLength={8} autoComplete="new-password"
                  value={form.confirmPassword} onChange={set('confirmPassword')} className={inputClass} />
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs text-zinc-500 select-none">
              <input type="checkbox" checked={showPw} onChange={e => setShowPw(e.target.checked)} className="accent-amber-700" />
              Show passwords
            </label>

            {error && (
              <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
            )}
            {success && (
              <p role="status" className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                Password updated successfully.
              </p>
            )}

            <button type="submit" disabled={changePassword.isPending}
              className="px-5 py-2.5 rounded-lg bg-amber-700 hover:bg-amber-600 disabled:opacity-60 text-white text-sm font-medium transition-colors">
              {changePassword.isPending ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
