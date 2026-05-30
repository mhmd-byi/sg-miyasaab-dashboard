'use client';

import { useState, useMemo, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fmt, fmtGold, fmtRate } from '@/lib/utils';
import { calcMonthRow, recalcMonths, monthLabel } from '@/lib/calculations';
import { MonthCalcPreview } from './CalcPreview';
import type { MonthRow } from '@/lib/types';

interface R3Doc {
  initialGoldWeight: number;
  months: MonthRow[];
}

function apiJson(url: string, method: string, body?: unknown) {
  return fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  }).then(r => r.json());
}

export function R3DataTab() {
  const qc = useQueryClient();
  const [showMonthForm, setShowMonthForm] = useState(false);
  const [editMonthIdx, setEditMonthIdx] = useState<number | null>(null);
  const [editingWeight, setEditingWeight] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [monthYM, setMonthYM] = useState('');
  const [goldRate24K, setGoldRate24K] = useState('');
  const [formError, setFormError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-r3'],
    queryFn: () => fetch('/api/admin/data/report3').then(r => r.json()) as Promise<{ doc: R3Doc }>,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-r3'] });

  const doc = data?.doc ?? { initialGoldWeight: 0, months: [] };

  const weightMut = useMutation({
    mutationFn: (w: number) => apiJson('/api/admin/data/report3', 'PATCH', { initialGoldWeight: w }),
    onSuccess: (r) => { if (r.ok) { setEditingWeight(false); invalidate(); } },
  });

  const addMonthMut = useMutation({
    mutationFn: (b: { monthYM: string; goldRate24K: number }) =>
      apiJson('/api/admin/data/report3/months', 'POST', b),
    onSuccess: (r) => {
      if (r.ok) { setShowMonthForm(false); setMonthYM(''); setGoldRate24K(''); setFormError(''); invalidate(); }
      else setFormError(r.error ?? 'Failed.');
    },
  });

  const editMonthMut = useMutation({
    mutationFn: ({ idx, rate }: { idx: number; rate: number }) =>
      apiJson(`/api/admin/data/report3/months/${idx}`, 'PUT', { goldRate24K: rate }),
    onSuccess: (r) => {
      if (r.ok) { setEditMonthIdx(null); setGoldRate24K(''); invalidate(); }
      else setFormError(r.error ?? 'Failed.');
    },
  });

  const deleteMonthMut = useMutation({
    mutationFn: (idx: number) => apiJson(`/api/admin/data/report3/months/${idx}`, 'DELETE'),
    onSuccess: () => invalidate(),
  });

  // Next expected month for default value
  const nextMonthDefault = useMemo(() => {
    if (doc.months.length === 0) return '';
    const last = doc.months[doc.months.length - 1].month;
    const parts = last.split(' ');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const mIdx = months.indexOf(parts[0]);
    const yr = Number(parts[1]);
    const next = mIdx === 11 ? `${yr + 1}-01` : `${yr}-${String(mIdx + 2).padStart(2, '0')}`;
    return next;
  }, [doc.months]);

  // Preview calc for add/edit form
  const previewCumulative = useMemo(() => {
    if (editMonthIdx !== null) return doc.months[editMonthIdx]?.cumulativeGoldWeight ?? 0;
    const last = doc.months[doc.months.length - 1];
    if (!last) return doc.initialGoldWeight;
    return Math.round((last.cumulativeGoldWeight + last.msProfitInGold) * 1000) / 1000;
  }, [editMonthIdx, doc]);

  const previewCalc = useMemo(() =>
    calcMonthRow(previewCumulative, Number(goldRate24K) || 0),
    [previewCumulative, goldRate24K],
  );

  function handleSubmitMonth(e: FormEvent) {
    e.preventDefault(); setFormError('');
    if (editMonthIdx !== null) {
      editMonthMut.mutate({ idx: editMonthIdx, rate: Number(goldRate24K) });
    } else {
      addMonthMut.mutate({ monthYM, goldRate24K: Number(goldRate24K) });
    }
  }

  return (
    <div className="space-y-5">
      {/* Initial gold weight config */}
      <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-3">Configuration</p>
        <div className="flex items-center gap-4">
          <div>
            <p className="text-xs text-zinc-500 mb-0.5">Initial Gold Weight</p>
            {editingWeight ? (
              <div className="flex items-center gap-2">
                <input type="number" step="any" value={weightInput}
                  onChange={e => setWeightInput(e.target.value)}
                  className="w-36 px-3 py-1.5 text-sm rounded-lg border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="311.303"
                />
                <button onClick={() => weightMut.mutate(Number(weightInput))}
                  disabled={weightMut.isPending}
                  className="px-3 py-1.5 text-sm rounded-lg bg-amber-700 text-white hover:bg-amber-600 disabled:opacity-60 transition-colors">
                  {weightMut.isPending ? '…' : 'Save'}
                </button>
                <button onClick={() => setEditingWeight(false)}
                  className="px-3 py-1.5 text-sm rounded-lg border border-zinc-300 text-zinc-600 hover:bg-zinc-50 transition-colors">
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-amber-900">{fmtGold(doc.initialGoldWeight)} g</span>
                <button
                  onClick={() => { setWeightInput(String(doc.initialGoldWeight)); setEditingWeight(true); }}
                  className="text-xs px-2 py-1 rounded border border-amber-300 text-amber-700 hover:bg-amber-50 transition-colors">
                  Edit
                </button>
              </div>
            )}
          </div>
          <div className="ml-auto">
            <p className="text-xs text-zinc-500">{doc.months.length} months tracked</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">Monthly rows</p>
        <button
          onClick={() => {
            setEditMonthIdx(null);
            setMonthYM(nextMonthDefault);
            setGoldRate24K('');
            setShowMonthForm(v => !v);
            setFormError('');
          }}
          className="px-4 py-2 rounded-lg bg-amber-700 hover:bg-amber-600 text-white text-sm font-medium transition-colors"
        >
          {showMonthForm && editMonthIdx === null ? '✕ Cancel' : '+ Add Month'}
        </button>
      </div>

      {/* Add/edit month form */}
      {(showMonthForm || editMonthIdx !== null) && (
        <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-zinc-700 mb-4">
            {editMonthIdx !== null ? `Edit Month — ${doc.months[editMonthIdx]?.month}` : 'Add Month'}
          </h3>
          <form onSubmit={handleSubmitMonth}>
            <div className="grid grid-cols-2 gap-4 mb-5 max-w-sm">
              {editMonthIdx === null && (
                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1">Month</label>
                  <input type="month" required value={monthYM} onChange={e => setMonthYM(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Gold Rate 24K (₨/g)</label>
                <input type="number" step="any" required value={goldRate24K} onChange={e => setGoldRate24K(e.target.value)}
                  placeholder="9642"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>

            {goldRate24K && <MonthCalcPreview calc={previewCalc} cumulativeGoldWeight={previewCumulative} />}

            {formError && (
              <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{formError}</p>
            )}

            <div className="flex gap-3 mt-4">
              <button type="submit"
                disabled={addMonthMut.isPending || editMonthMut.isPending}
                className="px-5 py-2 rounded-lg bg-amber-700 hover:bg-amber-600 disabled:opacity-60 text-white text-sm font-medium transition-colors">
                {addMonthMut.isPending || editMonthMut.isPending ? 'Saving…' : editMonthIdx !== null ? 'Update Month' : 'Add Month'}
              </button>
              <button type="button"
                onClick={() => { setShowMonthForm(false); setEditMonthIdx(null); setGoldRate24K(''); }}
                className="px-5 py-2 rounded-lg border border-zinc-300 text-zinc-600 hover:bg-zinc-50 text-sm font-medium transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Months table */}
      <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-zinc-400 animate-pulse">Loading…</div>
        ) : doc.months.length === 0 ? (
          <div className="p-8 text-center text-zinc-400 text-sm">No months yet. Set initial gold weight then add months.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm whitespace-nowrap">
              <thead>
                <tr className="bg-amber-50 border-b border-amber-200">
                  {['#','Month','Cumul. Gold (g)','Rate 24K','Sales PM (g)','Labour Profit ₨','Sharable ₨','Op. Cost ₨','MS Share ₨','SG Share ₨','MS Gold (g)',''].map(h => (
                    <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-amber-800 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {doc.months.map((m, idx) => (
                  <tr key={m.month} className={`border-b border-zinc-100 hover:bg-amber-50/40 ${idx % 2 !== 0 ? 'bg-zinc-50/30' : ''}`}>
                    <td className="px-3 py-3 text-zinc-400 text-xs">{idx + 1}</td>
                    <td className="px-3 py-3 font-medium text-zinc-800">{m.month}</td>
                    <td className="px-3 py-3 text-right text-zinc-700">{fmtGold(m.cumulativeGoldWeight)}</td>
                    <td className="px-3 py-3 text-right text-zinc-700">{fmtRate(m.goldRate24K)}</td>
                    <td className="px-3 py-3 text-right text-zinc-600">{fmtGold(m.salesPM)}</td>
                    <td className="px-3 py-3 text-right text-zinc-600">{fmt(m.labourProfitCharged)}</td>
                    <td className="px-3 py-3 text-right text-zinc-600">{fmt(m.labourSharableProfit)}</td>
                    <td className="px-3 py-3 text-right text-zinc-500">{fmt(m.operatingCost)}</td>
                    <td className="px-3 py-3 text-right font-semibold text-amber-700">{fmt(m.msShare)}</td>
                    <td className="px-3 py-3 text-right font-semibold text-stone-600">{fmt(m.sgShare)}</td>
                    <td className="px-3 py-3 text-right text-zinc-400">{fmtGold(m.msProfitInGold)}</td>
                    <td className="px-3 py-3">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => { setGoldRate24K(String(m.goldRate24K)); setEditMonthIdx(idx); setShowMonthForm(false); setFormError(''); }}
                          className="text-xs px-2 py-1 rounded border border-amber-300 text-amber-700 hover:bg-amber-50 transition-colors">
                          Edit
                        </button>
                        <button
                          onClick={() => { if (confirm(`Delete month ${m.month}? Subsequent months will be recalculated.`)) deleteMonthMut.mutate(idx); }}
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
