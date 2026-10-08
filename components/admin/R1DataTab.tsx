'use client';

import { useState, useMemo, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fmt, fmtGold, fmtRate } from '@/lib/utils';
import { calcR1, inferLabourRatePct } from '@/lib/calculations';
import { R1CalcPreview } from './CalcPreview';
import type { Report1Item } from '@/lib/types';

interface R1Doc extends Report1Item {
  _id: string;
  labourRatePct: number;
}

type EntryStatus = 'sold' | 'stock';

const EMPTY_FORM = {
  status: 'stock' as EntryStatus,
  tagNo: '', salesDate: '', goldWeightG: '', goldRate22K: '',
  purity: '22', labourRatePct: '', labourCostCharged: '0',
};

function post(url: string, body: unknown) {
  return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json());
}
function put(url: string, body: unknown) {
  return fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json());
}
function del(url: string) {
  return fetch(url, { method: 'DELETE' }).then(r => r.json());
}

export function R1DataTab() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-r1'],
    queryFn: () => fetch('/api/admin/data/report1').then(r => r.json()) as Promise<{ items: R1Doc[] }>,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin-r1'] });
    qc.invalidateQueries({ queryKey: ['report1'] }); // keep the dashboard in sync
  };

  const saveMut = useMutation({
    mutationFn: (body: typeof EMPTY_FORM) =>
      editId ? put(`/api/admin/data/report1/${editId}`, body) : post('/api/admin/data/report1', body),
    onSuccess: (res) => {
      if (res.ok) { setShowForm(false); setEditId(null); setForm(EMPTY_FORM); setFormError(''); invalidate(); }
      else setFormError(res.error ?? 'Save failed.');
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => del(`/api/admin/data/report1/${id}`),
    onSuccess: () => invalidate(),
  });

  // Live calculated preview
  const calc = useMemo(() => calcR1(
    Number(form.goldWeightG) || 0,
    Number(form.goldRate22K) || 0,
    Number(form.labourRatePct) || 0,
    Number(form.labourCostCharged) || 0,
  ), [form]);

  function openEdit(item: R1Doc) {
    const rate = item.labourRatePct || inferLabourRatePct(item.goldSellPrice, item.labourProfitCharged);
    setForm({
      status: item.status === 'stock' ? 'stock' : 'sold',
      tagNo: item.tagNo, salesDate: item.salesDate,
      goldWeightG: String(item.goldWeightG), goldRate22K: String(item.goldRate22K),
      purity: String(item.purity), labourRatePct: String(rate),
      labourCostCharged: String(item.labourCostCharged),
    });
    setEditId(item._id); setShowForm(true); setFormError('');
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault(); setFormError('');
    saveMut.mutate(form);
  }

  const f = (k: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(v => ({ ...v, [k]: e.target.value }));

  const items = data?.items ?? [];
  const isStock = form.status === 'stock';
  const stockCount = items.filter(i => i.status === 'stock').length;

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">
          {items.length} {items.length === 1 ? 'entry' : 'entries'} · {stockCount} in stock
        </p>
        <button
          onClick={() => { setEditId(null); setForm(EMPTY_FORM); setShowForm(v => !v); setFormError(''); }}
          className="px-4 py-2 rounded-lg bg-amber-700 hover:bg-amber-600 text-white text-sm font-medium transition-colors"
        >
          {showForm && !editId ? '✕ Cancel' : '+ Add Entry'}
        </button>
      </div>

      {/* Add / Edit form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-zinc-700 mb-4">
            {editId ? 'Edit Entry' : isStock ? 'New Entry — Stock' : 'New Entry — Ornaments Sold'}
          </h3>
          <form onSubmit={handleSubmit}>
            {/* Entry type */}
            <div className="inline-flex rounded-lg border border-amber-200 p-0.5 mb-4" role="group" aria-label="Entry type">
              {(['stock', 'sold'] as const).map(s => (
                <button key={s} type="button" aria-pressed={form.status === s}
                  onClick={() => setForm(v => ({ ...v, status: s }))}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${form.status === s ? 'bg-amber-700 text-white' : 'text-zinc-600 hover:bg-amber-50'}`}>
                  {s === 'stock' ? 'Stock (not sold yet)' : 'Sold'}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
              {/* Manual inputs */}
              {[
                { k: 'tagNo' as const, label: 'Tag No', type: 'text', placeholder: 'MBAN32' },
                { k: 'salesDate' as const, label: 'Sale Date (dd/mm/yyyy)', type: 'text', placeholder: '09/04/2025', soldOnly: true },
                { k: 'goldWeightG' as const, label: 'Gold Weight (g)', type: 'number', placeholder: '46.893' },
                { k: 'goldRate22K' as const, label: 'Gold Rate 22K (₨)', type: 'number', placeholder: '9428', soldOnly: true },
              ].filter(field => !(isStock && field.soldOnly)).map(({ k, label, type, placeholder }) => (
                <div key={k}>
                  <label className="block text-xs font-medium text-zinc-600 mb-1">{label}</label>
                  <input
                    type={type} value={form[k]} onChange={f(k)} required placeholder={placeholder}
                    step={type === 'number' ? 'any' : undefined}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Purity</label>
                <select value={form.purity} onChange={f('purity')}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400">
                  <option value="22">22K</option>
                  <option value="18">18K</option>
                  <option value="24">24K</option>
                </select>
              </div>
              {!isStock && (
                <>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">
                  Labour Rate %
                  <span className="text-zinc-400 font-normal ml-1">(e.g. 7 or 11)</span>
                </label>
                <input type="number" step="any" value={form.labourRatePct} onChange={f('labourRatePct')} required placeholder="11"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">
                  Labour Cost Charged (₨)
                  <span className="text-zinc-400 font-normal ml-1">(0 if none)</span>
                </label>
                <input type="number" step="any" value={form.labourCostCharged} onChange={f('labourCostCharged')} placeholder="0"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                />
              </div>
                </>
              )}
            </div>

            {/* Calculated preview */}
            {!isStock && <R1CalcPreview calc={calc} />}

            {formError && (
              <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{formError}</p>
            )}

            <div className="flex items-center gap-3 mt-4">
              <button type="submit" disabled={saveMut.isPending}
                className="px-5 py-2 rounded-lg bg-amber-700 hover:bg-amber-600 disabled:opacity-60 text-white text-sm font-medium transition-colors">
                {saveMut.isPending ? 'Saving…' : editId ? 'Update Entry' : 'Save Entry'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditId(null); setForm(EMPTY_FORM); }}
                className="px-5 py-2 rounded-lg border border-zinc-300 text-zinc-600 hover:bg-zinc-50 text-sm font-medium transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-zinc-400 animate-pulse">Loading…</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-zinc-400 text-sm">No entries yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm whitespace-nowrap">
              <thead>
                <tr className="bg-amber-50 border-b border-amber-200">
                  {['Tag No','Status','Sale Date','Weight (g)','Rate 22K','Purity','Rate%','Gold Sell ₨','Labour Profit ₨','MS Share ₨','SG Share ₨',''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-amber-800 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item._id} className={`border-b border-zinc-100 hover:bg-amber-50/40 ${idx % 2 !== 0 ? 'bg-zinc-50/30' : ''}`}>
                    <td className="px-4 py-3 font-medium text-zinc-800">{item.tagNo}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.status === 'stock' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                        {item.status === 'stock' ? 'In stock' : 'Sold'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{item.salesDate || '—'}</td>
                    <td className="px-4 py-3 text-right text-zinc-700">{fmtGold(item.goldWeightG)}</td>
                    <td className="px-4 py-3 text-right text-zinc-700">{fmtRate(item.goldRate22K)}</td>
                    <td className="px-4 py-3 text-center text-zinc-600">{item.purity}K</td>
                    <td className="px-4 py-3 text-center text-zinc-500 text-xs">
                      {item.labourRatePct || inferLabourRatePct(item.goldSellPrice, item.labourProfitCharged)}%
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-700">{fmt(item.goldSellPrice)}</td>
                    <td className="px-4 py-3 text-right text-zinc-700">{fmt(item.labourProfitCharged)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-amber-700">{fmt(item.msShare)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-stone-600">{fmt(item.sgShare)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(item)}
                          className="text-xs px-2 py-1 rounded border border-amber-300 text-amber-700 hover:bg-amber-50 transition-colors">
                          Edit
                        </button>
                        <button
                          onClick={() => { if (confirm('Delete this entry?')) deleteMut.mutate(item._id); }}
                          className="text-xs px-2 py-1 rounded border border-red-200 text-red-500 hover:bg-red-50 transition-colors">
                          Del
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
