import { QueryClient } from '@tanstack/react-query';

/* Tạo một QueryClient mới. Gọi trong useState ở app/providers.tsx, đừng tạo ở
   module scope: trên server, module scope dùng chung giữa các request nên hai
   người dùng khác nhau sẽ thấy cache của nhau. */
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
