'use client';

import { useMemo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { KpiCard } from './KpiCard';
import { DataTable } from './DataTable';
import { MonthlyChart } from './MonthlyChart';
import { fmt, fmtGold, fmtRate } from '@/lib/utils';
import { REPORT_CONFIG } from '@/lib/config';
import type { DashboardData, MonthRow } from '@/lib/types';

export function Report3View({ data }: { data: DashboardData['report3'] }) {
  const columns = useMemo<ColumnDef<MonthRow, unknown>[]>(
    () => [
      {
        accessorKey: 'month',
        header: 'Month',
        cell: ({ getValue }) => (
          <span className="font-medium text-zinc-900">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'cumulativeGoldWeight',
        header: 'Gold (g)',
        meta: { align: 'right' },
        cell: ({ getValue }) => fmtGold(getValue<number>()),
      },
      {
        accessorKey: 'goldRate24K',
        header: 'Rate 24K',
        meta: { align: 'right' },
        cell: ({ getValue }) => fmtRate(getValue<number>()),
      },
      {
        accessorKey: 'salesPM',
        header: 'Sales PM (g)',
        meta: { align: 'right' },
        cell: ({ getValue }) => fmtGold(getValue<number>()),
      },
      {
        accessorKey: 'labourProfitCharged',
        header: 'Labour Profit',
        meta: { align: 'right' },
        cell: ({ getValue }) => fmt(getValue<number>()),
      },
      {
        accessorKey: 'labourSharableProfit',
        header: 'Sharable Profit',
        meta: { align: 'right' },
        cell: ({ getValue }) => fmt(getValue<number>()),
      },
      {
        accessorKey: 'operatingCost',
        header: 'Op. Cost (15%)',
        meta: { align: 'right' },
        cell: ({ getValue }) => (
          <span className="text-zinc-500">{fmt(getValue<number>())}</span>
        ),
      },
      {
        accessorKey: 'msShare',
        header: 'MS Share',
        meta: { align: 'right' },
        cell: ({ getValue }) => (
          <span className="font-semibold text-amber-700">{fmt(getValue<number>())}</span>
        ),
      },
      {
        accessorKey: 'sgShare',
        header: 'SG Share',
        meta: { align: 'right' },
        cell: ({ getValue }) => (
          <span className="font-semibold text-stone-600">{fmt(getValue<number>())}</span>
        ),
      },
      {
        accessorKey: 'msProfitInGold',
        header: 'MS Gold (g)',
        meta: { align: 'right' },
        cell: ({ getValue }) => (
          <span className="text-zinc-400">{fmtGold(getValue<number>())}</span>
        ),
      },
    ],
    [],
  );

  const chartData = data.months.map(m => ({
    month: m.month,
    msShare: m.msShare,
    sgShare: m.sgShare,
  }));

  const t = data.totals;

  return (
    <div className="space-y-6">
      {/* KPI summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Initial Gold Weight"
          value={fmtGold(data.initialGoldWeight)}
          subLabel="Starting holdings"
        />
        <KpiCard label="Operating Cost (15%)" value={fmt(t.operatingCost)} />
        <KpiCard
          label={`${REPORT_CONFIG.ms.label} Share (60%)`}
          value={fmt(t.msShare)}
          accent
        />
        <KpiCard label={`${REPORT_CONFIG.sg.label} Share (40%)`} value={fmt(t.sgShare)} />
      </div>

      {/* Monthly trend chart */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-amber-100">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-4">
          Monthly Profit Share Trend — click columns to sort
        </p>
        <MonthlyChart data={chartData} />
      </div>

      {/* TanStack Table */}
      <DataTable
        data={data.months}
        columns={columns}
        footer={
          <>
            <td className="px-4 py-3 text-amber-900" colSpan={6}>TOTAL</td>
            <td className="px-4 py-3 text-right text-amber-900">{fmt(t.operatingCost)}</td>
            <td className="px-4 py-3 text-right text-amber-700">{fmt(t.msShare)}</td>
            <td className="px-4 py-3 text-right text-stone-600">{fmt(t.sgShare)}</td>
            <td className="px-4 py-3" />
          </>
        }
      />
    </div>
  );
}
