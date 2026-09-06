'use client';

import { useState, type ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { NgonNguProvider } from '@/components/shell/NgonNguProvider';
import type { Locale } from '@/lib/i18n';
import { makeQueryClient } from '@/lib/query/queryClient';

/* QueryClient tạo một lần cho mỗi lần mount ở client qua `useState` — KHÔNG ở
   module scope (xem chú thích trong queryClient.ts). */
export function Providers({
  children,
  ngonNgu,
}: {
  children: ReactNode;
  /** Ngôn ngữ server đã đọc từ cookie và đã dùng để dựng HTML. */
  ngonNgu: Locale;
}) {
  const [queryClient] = useState(makeQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      {/* Ngôn ngữ bọc NGOÀI mọi màn, kể cả trang đăng nhập — trang đó nằm ngoài
          khu (app) nên không có `AppShell`. */}
      <NgonNguProvider ngonNguBanDau={ngonNgu}>{children}</NgonNguProvider>
    </QueryClientProvider>
  );
}
