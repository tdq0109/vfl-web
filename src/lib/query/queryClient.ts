import { QueryClient } from '@tanstack/react-query';

/* Tạo một QueryClient mới. GỌI TRONG `useState` ở `app/providers.tsx`, ĐỪNG tạo
   ở module scope: trên server module scope dùng chung giữa các request → hai
   người dùng khác nhau thấy cache của nhau. Đó là lỗi RÒ RỈ DỮ LIỆU. */
export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}
