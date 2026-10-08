'use client';

import { useMemo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { KpiCard } from './KpiCard';
import { DataTable } from './DataTable';
import { ItemShareChart } from './ItemShareChart';
import { fmt, fmtGold, fmtRate } from '@/lib/utils';
import { REPORT_CONFIG } from '@/lib/config';
import type { DashboardData, Report1Item } from '@/lib/types';

export function Report1View({ data }: { data: DashboardData['report1'] }) {
  const columns = useMemo<ColumnDef<Report1Item, unknown>[]>(
    () => [
      {
        accessorKey: 'tagNo',
        header: 'Tag No',
        cell: ({ getValue }) => (
          <span className="font-medium text-zinc-900">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        enableSorting: false,
        cell: ({ getValue }) => {
          const inStock = getValue<string | undefined>() === 'stock';
          return (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${inStock ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
              {inStock ? 'In stock' : 'Sold'}
            </span>
          );
        },
      },
      {
        accessorKey: 'stockDate',
        header: 'Stock Date',
        cell: ({ getValue }) => (
          <span className="text-zinc-600">{getValue<string | undefined>() || '—'}</span>
        ),
      },
      {
        accessorKey: 'salesDate',
        header: 'Sale Date',
        cell: ({ getValue }) => (
          <span className="text-zinc-600">{getValue<string>() || '—'}</span>
        ),
      },
      {
        accessorKey: 'goldWeightG',
        header: 'Gold (g)',
        meta: { align: 'right' },
        cell: ({ getValue }) => fmtGold(getValue<number>()),
      },
      {
        accessorKey: 'goldRate22K',
        header: 'Rate 22K',
        meta: { align: 'right' },
        cell: ({ getValue }) => fmtRate(getValue<number>()),
      },
      {
        accessorKey: 'purity',
        header: 'Purity',
        meta: { align: 'center' },
        cell: ({ getValue }) => <span className="text-zinc-600">{getValue<number>()}K</span>,
      },
      {
        accessorKey: 'goldSellPrice',
        header: 'Gold Sell Price',
        meta: { align: 'right' },
        cell: ({ getValue }) => fmt(getValue<number>()),
      },
      {
        accessorKey: 'labourProfitCharged',
        header: 'Labour Profit',
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
    ],
    [],
  );

  const chartData = data.items.filter(item => item.status !== 'stock').map(item => ({
    name: item.tagNo,
    msShare: item.msShare,
    sgShare: item.sgShare,
  }));

  const t = data.totals;

  return (
    <div className="space-y-6">
      {/* KPI summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Gold Sell Price" value={fmt(t.goldSellPrice)} />
        <KpiCard label="Total Labour Profit" value={fmt(t.labourProfitCharged)} />
        <KpiCard
          label={`${REPORT_CONFIG.ms.label} Share (60%)`}
          value={fmt(t.msShare)}
          accent
        />
        <KpiCard label={`${REPORT_CONFIG.sg.label} Share (40%)`} value={fmt(t.sgShare)} />
        {data.stockCount > 0 && (
          <KpiCard
            label="In Stock"
            value={`${data.stockCount} pcs`}
            subLabel={`${fmtGold(data.stockWeight)} · not sold yet`}
          />
        )}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-amber-100">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-4">
          Profit Share per Item
        </p>
        <ItemShareChart data={chartData} />
      </div>

      {/* TanStack Table */}
      <DataTable
        data={data.items}
        columns={columns}
        footer={
          <>
            <td className="px-4 py-3 text-amber-900" colSpan={7}>TOTAL</td>
            <td className="px-4 py-3 text-right text-amber-900">{fmt(t.goldSellPrice)}</td>
            <td className="px-4 py-3 text-right text-amber-900">{fmt(t.labourProfitCharged)}</td>
            <td className="px-4 py-3 text-right text-amber-900">{fmt(t.operatingCost)}</td>
            <td className="px-4 py-3 text-right text-amber-700">{fmt(t.msShare)}</td>
            <td className="px-4 py-3 text-right text-stone-600">{fmt(t.sgShare)}</td>
          </>
        }
      />
    </div>
  );
}
