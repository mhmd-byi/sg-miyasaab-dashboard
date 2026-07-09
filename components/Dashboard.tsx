'use client';

import { useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { KpiCard } from './KpiCard';
import { Report1View } from './Report1View';
import { Report2View } from './Report2View';
import { Report3View } from './Report3View';
import { UserMenu } from './UserMenu';
import { fmt, fmtGold } from '@/lib/utils';
import { REPORT_CONFIG } from '@/lib/config';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import type { DashboardData } from '@/lib/types';

type Tab = 'report1' | 'report2' | 'report3';

const TABS: { id: Tab; config: typeof REPORT_CONFIG.report1 }[] = [
  { id: 'report3', config: REPORT_CONFIG.report3 },
  { id: 'report1', config: REPORT_CONFIG.report1 },
  { id: 'report2', config: REPORT_CONFIG.report2 },
];

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.json();
}

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('report3');
  const { data: currentUser } = useCurrentUser();

  const [r1, r2, r3] = useQueries({
    queries: [
      {
        queryKey: ['report1'],
        queryFn: () => fetchJson<DashboardData['report1']>('/api/reports/report1'),
      },
      {
        queryKey: ['report2'],
        queryFn: () => fetchJson<DashboardData['report2']>('/api/reports/report2'),
      },
      {
        queryKey: ['report3'],
        queryFn: () => fetchJson<DashboardData['report3']>('/api/reports/report3'),
      },
    ],
  });

  const isLoading = r1.isLoading || r2.isLoading || r3.isLoading;
  const isAdmin = currentUser?.role === 'admin';
  const isEmpty =
    !isLoading &&
    (r1.data?.items?.length ?? 0) === 0 &&
    (r2.data?.items?.length ?? 0) === 0 &&
    (r3.data?.months?.length ?? 0) === 0;

  // ── Combined totals ──────────────────────────────────────────────────────────
  const overallMs =
    (r1.data?.totals.msShare ?? 0) +
    (r2.data?.totals.msShare ?? 0) +
    (r3.data?.totals.msShare ?? 0);
  const overallSg =
    (r1.data?.totals.sgShare ?? 0) +
    (r2.data?.totals.sgShare ?? 0) +
    (r3.data?.totals.sgShare ?? 0);
  const overallOp =
    (r1.data?.totals.operatingCost ?? 0) +
    (r2.data?.totals.operatingCost ?? 0) +
    (r3.data?.totals.operatingCost ?? 0);

  const activeConfig = TABS.find(t => t.id === activeTab)!.config;

  return (
    <div className="min-h-screen bg-amber-50">
      {/* ── Header ── */}
      <header className="bg-amber-900 text-white px-6 py-5 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">SG — Miyasaab Dashboard</h1>
            <p className="text-amber-200 text-sm mt-0.5">
              Gold &amp; Jewellery Partnership · P&amp;L Reports
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-amber-300 text-xs hidden sm:block">
              MS {REPORT_CONFIG.ms.share}% · SG {REPORT_CONFIG.sg.share}%
            </span>
            {currentUser && <UserMenu user={currentUser} />}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* ── Loading skeleton ── */}
        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
              <div key={i} className="bg-white rounded-xl p-5 border border-amber-100 animate-pulse">
                <div className="h-3 bg-amber-100 rounded w-1/2 mb-3" />
                <div className="h-7 bg-amber-100 rounded w-3/4" />
              </div>
            ))}
          </div>
        )}

        {/* ── Empty state ── */}
        {isEmpty && (
          <div className="bg-white rounded-xl p-10 border border-amber-200 text-center shadow-sm">
            <p className="text-lg font-semibold text-zinc-700 mb-2">No data yet</p>
            <p className="text-sm text-zinc-400">
              {isAdmin
                ? <>Go to <strong>Data Entry</strong> to add records.</>
                : 'No data has been loaded yet. Please ask an admin to add data.'}
            </p>
          </div>
        )}

        {!isLoading && !isEmpty && (
          <>
            {/* ── Section: Executive Summary — 10 KPI cards ── */}
            <section>
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-700 mb-3">
                Executive Summary — Key Performance Indicators
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                <KpiCard
                  label="Total Pieces"
                  value={String(r2.data?.totalPieces ?? 0)}
                  subLabel="All inventory items"
                />
                <KpiCard
                  label="Sold Pieces"
                  value={String(r2.data?.soldPieces ?? 0)}
                  subLabel="Items sold"
                />
                <KpiCard
                  label="In Stock"
                  value={String(r2.data?.inStock ?? 0)}
                  subLabel="Pending inventory"
                />
                <KpiCard
                  label="Total Gold Weight (g)"
                  value={fmtGold(r2.data?.totalFineGoldWeight ?? 0)}
                  subLabel="Fine weight · all items"
                />
                <KpiCard
                  label="P&L 1 Holding Profit"
                  value={fmt(r1.data?.totals.labourSharableProfit ?? 0)}
                  subLabel="Ornaments Sold sharable profit"
                />
                <KpiCard
                  label="P&L 2 Holding Profit"
                  value={fmt(r2.data?.totals.labourSharableProfit ?? 0)}
                  subLabel="Ornaments Inventory sharable profit"
                />
                <KpiCard
                  label="P&L 3 Holding Profit"
                  value={fmt(r3.data?.totals.labourSharableProfit ?? 0)}
                  subLabel="Pure Gold sharable profit"
                />
                <KpiCard
                  label="MS Total Share"
                  value={fmt(overallMs)}
                  subLabel="All reports combined"
                  accent
                />
                <KpiCard
                  label="SG Total Share"
                  value={fmt(overallSg)}
                  subLabel="All reports combined"
                />
                <KpiCard
                  label="Total Op. Cost (15%)"
                  value={fmt(overallOp)}
                  subLabel="All reports combined"
                />
              </div>
            </section>

            {/* ── Section: Consolidated P&L Summary ── */}
            <section>
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-700 mb-3">
                Consolidated P&amp;L Summary — Both Reports Combined
              </p>
              <div className="bg-white rounded-xl shadow-sm border border-amber-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm whitespace-nowrap">
                    <thead>
                      <tr className="bg-amber-50 border-b border-amber-200">
                        {['Report', 'Category', 'Labour Sell Price', 'Sharable Profit', 'Op Cost (15%)', 'MS Share', 'SG Share', 'MS Gold (g)'].map((h, i) => (
                          <th key={i} className={`px-4 py-3 text-xs font-semibold text-amber-800 uppercase tracking-wide ${i < 2 ? 'text-left' : 'text-right'}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-zinc-100 hover:bg-amber-50/30">
                        <td className="px-4 py-3 font-medium text-zinc-800">P&amp;L Report 1 (SG Design – Sold)</td>
                        <td className="px-4 py-3 text-zinc-500 text-xs">22K Gold</td>
                        <td className="px-4 py-3 text-right text-zinc-700">{fmt(r1.data?.totals.goldSellPrice ?? 0)}</td>
                        <td className="px-4 py-3 text-right text-zinc-700">{fmt(r1.data?.totals.labourSharableProfit ?? 0)}</td>
                        <td className="px-4 py-3 text-right text-zinc-500">{fmt(r1.data?.totals.operatingCost ?? 0)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-amber-700">{fmt(r1.data?.totals.msShare ?? 0)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-stone-600">{fmt(r1.data?.totals.sgShare ?? 0)}</td>
                        <td className="px-4 py-3 text-right text-zinc-400 text-xs">N/A</td>
                      </tr>
                      <tr className="border-b border-zinc-100 hover:bg-amber-50/30">
                        <td className="px-4 py-3 font-medium text-zinc-800">P&amp;L Report 2 (MS Design – Holding)</td>
                        <td className="px-4 py-3 text-zinc-500 text-xs">22K+24K Gold</td>
                        <td className="px-4 py-3 text-right text-zinc-700">{fmt(r2.data?.totals.labourSharableProfit ?? 0)}</td>
                        <td className="px-4 py-3 text-right text-zinc-700">{fmt(r2.data?.totals.labourSharableProfit ?? 0)}</td>
                        <td className="px-4 py-3 text-right text-zinc-500">{fmt(r2.data?.totals.operatingCost ?? 0)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-amber-700">{fmt(r2.data?.totals.msShare ?? 0)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-stone-600">{fmt(r2.data?.totals.sgShare ?? 0)}</td>
                        <td className="px-4 py-3 text-right text-zinc-500 text-xs">
                          {fmtGold(r2.data?.items.reduce((s, i) => s + i.months.reduce((ms, m) => ms + m.msProfitInGold, 0), 0) ?? 0)}g
                        </td>
                      </tr>
                      <tr className="bg-amber-50/60 font-semibold">
                        <td className="px-4 py-3 text-amber-900" colSpan={2}>Combined Total</td>
                        <td className="px-4 py-3 text-right text-amber-900">
                          {fmt((r1.data?.totals.goldSellPrice ?? 0) + (r2.data?.totals.labourSharableProfit ?? 0))}
                        </td>
                        <td className="px-4 py-3 text-right text-amber-900">
                          {fmt((r1.data?.totals.labourSharableProfit ?? 0) + (r2.data?.totals.labourSharableProfit ?? 0))}
                        </td>
                        <td className="px-4 py-3 text-right text-amber-900">
                          {fmt((r1.data?.totals.operatingCost ?? 0) + (r2.data?.totals.operatingCost ?? 0))}
                        </td>
                        <td className="px-4 py-3 text-right text-amber-700">
                          {fmt((r1.data?.totals.msShare ?? 0) + (r2.data?.totals.msShare ?? 0))}
                        </td>
                        <td className="px-4 py-3 text-right text-stone-600">
                          {fmt((r1.data?.totals.sgShare ?? 0) + (r2.data?.totals.sgShare ?? 0))}
                        </td>
                        <td />
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* ── Section: Partner Profit Split ── */}
            <section>
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-700 mb-3">
                Partner Profit Split — MS vs SG
              </p>
              <div className="bg-white rounded-xl shadow-sm border border-amber-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm whitespace-nowrap">
                    <thead>
                      <tr className="bg-amber-50 border-b border-amber-200">
                        {['Partner', 'P&L 1 Share', 'P&L 2 Share', 'P&L 3 Share', 'Combined Share', 'Share %', 'MS Gold (g)'].map((h, i) => (
                          <th key={i} className={`px-4 py-3 text-xs font-semibold text-amber-800 uppercase tracking-wide ${i === 0 ? 'text-left' : 'text-right'}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const r1ms = r1.data?.totals.msShare ?? 0;
                        const r2ms = r2.data?.totals.msShare ?? 0;
                        const r3ms = r3.data?.totals.msShare ?? 0;
                        const r1sg = r1.data?.totals.sgShare ?? 0;
                        const r2sg = r2.data?.totals.sgShare ?? 0;
                        const r3sg = r3.data?.totals.sgShare ?? 0;
                        const r1op = r1.data?.totals.operatingCost ?? 0;
                        const r2op = r2.data?.totals.operatingCost ?? 0;
                        const r3op = r3.data?.totals.operatingCost ?? 0;
                        const msTotal = r1ms + r2ms + r3ms;
                        const sgTotal = r1sg + r2sg + r3sg;
                        const opTotal = r1op + r2op + r3op;
                        const grandTotal = msTotal + sgTotal + opTotal;
                        const msMsGold = r2.data?.items.reduce((s, i) => s + i.months.reduce((ms, m) => ms + m.msProfitInGold, 0), 0) ?? 0;
                        return (
                          <>
                            <tr className="border-b border-zinc-100 hover:bg-amber-50/30">
                              <td className="px-4 py-3 font-semibold text-amber-800">{REPORT_CONFIG.ms.label}</td>
                              <td className="px-4 py-3 text-right text-zinc-700">{fmt(r1ms)}</td>
                              <td className="px-4 py-3 text-right text-zinc-700">{fmt(r2ms)}</td>
                              <td className="px-4 py-3 text-right text-zinc-700">{fmt(r3ms)}</td>
                              <td className="px-4 py-3 text-right font-semibold text-amber-700">{fmt(msTotal)}</td>
                              <td className="px-4 py-3 text-right text-zinc-500">
                                {grandTotal > 0 ? (msTotal / grandTotal * 100).toFixed(2) : '0.00'}%
                              </td>
                              <td className="px-4 py-3 text-right text-zinc-400 text-xs">{fmtGold(msMsGold)}g</td>
                            </tr>
                            <tr className="border-b border-zinc-100 hover:bg-amber-50/30">
                              <td className="px-4 py-3 font-semibold text-stone-700">{REPORT_CONFIG.sg.label}</td>
                              <td className="px-4 py-3 text-right text-zinc-700">{fmt(r1sg)}</td>
                              <td className="px-4 py-3 text-right text-zinc-700">{fmt(r2sg)}</td>
                              <td className="px-4 py-3 text-right text-zinc-700">{fmt(r3sg)}</td>
                              <td className="px-4 py-3 text-right font-semibold text-stone-600">{fmt(sgTotal)}</td>
                              <td className="px-4 py-3 text-right text-zinc-500">
                                {grandTotal > 0 ? (sgTotal / grandTotal * 100).toFixed(2) : '0.00'}%
                              </td>
                              <td className="px-4 py-3 text-right text-zinc-400 text-xs">N/A</td>
                            </tr>
                            <tr className="border-b border-zinc-100 hover:bg-amber-50/30">
                              <td className="px-4 py-3 text-zinc-600">Operating Cost (15%)</td>
                              <td className="px-4 py-3 text-right text-zinc-500">{fmt(r1op)}</td>
                              <td className="px-4 py-3 text-right text-zinc-500">{fmt(r2op)}</td>
                              <td className="px-4 py-3 text-right text-zinc-500">{fmt(r3op)}</td>
                              <td className="px-4 py-3 text-right font-semibold text-zinc-600">{fmt(opTotal)}</td>
                              <td className="px-4 py-3 text-right text-zinc-500">
                                {grandTotal > 0 ? (opTotal / grandTotal * 100).toFixed(2) : '0.00'}%
                              </td>
                              <td className="px-4 py-3 text-right text-zinc-400 text-xs">N/A</td>
                            </tr>
                          </>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* ── Section: Batch-wise Stock Summary ── */}
            {(r2.data?.batchSummary?.length ?? 0) > 0 && (
              <section>
                <p className="text-xs font-semibold uppercase tracking-widest text-amber-700 mb-3">
                  Batch-wise Stock Introduction Summary
                </p>
                <div className="bg-white rounded-xl shadow-sm border border-amber-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm whitespace-nowrap">
                      <thead>
                        <tr className="bg-amber-50 border-b border-amber-200">
                          {['Batch', 'Intro Date', 'Items', 'Total Wt (g)', 'Sold Items', 'In Stock', 'Sold Wt (g)'].map((h, i) => (
                            <th key={i} className={`px-4 py-3 text-xs font-semibold text-amber-800 uppercase tracking-wide ${i < 2 ? 'text-left' : 'text-right'}`}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {r2.data!.batchSummary.map((b, idx) => (
                          <tr key={idx} className="border-b border-zinc-100 hover:bg-amber-50/30">
                            <td className="px-4 py-3 font-medium text-zinc-800">{b.batch}</td>
                            <td className="px-4 py-3 text-zinc-600">{b.introDate || '—'}</td>
                            <td className="px-4 py-3 text-right text-zinc-700">{b.totalItems}</td>
                            <td className="px-4 py-3 text-right text-zinc-700">{fmtGold(b.totalFineGoldWeight)}</td>
                            <td className="px-4 py-3 text-right text-green-700 font-medium">{b.soldItems}</td>
                            <td className="px-4 py-3 text-right text-amber-700 font-medium">{b.inStock}</td>
                            <td className="px-4 py-3 text-right text-zinc-600">{fmtGold(b.soldFineGoldWeight)}</td>
                          </tr>
                        ))}
                        <tr className="bg-amber-50/60 font-semibold border-t border-amber-200">
                          <td className="px-4 py-3 text-amber-900">{r2.data!.batchSummary.length} Batches</td>
                          <td className="px-4 py-3 text-amber-700 text-xs">Total</td>
                          <td className="px-4 py-3 text-right text-amber-900">{r2.data!.totalPieces}</td>
                          <td className="px-4 py-3 text-right text-amber-900">{fmtGold(r2.data!.totalFineGoldWeight)}</td>
                          <td className="px-4 py-3 text-right text-green-700">{r2.data!.soldPieces}</td>
                          <td className="px-4 py-3 text-right text-amber-700">{r2.data!.inStock}</td>
                          <td className="px-4 py-3 text-right text-amber-900">
                            {fmtGold(r2.data!.batchSummary.reduce((s, b) => s + b.soldFineGoldWeight, 0))}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}

            {/* ── Per-report quick cards ── */}
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {TABS.map(tab => {
                const totals =
                  tab.id === 'report1'
                    ? r1.data?.totals
                    : tab.id === 'report2'
                    ? r2.data?.totals
                    : r3.data?.totals;
                const ms = totals?.msShare ?? 0;
                const sg = totals?.sgShare ?? 0;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`text-left rounded-xl p-4 border transition-all shadow-sm ${
                      active
                        ? 'bg-amber-700 border-amber-700 text-white'
                        : 'bg-white border-amber-200 hover:border-amber-400 text-zinc-800'
                    }`}
                  >
                    <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${active ? 'text-amber-200' : 'text-amber-700'}`}>
                      {tab.config.label}
                    </p>
                    <p className={`text-lg font-bold ${active ? 'text-white' : 'text-amber-700'}`}>
                      {fmt(ms + sg)}
                    </p>
                    <p className={`text-xs mt-0.5 ${active ? 'text-amber-100' : 'text-zinc-400'}`}>
                      MS {fmt(ms)} · SG {fmt(sg)}
                    </p>
                  </button>
                );
              })}
            </section>

            {/* ── Tab content ── */}
            <section>
              <div className="flex gap-0 border-b border-amber-200">
                {TABS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-5 py-2.5 text-sm font-medium rounded-t-lg border-b-2 -mb-px transition-colors ${
                      activeTab === tab.id
                        ? 'bg-white border-amber-700 text-amber-800'
                        : 'border-transparent text-zinc-500 hover:text-amber-700'
                    }`}
                  >
                    {tab.config.label}
                  </button>
                ))}
              </div>
              <div className="bg-white px-5 py-2.5 border-x border-b border-amber-100 rounded-b-lg mb-5">
                <p className="text-xs text-zinc-500">{activeConfig.description}</p>
              </div>

              {activeTab === 'report3' && r3.data && <Report3View data={r3.data} />}
              {activeTab === 'report1' && r1.data && <Report1View data={r1.data} />}
              {activeTab === 'report2' && r2.data && <Report2View data={r2.data} />}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
