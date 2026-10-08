import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';

// Sort indicator for TanStack Table headers.
export function SortIcon({ direction }: { direction: false | 'asc' | 'desc' }) {
  const Icon = direction === 'asc' ? ArrowUp : direction === 'desc' ? ArrowDown : ArrowUpDown;
  return <Icon className="size-3 text-amber-400" aria-hidden />;
}
