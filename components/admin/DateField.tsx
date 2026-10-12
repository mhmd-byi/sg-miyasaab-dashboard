'use client';

import type { ChangeEvent } from 'react';

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const pad = (n: number) => String(n).padStart(2, '0');

// Stored dates are dd/mm/yyyy strings (legacy rows may also hold dd-Mon-yyyy).
// Returns the yyyy-mm-dd value a native date input expects, or '' if unparseable.
export function toInputDate(stored: string): string {
  const v = stored.trim();
  let m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return `${m[3]}-${pad(Number(m[2]))}-${pad(Number(m[1]))}`;
  m = v.match(/^(\d{1,2})-([A-Za-z]{3})[a-z]*-(\d{4})$/);
  const mon = m ? MONTHS.indexOf(m[2].toLowerCase()) : -1;
  if (m && mon >= 0) return `${m[3]}-${pad(mon + 1)}-${pad(Number(m[1]))}`;
  return '';
}

function toStoredDate(input: string): string {
  const [y, mo, d] = input.split('-');
  return y && mo && d ? `${d}/${mo}/${y}` : '';
}

interface Props {
  value: string;
  onChange: (stored: string) => void;
  required?: boolean;
  id?: string;
}

export function DateField({ value, onChange, required, id }: Props) {
  const inputValue = toInputDate(value);
  // A saved value we can't parse would be silently lost on save — show it so it isn't a surprise.
  const unreadable = value.trim() !== '' && inputValue === '';

  return (
    <div>
      <input
        id={id}
        type="date"
        required={required}
        value={inputValue}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(toStoredDate(e.target.value))}
        onClick={e => { try { e.currentTarget.showPicker(); } catch { /* not supported or blocked */ } }}
        className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
      />
      {unreadable && <p className="mt-1 text-xs text-amber-700">Saved as “{value}” — pick a date to replace it.</p>}
    </div>
  );
}
