'use client';

import { useQuery } from '@tanstack/react-query';
import type { SessionUser } from '@/lib/auth';

export function useCurrentUser() {
  return useQuery<SessionUser | null>({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await fetch('/api/auth/me');
      if (!res.ok) return null;
      const data = await res.json();
      return data.user ?? null;
    },
    staleTime: 1000 * 60 * 10, // 10 min
    retry: false,
  });
}
