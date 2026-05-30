'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts';
import { REPORT_CONFIG } from '@/lib/config';

interface Props {
  data: { name: string; msShare: number; sgShare: number }[];
}

export function ItemShareChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(300, data.length * 28)}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 24, left: 60, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#fde68a" />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: '#92400e' }}
          tickFormatter={(v: number) => `₨${(v / 1000).toFixed(0)}K`}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 11, fill: '#78350f' }}
          width={68}
        />
        <Tooltip
          formatter={(v, name) => [
            `₨ ${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            name,
          ]}
          contentStyle={{ borderColor: '#fde68a', borderRadius: 8, fontSize: 12 }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar
          dataKey="msShare"
          name={REPORT_CONFIG.ms.label}
          fill={REPORT_CONFIG.ms.color}
          radius={[0, 4, 4, 0]}
        />
        <Bar
          dataKey="sgShare"
          name={REPORT_CONFIG.sg.label}
          fill={REPORT_CONFIG.sg.color}
          radius={[0, 4, 4, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
