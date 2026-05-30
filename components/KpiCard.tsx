interface Props {
  label: string;
  value: string;
  subLabel?: string;
  accent?: boolean;
}

export function KpiCard({ label, value, subLabel, accent }: Props) {
  return (
    <div
      className={`bg-white rounded-xl p-5 shadow-sm border ${
        accent ? 'border-amber-400' : 'border-amber-100'
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
      <p
        className={`mt-1 text-2xl font-bold tracking-tight ${
          accent ? 'text-amber-700' : 'text-zinc-900'
        }`}
      >
        {value}
      </p>
      {subLabel && <p className="mt-1 text-xs text-zinc-400">{subLabel}</p>}
    </div>
  );
}
