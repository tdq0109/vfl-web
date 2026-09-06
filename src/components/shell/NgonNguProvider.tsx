'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { DEFAULT_LOCALE, t as tGoc, type Locale, type ThamSo } from '@/lib/i18n';
import { dangKy, docDaLuu, luu, ngonNguHieuLuc } from '@/lib/i18n/ngonNgu';

/* Ngôn ngữ đang chọn, nhớ trong cookie. Cùng khuôn với LocationProvider.

   Khác một điểm: ảnh chụp server là một prop chứ không phải hằng null, vì server
   đọc được cookie nên dựng HTML đúng ngôn ngữ ngay từ đầu rồi truyền chính giá
   trị đó xuống đây. ngonNguBanDau phải là giá trị server đã dùng — đọc lại ở
   client là quay về lệch hydration. */

interface NgonNguContextValue {
  ngonNgu: Locale;
  doiNgonNgu: (ngonNgu: Locale) => void;
  /** t() đã gắn sẵn ngôn ngữ hiện tại, component không phải tự truyền. */
  t: (key: string, thamSo?: ThamSo) => string;
}

const NgonNguContext = createContext<NgonNguContextValue | null>(null);

interface Props {
  children: ReactNode;
  /** Ngôn ngữ server đã dùng để dựng HTML — đọc từ cookie ở app/layout.tsx. */
  ngonNguBanDau?: Locale;
}

export function NgonNguProvider({ children, ngonNguBanDau = DEFAULT_LOCALE }: Props) {
  /* Ảnh chụp server phải ổn định giữa các lần render: trả một hàm mới mỗi lần
     là React coi như kho đổi liên tục và render vô hạn. */
  const anhChupServer = useCallback(() => ngonNguBanDau, [ngonNguBanDau]);
  const daLuu = useSyncExternalStore(dangKy, docDaLuu, anhChupServer);
  const ngonNgu = ngonNguHieuLuc(daLuu);

  const doiNgonNgu = useCallback((moi: Locale) => {
    luu(moi);
  }, []);

  /* Đồng bộ thuộc tính lang của <html> cho lần bấm đổi ngôn ngữ giữa chừng;
     lần dựng HTML đầu server đã đặt đúng rồi. */
  useEffect(() => {
    document.documentElement.lang = ngonNgu;
  }, [ngonNgu]);

  const value = useMemo<NgonNguContextValue>(
    () => ({
      ngonNgu,
      doiNgonNgu,
      t: (key, thamSo) => tGoc(key, thamSo, ngonNgu),
    }),
    [ngonNgu, doiNgonNgu],
  );

  return <NgonNguContext.Provider value={value}>{children}</NgonNguContext.Provider>;
}

/** Ngôn ngữ hiện tại + hàm đổi + t() đã gắn ngôn ngữ.

    Ngoài provider thì rơi về tiếng Việt thay vì ném, vì ErrorBoundary và màn
    đăng nhập phải vẽ được kể cả khi cây provider hỏng. */
export function useNgonNgu(): NgonNguContextValue {
  const ctx = useContext(NgonNguContext);
  if (ctx) return ctx;
  return {
    ngonNgu: DEFAULT_LOCALE,
    doiNgonNgu: () => {},
    t: (key, thamSo) => tGoc(key, thamSo, DEFAULT_LOCALE),
  };
}

/** Chỉ lấy `t()` — dạng hay dùng nhất trong component. */
export function useT(): (key: string, thamSo?: ThamSo) => string {
  return useNgonNgu().t;
}
