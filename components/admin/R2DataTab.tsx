'use client';

import { useState, useMemo, Fragment, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fmt, fmtGold, fmtRate } from '@/lib/utils';
import { calcMonthRow } from '@/lib/calculations';
import { MonthCalcPreview } from './CalcPreview';
import type { Report2Item, MonthRow } from '@/lib/types';

interface R2Doc extends Report2Item { _id: string }

function apiJson(url: string, method: string, body?: unknown) {
  return fetch(url, {
    method, headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  }).then(r => r.json());
}

const EMPTY_ITEM = {
  tagNo: '',
  salesDate: '',
  purity: '22',
  initialGoldWeight: '',
  fineGoldWeight: '',
  batch: '',
  batchIntroDate: '',
  notes: '',
};

// ── Month form inside an expanded row ────────────────────────────────────────

function MonthForm({
  item,
  onDone,
}: {
  item: R2Doc;
  onDone: () => void;
}) {
  const qc = useQueryClient();
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [monthYM, setMonthYM] = useState('');
  const [goldRate, setGoldRate] = useState('');
  const [formError, setFormError] = useState('');

  // default next month
  const nextDefault = useMemo(() => {
    if (!item.months.length) return '';
    const last = item.months[item.months.length - 1].month;
    const mNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const [mName, yr] = last.split(' ');
    const mIdx = mNames.indexOf(mName);
    return mIdx === 11 ? `${Number(yr)+1}-01` : `${yr}-${String(mIdx+2).padStart(2,'0')}`;
  }, [item.months]);

  const previewCumulative = useMemo(() => {
    if (editIdx !== null) return item.months[editIdx]?.cumulativeGoldWeight ?? 0;
    const last = item.months[item.months.length - 1];
    if (!last) return item.initialGoldWeight;
    return Math.round((last.cumulativeGoldWeight + last.msProfitInGold) * 1000) / 1000;
  }, [editIdx, item]);

  const previewCalc = useMemo(() => calcMonthRow(previewCumulative, Number(goldRate) || 0), [previewCumulative, goldRate]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-r2'] });

  const addMut = useMutation({
    mutationFn: (b: { monthYM: string; goldRate24K: number }) =>
      apiJson(`/api/admin/data/report2/${item._id}/months`, 'POST', b),
    onSuccess: r => {
      if (r.ok) { setShowAdd(false); setMonthYM(''); setGoldRate(''); setFormError(''); invalidate(); }
      else setFormError(r.error ?? 'Failed.');
    },
  });

  const editMut = useMutation({
    mutationFn: ({ idx, rate }: { idx: number; rate: number }) =>
      apiJson(`/api/admin/data/report2/${item._id}/months/${idx}`, 'PUT', { goldRate24K: rate }),
    onSuccess: r => {
      if (r.ok) { setEditIdx(null); setGoldRate(''); setFormError(''); invalidate(); }
      else setFormError(r.error ?? 'Failed.');
    },
  });

  const deleteMut = useMutation({
    mutationFn: (idx: number) => apiJson(`/api/admin/data/report2/${item._id}/months/${idx}`, 'DELETE'),
    onSuccess: () => invalidate(),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault(); setFormError('');
    if (editIdx !== null) editMut.mutate({ idx: editIdx, rate: Number(goldRate) });
    else addMut.mutate({ monthYM, goldRate24K: Number(goldRate) });
  }

  return (
    <div className="bg-amber-50/30 border-t border-amber-100 p-4">
      {/* Add/edit month form */}
      {(showAdd || editIdx !== null) && (
        <div className="bg-white rounded-xl border border-amber-200 shadow-sm p-4 mb-4">
          <p className="text-xs font-semibold text-zinc-700 mb-3">
            {editIdx !== null ? `Edit — ${item.months[editIdx]?.month}` : 'Add Monthly Row'}
          </p>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-wrap gap-4 mb-4">
              {editIdx === null && (
                <div>
                  <label className="block text-xs text-zinc-600 mb-1">Month</label>
                  <input type="month" required value={monthYM} onChange={e => setMonthYM(e.target.value)}
                    className="px-3 py-2 text-sm rounded-lg border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs text-zinc-600 mb-1">Gold Rate 24K (₨/g)</label>
                <input type="number" step="any" required value={goldRate} onChange={e => setGoldRate(e.target.value)}
                  placeholder="9642"
                  className="px-3 py-2 text-sm rounded-lg border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>
            {goldRate && <MonthCalcPreview calc={previewCalc} cumulativeGoldWeight={previewCumulative} />}
            {formError && <p className="mt-2 text-xs text-red-600">{formError}</p>}
            <div className="flex gap-2 mt-3">
              <button type="submit" disabled={addMut.isPending || editMut.isPending}
                className="px-4 py-1.5 text-xs rounded-lg bg-amber-700 text-white hover:bg-amber-600 disabled:opacity-60 transition-colors">
                {addMut.isPending || editMut.isPending ? '…' : editIdx !== null ? 'Update' : 'Add Month'}
              </button>
              <button type="button" onClick={() => { setShowAdd(false); setEditIdx(null); setGoldRate(''); }}
                className="px-4 py-1.5 text-xs rounded-lg border border-zinc-300 text-zinc-600 hover:bg-zinc-50 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Months mini-table */}
      {item.months.length > 0 ? (
        <div className="overflow-x-auto mb-3">
          <table className="w-full text-xs whitespace-nowrap">
            <thead>
              <tr className="border-b border-amber-200">
                {['Month','Cumul.(g)','Rate 24K','Sales PM(g)','Labour Profit','Sharable','Op.Cost','MS Share','SG Share','MS Gold(g)',''].map(h => (
                  <th key={h} className={`px-3 py-2 font-semibold text-amber-700 ${h === 'Month' ? 'text-left' : 'text-right'} ${h === '' ? '' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {item.months.map((m: MonthRow, idx: number) => (
                <tr key={idx} className="border-b border-zinc-100 hover:bg-amber-50/40">
                  <td className="px-3 py-1.5 font-medium text-zinc-700">{m.month}</td>
                  <td className="px-3 py-1.5 text-right text-zinc-600">{fmtGold(m.cumulativeGoldWeight)}</td>
                  <td className="px-3 py-1.5 text-right text-zinc-600">{fmtRate(m.goldRate24K)}</td>
                  <td className="px-3 py-1.5 text-right text-zinc-600">{fmtGold(m.salesPM)}</td>
                  <td className="px-3 py-1.5 text-right text-zinc-600">{fmt(m.labourProfitCharged)}</td>
                  <td className="px-3 py-1.5 text-right text-zinc-600">{fmt(m.labourSharableProfit)}</td>
                  <td className="px-3 py-1.5 text-right text-zinc-500">{fmt(m.operatingCost)}</td>
                  <td className="px-3 py-1.5 text-right font-semibold text-amber-700">{fmt(m.msShare)}</td>
                  <td className="px-3 py-1.5 text-right font-semibold text-stone-600">{fmt(m.sgShare)}</td>
                  <td className="px-3 py-1.5 text-right text-zinc-400">{fmtGold(m.msProfitInGold)}</td>
                  <td className="px-3 py-1.5">
                    <div className="flex gap-1">
                      <button onClick={() => { setGoldRate(String(m.goldRate24K)); setEditIdx(idx); setShowAdd(false); setFormError(''); }}
                        className="px-1.5 py-0.5 rounded border border-amber-300 text-amber-700 hover:bg-amber-50">
                        ✎
                      </button>
                      <button onClick={() => { if (confirm(`Delete ${m.month}?`)) deleteMut.mutate(idx); }}
                        className="px-1.5 py-0.5 rounded border border-red-200 text-red-500 hover:bg-red-50">
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-xs text-zinc-400 mb-3">No monthly rows yet.</p>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => { setShowAdd(v => !v); setEditIdx(null); setMonthYM(nextDefault); setGoldRate(''); setFormError(''); }}
          className="text-xs px-3 py-1.5 rounded-lg bg-amber-700 text-white hover:bg-amber-600 transition-colors"
        >
          + Add Month
        </button>
        <button onClick={onDone} className="text-xs px-3 py-1.5 rounded-lg border border-zinc-300 text-zinc-500 hover:bg-zinc-50 transition-colors">
          Collapse
        </button>
      </div>
    </div>
  );
}

// ── Main tab ─────────────────────────────────────────────────────────────────

export function R2DataTab() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_ITEM);
  const [formError, setFormError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'sold' | 'pending'>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-r2'],
    queryFn: () => fetch('/api/admin/data/report2').then(r => r.json()) as Promise<{ items: R2Doc[] }>,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-r2'] });

  const saveMut = useMutation({
    mutationFn: (b: typeof EMPTY_ITEM) =>
      editId
        ? apiJson(`/api/admin/data/report2/${editId}`, 'PUT', b)
        : apiJson('/api/admin/data/report2', 'POST', b),
    onSuccess: r => {
      if (r.ok) { setShowForm(false); setEditId(null); setForm(EMPTY_ITEM); setFormError(''); invalidate(); }
      else setFormError(r.error ?? 'Save failed.');
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => apiJson(`/api/admin/data/report2/${id}`, 'DELETE'),
    onSuccess: () => invalidate(),
  });

  function openEdit(item: R2Doc) {
    setForm({
      tagNo: item.tagNo,
      salesDate: item.salesDate,
      purity: item.purity,
      initialGoldWeight: String(item.initialGoldWeight),
      fineGoldWeight: String(item.fineGoldWeight ?? item.initialGoldWeight ?? ''),
      batch: item.batch ?? '',
      batchIntroDate: item.batchIntroDate ?? '',
      notes: item.notes ?? '',
    });
    setEditId(item._id); setShowForm(true); setFormError('');
  }

  const f = (k: keyof typeof EMPTY_ITEM) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(v => ({ ...v, [k]: e.target.value }));

  const allItems = data?.items ?? [];
  const items = filterStatus === 'all' ? allItems : allItems.filter(i => i.status === filterStatus);

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex gap-2">
          {(['all', 'sold', 'pending'] as const).map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${filterStatus === s ? 'bg-amber-700 text-white' : 'border border-amber-200 text-zinc-600 hover:bg-amber-50'}`}>
              {s} ({s === 'all' ? allItems.length : allItems.filter(i => i.status === s).length})
            </button>
          ))}
        </div>
        <button
          onClick={() => { setEditId(null); setForm(EMPTY_ITEM); setShowForm(v => !v); setFormError(''); }}
          className="px-4 py-2 rounded-lg bg-amber-700 hover:bg-amber-600 text-white text-sm font-medium transition-colors">
          {showForm && !editId ? '✕ Cancel' : '+ Add Item'}
        </button>
      </div>

      {/* Add/edit item form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-zinc-700 mb-4">
            {editId ? 'Edit Item' : 'New Ornament Item'}
          </h3>
          <form onSubmit={e => { e.preventDefault(); setFormError(''); saveMut.mutate(form); }}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Tag No</label>
                <input type="text" required value={form.tagNo} onChange={f('tagNo')} placeholder="MBAN32"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Purity</label>
                <select value={form.purity} onChange={f('purity')}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400">
                  <option value="22">22K</option>
                  <option value="18">18K</option>
                  <option value="24">24K</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Initial Gold Weight (g)</label>
                <input type="number" step="any" required value={form.initialGoldWeight} onChange={f('initialGoldWeight')} placeholder="46.893"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Fine Gold Weight (g)</label>
                <input type="number" step="any" value={form.fineGoldWeight} onChange={f('fineGoldWeight')} placeholder="43.142"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Batch</label>
                <select value={form.batch} onChange={f('batch')}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400">
                  <option value="">— Select batch —</option>
                  <option value="Batch 1">Batch 1</option>
                  <option value="Batch 2">Batch 2</option>
                  <option value="Batch 3">Batch 3</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Batch Intro Date</label>
                <input type="text" value={form.batchIntroDate} onChange={f('batchIntroDate')} placeholder="10-Apr-2025"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">
                  Sale Date
                  <span className="text-zinc-400 font-normal ml-1">(leave blank if pending)</span>
                </label>
                <input type="text" value={form.salesDate} onChange={f('salesDate')} placeholder="09/04/2025"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Notes</label>
                <input type="text" value={form.notes} onChange={f('notes')} placeholder="Profit settled / Holding cost accruing"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
            </div>

            <p className="text-xs text-zinc-400 mb-4">
              Status: <span className={`font-medium ${form.salesDate ? 'text-green-600' : 'text-amber-600'}`}>
                {form.salesDate ? 'Sold' : 'Pending (inventory)'}
              </span>
              {' — '}After saving, expand the row to add monthly profit rows.
            </p>

            {formError && <p className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{formError}</p>}

            <div className="flex gap-3">
              <button type="submit" disabled={saveMut.isPending}
                className="px-5 py-2 rounded-lg bg-amber-700 hover:bg-amber-600 disabled:opacity-60 text-white text-sm font-medium transition-colors">
                {saveMut.isPending ? 'Saving…' : editId ? 'Update Item' : 'Save Item'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditId(null); setForm(EMPTY_ITEM); }}
                className="px-5 py-2 rounded-lg border border-zinc-300 text-zinc-600 hover:bg-zinc-50 text-sm font-medium transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Items table */}
      <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-zinc-400 animate-pulse">Loading…</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-zinc-400 text-sm">No items yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm whitespace-nowrap">
              <thead>
                <tr className="bg-amber-50 border-b border-amber-200">
                  {['','#','Tag No','Status','Sale Date','Purity','Gold (g)','Months','MS Share ₨','SG Share ₨',''].map((h, i) => (
                    <th key={i} className="px-4 py-3 text-left text-xs font-semibold text-amber-800 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <Fragment key={item._id}>
                    <tr
                      className={`border-b border-zinc-100 cursor-pointer hover:bg-amber-50/40 ${idx % 2 !== 0 ? 'bg-zinc-50/30' : ''} ${expandedId === item._id ? 'bg-amber-50/60' : ''}`}
                      onClick={() => setExpandedId(v => v === item._id ? null : item._id)}
                    >
                      <td className="px-3 py-3 text-zinc-400 text-xs">{expandedId === item._id ? '▲' : '▼'}</td>
                      <td className="px-4 py-3 text-zinc-400 text-xs">{item.srNo}</td>
                      <td className="px-4 py-3 font-medium text-zinc-800">{item.tagNo}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.status === 'sold' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                          {item.status === 'sold' ? 'Sold' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-600">{item.salesDate || '—'}</td>
                      <td className="px-4 py-3 text-zinc-600">{item.purity}K</td>
                      <td className="px-4 py-3 text-right text-zinc-700">{fmtGold(item.initialGoldWeight)}</td>
                      <td className="px-4 py-3 text-right text-zinc-500 text-xs">{item.months.filter(m => m.month).length}</td>
                      <td className="px-4 py-3 text-right font-semibold text-amber-700">{fmt(item.totalMsShare)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-stone-600">{fmt(item.totalSgShare)}</td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <div className="flex gap-1.5">
                          <button onClick={() => openEdit(item)}
                            className="text-xs px-2 py-1 rounded border border-amber-300 text-amber-700 hover:bg-amber-50 transition-colors">
                            Edit
                          </button>
                          <button
                            onClick={() => { if (confirm('Delete this item and all its monthly data?')) deleteMut.mutate(item._id); }}
                            className="text-xs px-2 py-1 rounded border border-red-200 text-red-500 hover:bg-red-50 transition-colors">
                            Del
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedId === item._id && (
                      <tr>
                        <td colSpan={11} className="p-0">
                          <MonthForm item={item} onDone={() => setExpandedId(null)} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
