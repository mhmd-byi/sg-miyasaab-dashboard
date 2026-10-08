'use client';

import { useState, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { ROLE_LABEL } from '@/lib/config';
import { ArrowLeft } from 'lucide-react';

interface UserRecord {
  _id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: string;
  createdBy: string;
}

const emptyForm = { username: '', email: '', password: '', role: 'user' as 'user' | 'admin' };

export function AdminUsersClient() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: currentUser } = useCurrentUser();
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [showPw, setShowPw] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () =>
      fetch('/api/admin/users').then(r => r.json()) as Promise<{ users: UserRecord[] }>,
  });

  const createUser = useMutation({
    mutationFn: (body: typeof form) =>
      fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then(r => r.json()),
    onSuccess: result => {
      if (result.ok) {
        setForm(emptyForm);
        setFormError('');
        qc.invalidateQueries({ queryKey: ['admin-users'] });
      } else {
        setFormError(result.error ?? 'Failed to create user.');
      }
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError('');
    createUser.mutate(form);
  }

  const users = data?.users ?? [];

  return (
    <div className="min-h-screen bg-amber-50">
      {/* Header */}
      <header className="bg-amber-900 text-white px-6 py-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">User Management</h1>
            <p className="text-amber-300 text-xs mt-0.5">
              {currentUser ? `Signed in as ${currentUser.username} · admin` : ''}
            </p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-1.5 text-amber-200 hover:text-white text-sm transition-colors"
          >
            <ArrowLeft className="size-4" aria-hidden /> Dashboard
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Create user form */}
        <div className="bg-white rounded-2xl shadow-sm border border-amber-100 p-6">
          <h2 className="text-base font-semibold text-zinc-800 mb-5">Create New User</h2>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Username</label>
              <input
                type="text"
                required
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                placeholder="e.g. user_sg"
                className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-300 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="user@example.com"
                className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-300 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 pr-14 rounded-lg border border-zinc-300 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-600 font-medium"
                >
                  {showPw ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Role</label>
              <select
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value as 'user' | 'admin' }))}
                className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-300 text-sm text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
              >
                <option value="user">Viewer — dashboard view only</option>
                <option value="admin">Admin — full access</option>
              </select>
            </div>

            {formError && (
              <div className="col-span-full text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5">
                {formError}
              </div>
            )}

            {createUser.isSuccess && createUser.data?.ok && (
              <div className="col-span-full text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3.5 py-2.5">
                User created successfully.
              </div>
            )}

            <div className="col-span-full">
              <button
                type="submit"
                disabled={createUser.isPending}
                className="px-6 py-2.5 rounded-lg bg-amber-700 hover:bg-amber-600 disabled:opacity-60 text-white text-sm font-medium transition-colors shadow-sm"
              >
                {createUser.isPending ? 'Creating…' : 'Create User'}
              </button>
            </div>
          </form>
        </div>

        {/* Users list */}
        <div className="bg-white rounded-2xl shadow-sm border border-amber-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-amber-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-zinc-800">
              All Users
              {!isLoading && (
                <span className="ml-2 text-xs font-normal text-zinc-400">({users.length})</span>
              )}
            </h2>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-zinc-400 text-sm animate-pulse">Loading users…</div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-zinc-400 text-sm">No users found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm whitespace-nowrap">
                <thead>
                  <tr className="bg-amber-50 border-b border-amber-200">
                    {['Username', 'Email', 'Role', 'Created', 'Created By'].map(h => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold text-amber-800 uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, idx) => (
                    <tr
                      key={u._id}
                      className={`border-b border-zinc-100 ${idx % 2 !== 0 ? 'bg-zinc-50/40' : ''}`}
                    >
                      <td className="px-4 py-3 font-medium text-zinc-800">
                        {u.username}
                        {u.username === currentUser?.username && (
                          <span className="ml-2 text-xs text-amber-600 font-normal">(you)</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-zinc-600">{u.email}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            u.role === 'admin'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-zinc-100 text-zinc-600'
                          }`}
                        >
                          {ROLE_LABEL[u.role]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-500 text-xs">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-GB') : '—'}
                      </td>
                      <td className="px-4 py-3 text-zinc-500 text-xs">{u.createdBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
