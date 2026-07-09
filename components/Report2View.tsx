'use client';

import { useMemo, useState, Fragment } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getExpandedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ExpandedState,
} from '@tanstack/react-table';
import { KpiCard } from './KpiCard';
import { fmt, fmtGold } from '@/lib/utils';
import { REPORT_CONFIG } from '@/lib/config';
import type { DashboardData, Report2Item, MonthRow } from '@/lib/types';

type FilterView = 'sold' | 'pending' | 'all';

// ── Sub-table for monthly breakdown ─────────────────────────────────────────

function MonthsTable({ months }: { months: MonthRow[] }) {
  const valid = months.filter(m => m.month);
  if (!valid.length) return <p className="text-xs text-zinc-400 p-4">No monthly data.</p>;
  return (
    <div className="overflow-x-auto border-t border-amber-100 bg-amber-50/30">
      <table className="w-full text-xs whitespace-nowrap">
        <thead>
          <tr className="border-b border-amber-200">
            {['Month', 'Gold (g)', 'Rate 24K', 'Labour Profit', 'Sharable Profit', 'Op. Cost', 'MS Share', 'SG Share', 'MS Gold (g)'].map(h => (
              <th key={h} className={`px-3 py-2 text-amber-700 font-semibold ${h === 'Month' ? 'text-left' : 'text-right'}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {valid.map(m => (
            <tr key={m.month} className="border-b border-zinc-100 hover:bg-amber-50/40">
              <td className="px-3 py-1.5 font-medium text-zinc-700">{m.month}</td>
              <td className="px-3 py-1.5 text-right text-zinc-600">{fmtGold(m.cumulativeGoldWeight)}</td>
              <td className="px-3 py-1.5 text-right text-zinc-600">{m.goldRate24K.toLocaleString()}</td>
              <td className="px-3 py-1.5 text-right text-zinc-600">{fmt(m.labourProfitCharged)}</td>
              <td className="px-3 py-1.5 text-right text-zinc-600">{fmt(m.labourSharableProfit)}</td>
              <td className="px-3 py-1.5 text-right text-zinc-500">{fmt(m.operatingCost)}</td>
              <td className="px-3 py-1.5 text-right font-semibold text-amber-700">{fmt(m.msShare)}</td>
              <td className="px-3 py-1.5 text-right font-semibold text-stone-600">{fmt(m.sgShare)}</td>
              <td className="px-3 py-1.5 text-right text-zinc-400">{fmtGold(m.msProfitInGold)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Main view ────────────────────────────────────────────────────────────────

export function Report2View({ data }: { data: DashboardData['report2'] }) {
  const [filter, setFilter] = useState<FilterView>('sold');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [expanded, setExpanded] = useState<ExpandedState>({});

  const displayItems =
    filter === 'sold' ? data.sold : filter === 'pending' ? data.pending : data.items;

  const columns = useMemo<ColumnDef<Report2Item, unknown>[]>(
    () => [
      {
        id: 'expander',
        header: '',
        enableSorting: false,
        meta: { align: 'center', className: 'w-8' },
        cell: ({ row }) => (
          <button
            onClick={e => { e.stopPropagation(); row.toggleExpanded(); }}
            className="text-zinc-400 hover:text-amber-700 transition-colors text-xs"
          >
            {row.getIsExpanded() ? '▲' : '▼'}
          </button>
        ),
      },
      {
        accessorKey: 'srNo',
        header: '#',
        meta: { align: 'right', className: 'w-10' },
        cell: ({ getValue }) => <span className="text-zinc-400 text-xs">{getValue<number>()}</span>,
      },
      {
        accessorKey: 'tagNo',
        header: 'Tag No',
        cell: ({ getValue }) => (
          <span className="font-medium text-zinc-900">{getValue<string>() || '—'}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        enableSorting: false,
        cell: ({ getValue }) => {
          const v = getValue<string>();
          return (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${v === 'sold' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
              {v === 'sold' ? 'Sold' : 'Pending'}
            </span>
          );
        },
      },
      {
        accessorKey: 'salesDate',
        header: 'Sale Date',
        cell: ({ getValue }) => <span className="text-zinc-600">{getValue<string>() || '—'}</span>,
      },
      {
        accessorKey: 'initialGoldWeight',
        header: 'Gold (g)',
        meta: { align: 'right' },
        cell: ({ getValue }) => fmtGold(getValue<number>()),
      },
      {
        id: 'monthCount',
        header: 'Months',
        meta: { align: 'right' },
        accessorFn: (row: Report2Item) => row.months.filter(m => m.month).length,
        cell: ({ getValue }) => <span className="text-zinc-500 text-xs">{getValue<number>()}</span>,
      },
      {
        accessorKey: 'totalMsShare',
        header: 'MS Share',
        meta: { align: 'right' },
        cell: ({ getValue }) => (
          <span className="font-semibold text-amber-700">{fmt(getValue<number>())}</span>
        ),
      },
      {
        accessorKey: 'totalSgShare',
        header: 'SG Share',
        meta: { align: 'right' },
        cell: ({ getValue }) => (
          <span className="font-semibold text-stone-600">{fmt(getValue<number>())}</span>
        ),
      },
      {
        accessorKey: 'totalOperatingCost',
        header: 'Op. Cost',
        meta: { align: 'right' },
        cell: ({ getValue }) => (
          <span className="text-zinc-500">{fmt(getValue<number>())}</span>
        ),
      },
      {
        accessorKey: 'batch',
        header: 'Batch',
        enableSorting: false,
        cell: ({ getValue }) => (
          <span className="text-xs text-zinc-500">{getValue<string>() || '—'}</span>
        ),
      },
      {
        accessorKey: 'notes',
        header: 'Notes',
        enableSorting: false,
        cell: ({ getValue }) => (
          <span className="text-xs text-zinc-400">{getValue<string>() || '—'}</span>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: displayItems,
    columns,
    state: { sorting, expanded },
    onSortingChange: setSorting,
    onExpandedChange: setExpanded,
    getRowCanExpand: () => true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  });

  const t = data.totals;

  return (
    <div className="space-y-6">
      {/* KPI summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label={`${REPORT_CONFIG.ms.label} Share (60%)`} value={fmt(t.msShare)} accent />
        <KpiCard label={`${REPORT_CONFIG.sg.label} Share (40%)`} value={fmt(t.sgShare)} />
        <KpiCard label="Operating Cost (15%)" value={fmt(t.operatingCost)} />
        <KpiCard
          label="Inventory Status"
          value={`${data.sold.length} Sold`}
          subLabel={`${data.pending.length} pending of ${data.items.length} total`}
        />
      </div>

      {/* Filter + hint */}
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            { id: 'sold' as FilterView, label: `Sold (${data.sold.length})` },
            { id: 'pending' as FilterView, label: `Pending (${data.pending.length})` },
            { id: 'all' as FilterView, label: `All (${data.items.length})` },
          ]
        ).map(tab => (
          <button
            key={tab.id}
            onClick={() => { setFilter(tab.id); setExpanded({}); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === tab.id
                ? 'bg-amber-700 text-white shadow-sm'
                : 'bg-white text-zinc-600 border border-amber-200 hover:bg-amber-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
        <span className="text-xs text-zinc-400 ml-1">▼ expand a row for monthly breakdown · click columns to sort</span>
      </div>

      {/* TanStack Table with expandable rows */}
      <div className="bg-white rounded-xl shadow-sm border border-amber-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead>
              {table.getHeaderGroups().map(hg => (
                <tr key={hg.id} className="bg-amber-50 border-b border-amber-200">
                  {hg.headers.map(header => {
                    const align = header.column.columnDef.meta?.align ?? 'left';
                    const canSort = header.column.getCanSort();
                    const sorted = header.column.getIsSorted();
                    return (
                      <th
                        key={header.id}
                        onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                        className={`px-4 py-3 text-amber-800 font-semibold text-xs uppercase tracking-wide text-${align} ${header.column.columnDef.meta?.className ?? ''} ${canSort ? 'cursor-pointer select-none hover:bg-amber-100' : ''}`}
                      >
                        <span className="inline-flex items-center gap-1">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {canSort && (
                            <span className="text-amber-400 text-xs">
                              {sorted === 'asc' ? '↑' : sorted === 'desc' ? '↓' : '↕'}
                            </span>
                          )}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-8 text-center text-zinc-400">
                    No items in this category.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row, idx) => (
                  <Fragment key={row.id}>
                    <tr
                      onClick={() => row.toggleExpanded()}
                      className={`border-b border-zinc-100 hover:bg-amber-50/40 cursor-pointer transition-colors ${idx % 2 !== 0 ? 'bg-zinc-50/40' : ''} ${row.getIsExpanded() ? 'bg-amber-50/60' : ''}`}
                    >
                      {row.getVisibleCells().map(cell => {
                        const align = cell.column.columnDef.meta?.align ?? 'left';
                        return (
                          <td key={cell.id} className={`px-4 py-3 text-${align} ${cell.column.columnDef.meta?.className ?? ''}`}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        );
                      })}
                    </tr>
                    {row.getIsExpanded() && (
                      <tr>
                        <td colSpan={columns.length} className="p-0">
                          <MonthsTable months={row.original.months} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
