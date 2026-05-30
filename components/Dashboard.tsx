'use client';

import { useState } from 'react';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { KpiCard } from './KpiCard';
import { Report1View } from './Report1View';
import { Report2View } from './Report2View';
import { Report3View } from './Report3View';
import { UserMenu } from './UserMenu';
import { fmt } from '@/lib/utils';
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
  const [seeding, setSeeding] = useState(false);
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();
  const isAdmin = currentUser?.role === 'admin';

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
  const isEmpty =
    !isLoading &&
    (r1.data?.items?.length ?? 0) === 0 &&
    (r2.data?.items?.length ?? 0) === 0 &&
    (r3.data?.months?.length ?? 0) === 0;

  async function handleSync() {
    setSeeding(true);
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      const body = await res.json();
      if (!body.ok) throw new Error(body.error);
      await queryClient.invalidateQueries();
    } catch (e) {
      alert('Sync failed: ' + String(e));
    } finally {
      setSeeding(false);
    }
  }

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
            {isAdmin && (
              <button
                onClick={handleSync}
                disabled={seeding}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-700 hover:bg-amber-600 disabled:opacity-60 text-white text-sm font-medium transition-colors shadow-sm"
              >
                {seeding ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Syncing…
                  </>
                ) : (
                  <>↻ Sync from Excel</>
                )}
              </button>
            )}
            {currentUser && <UserMenu user={currentUser} />}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* ── Loading skeleton ── */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl p-5 border border-amber-100 animate-pulse">
                <div className="h-3 bg-amber-100 rounded w-1/2 mb-3" />
                <div className="h-7 bg-amber-100 rounded w-3/4" />
              </div>
            ))}
          </div>
        )}

        {/* ── Empty / not seeded ── */}
        {isEmpty && (
          <div className="bg-white rounded-xl p-10 border border-amber-200 text-center shadow-sm">
            <p className="text-lg font-semibold text-zinc-700 mb-2">No data yet</p>
            <p className="text-sm text-zinc-400 mb-5">
              {isAdmin
                ? <>Click <strong>Sync from Excel</strong> to import the latest data.</>
                : 'No data has been loaded yet. Please ask an admin to sync the data.'}
            </p>
            {isAdmin && (
              <button
                onClick={handleSync}
                disabled={seeding}
                className="px-6 py-2.5 rounded-lg bg-amber-700 hover:bg-amber-600 text-white text-sm font-medium transition-colors"
              >
                {seeding ? 'Syncing…' : '↻ Sync from Excel'}
              </button>
            )}
          </div>
        )}

        {/* ── Overall summary ── */}
        {!isLoading && !isEmpty && (
          <>
            <section>
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-700 mb-3">
                Overall Summary — All Reports Combined
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <KpiCard
                  label={`Total ${REPORT_CONFIG.ms.label} Share`}
                  value={fmt(overallMs)}
                  subLabel="60% of net profit across all reports"
                  accent
                />
                <KpiCard
                  label={`Total ${REPORT_CONFIG.sg.label} Share`}
                  value={fmt(overallSg)}
                  subLabel="40% of net profit across all reports"
                />
                <KpiCard
                  label="Total Operating Cost"
                  value={fmt(overallOp)}
                  subLabel="15% deduction across all reports"
                />
              </div>
            </section>

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
