'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { R1DataTab } from './R1DataTab';
import { R2DataTab } from './R2DataTab';
import { R3DataTab } from './R3DataTab';
import { REPORT_CONFIG } from '@/lib/config';
import { ArrowLeft } from 'lucide-react';

const TABS = [
  { id: 'r3' as const, label: REPORT_CONFIG.report3.label, desc: 'Monthly gold rate entry: all calculations are applied automatically' },
  { id: 'r1' as const, label: REPORT_CONFIG.report1.label, desc: 'One row per ornament sold — enter tag, weight, rate, labour %' },
  { id: 'r2' as const, label: REPORT_CONFIG.report2.label, desc: 'Items with expandable monthly rows — only gold rate needed per month' },
];

export function AdminDataPage() {
  const router = useRouter();
  const { data: user } = useCurrentUser();
  const [activeTab, setActiveTab] = useState<'r3' | 'r1' | 'r2'>('r3');

  const active = TABS.find(t => t.id === activeTab)!;

  return (
    <div className="min-h-screen bg-amber-50">
      {/* Header */}
      <header className="bg-amber-900 text-white px-6 py-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Data Entry</h1>
            <p className="text-amber-300 text-xs mt-0.5">
              {user ? `Admin: ${user.username}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/admin/users')}
              className="text-amber-200 hover:text-white text-sm transition-colors"
            >
              Users
            </button>
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-1.5 text-amber-200 hover:text-white text-sm transition-colors"
            >
              <ArrowLeft className="size-4" aria-hidden /> Dashboard
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Tab navigation */}
        <div className="flex gap-0 border-b border-amber-200 mb-1">
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
              {tab.label}
            </button>
          ))}
        </div>
        <div className="bg-white px-5 py-2.5 border-x border-b border-amber-100 rounded-b-lg mb-6">
          <p className="text-xs text-zinc-500">{active.desc}</p>
        </div>

        {/* Tab content */}
        {activeTab === 'r3' && <R3DataTab />}
        {activeTab === 'r1' && <R1DataTab />}
        {activeTab === 'r2' && <R2DataTab />}
      </div>
    </div>
  );
}
