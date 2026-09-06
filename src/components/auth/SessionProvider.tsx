'use client';

import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { keys } from '@/lib/query/keys';
import type { UserProfile } from '@/lib/auth/types';

/* Giữ hồ sơ người dùng của phiên. `initialUser` do layout server truyền xuống
   nên không chớp "đang tải" ở lần vào đầu; sau đó `/api/auth/me` tự làm mới. */

const SessionContext = createContext<UserProfile | null>(null);

export function SessionProvider({
  initialUser,
  children,
}: {
  initialUser: UserProfile;
  children: ReactNode;
}) {
  const router = useRouter();

  const { data, error } = useQuery({
    queryKey: keys.session,
    queryFn: () => api.get<UserProfile>('/auth/me'),
    initialData: initialUser,
    staleTime: 5 * 60_000,
    retry: false,
  });

  useEffect(() => {
    if (error instanceof ApiError && error.isAuth) {
      router.replace('/dang-nhap');
    }
  }, [error, router]);

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return <SessionContext.Provider value={data}>{children}</SessionContext.Provider>;
}

/** Hồ sơ người dùng hiện tại. Luôn khác null trong khu (app) vì layout đã chặn. */
export function useSession(): UserProfile {
  const user = useContext(SessionContext);
  if (!user) {
    throw new Error('useSession() phải nằm trong <SessionProvider>');
  }
  return user;
}
