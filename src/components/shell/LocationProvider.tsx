'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import {
  clbHieuLuc,
  dangKy,
  docDaLuu,
  docTrenServer,
  luu,
  MOI_CLB,
} from '@/lib/storage/clbDangChon';
import type { Location } from '@/lib/api/types';

/* CLB đang chọn, nhớ trong `sessionStorage` (mất khi đóng tab — đúng ý: mỗi
   phiên làm việc chọn lại).

   Đừng đọc sessionStorage lúc render: server không đọc được và hai bên sẽ ra
   hai kết quả khác nhau.

   Cách giải: `useSyncExternalStore`. Server và lần render hydrate đầu tiên dùng
   ảnh chụp server (luôn `null` → CLB mặc định); hydrate xong React tự đọc ảnh
   chụp client. Không `useEffect`, không `setState`, không lệch hydration.

   Bản trước dùng `useState` + đọc kho trong `useEffect`. Nó chạy đúng nhưng phải
   tắt luật `react-hooks/set-state-in-effect`, và tốn một lần render thừa mỗi lần
   gắn. Toàn bộ phần chạm kho nay nằm ở `lib/storage/clbDangChon.ts` và có test. */

export { MOI_CLB as ALL_LOCATIONS };

interface LocationContextValue {
  /** Id CLB đang chọn, hoặc 'all'. */
  current: string;
  /** Danh sách CLB người dùng chọn được. */
  options: Location[];
  setCurrent: (id: string) => void;
}

const LocationContext = createContext<LocationContextValue | null>(null);

export function LocationProvider({
  options,
  allowAll,
  children,
}: {
  options: Location[];
  /** Cho chọn "Tất cả CLB" (người có cờ allLocations). */
  allowAll: boolean;
  children: ReactNode;
}) {
  const daLuu = useSyncExternalStore(dangKy, docDaLuu, docTrenServer);

  /* Lọc lại mỗi lần render: quyền có thể đã đổi từ phiên trước, giá trị đã lưu
     chưa chắc còn hợp lệ. Logic ở `clbHieuLuc()`, có test. */
  const current = clbHieuLuc(daLuu, options, allowAll);

  const setCurrent = useCallback((id: string) => {
    luu(id);
  }, []);

  const value = useMemo(
    () => ({ current, options, setCurrent }),
    [current, options, setCurrent],
  );

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocationScope(): LocationContextValue {
  const ctx = useContext(LocationContext);
  if (!ctx) {
    throw new Error('useLocationScope() phải nằm trong <LocationProvider>');
  }
  return ctx;
}
