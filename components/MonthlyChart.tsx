'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts';
import { REPORT_CONFIG } from '@/lib/config';

interface Props {
  data: { month: string; msShare: number; sgShare: number }[];
}

export function MonthlyChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 5, right: 24, left: 16, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#fde68a" />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#92400e' }} />
        <YAxis
          tick={{ fontSize: 11, fill: '#92400e' }}
          tickFormatter={(v: number) => `₨${(v / 1000).toFixed(0)}K`}
        />
        <Tooltip
          formatter={(v, name) => [
            `₨ ${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            name,
          ]}
          contentStyle={{ borderColor: '#fde68a', borderRadius: 8, fontSize: 12 }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line
          type="monotone"
          dataKey="msShare"
          name={REPORT_CONFIG.ms.label}
          stroke={REPORT_CONFIG.ms.color}
          strokeWidth={2}
          dot={{ r: 4, fill: REPORT_CONFIG.ms.color }}
          activeDot={{ r: 6 }}
        />
        <Line
          type="monotone"
          dataKey="sgShare"
          name={REPORT_CONFIG.sg.label}
          stroke={REPORT_CONFIG.sg.color}
          strokeWidth={2}
          dot={{ r: 4, fill: REPORT_CONFIG.sg.color }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
