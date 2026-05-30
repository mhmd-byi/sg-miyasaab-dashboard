'use client';

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type RowData,
} from '@tanstack/react-table';
import { useState, type ReactNode } from 'react';

// Augment TanStack Table's ColumnMeta with alignment support
declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    align?: 'left' | 'right' | 'center';
    className?: string;
  }
}

interface DataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  footer?: ReactNode;
  emptyMessage?: string;
}

const alignClass = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
};

export function DataTable<TData>({
  data,
  columns,
  footer,
  emptyMessage = 'No data available.',
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
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
                      className={`px-4 py-3 text-amber-800 font-semibold text-xs uppercase tracking-wide ${alignClass[align]} ${canSort ? 'cursor-pointer select-none hover:bg-amber-100 transition-colors' : ''} ${header.column.columnDef.meta?.className ?? ''}`}
                      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                    >
                      <span className="inline-flex items-center gap-1">
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
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
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-zinc-400 text-sm"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row, idx) => (
                <tr
                  key={row.id}
                  className={`border-b border-zinc-100 hover:bg-amber-50/40 transition-colors ${idx % 2 !== 0 ? 'bg-zinc-50/40' : ''}`}
                >
                  {row.getVisibleCells().map(cell => {
                    const align = cell.column.columnDef.meta?.align ?? 'left';
                    return (
                      <td
                        key={cell.id}
                        className={`px-4 py-3 ${alignClass[align]} ${cell.column.columnDef.meta?.className ?? ''}`}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
          {footer && (
            <tfoot>
              <tr className="bg-amber-50 border-t-2 border-amber-300 font-semibold text-sm">
                {footer}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
