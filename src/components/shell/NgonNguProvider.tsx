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

/* Ngôn ngữ đang chọn, nhớ trong cookie.

   Dựng theo khuôn LocationProvider: useSyncExternalStore đọc kho ngoài React,
   nên server và lần render hydrate đầu tiên dùng ảnh chụp server, hydrate xong
   React tự đọc ảnh chụp client. Không useEffect để đặt state, không lệch
   hydration.

   Ảnh chụp server là một prop chứ không phải hằng null. Đó là toàn bộ ý nghĩa
   của việc chuyển sang cookie: server đọc được lựa chọn (lib/i18n/ngonNguServer)
   nên dựng HTML đúng ngôn ngữ ngay từ đầu rồi truyền chính giá trị đó xuống
   đây, hai bên khớp nhau nên không còn nhịp tiếng Việt nháy lên.

   ngonNguBanDau phải là giá trị server đã dùng để dựng HTML, không phải giá trị
   đọc lại ở client — đọc lại là quay về đúng lệch hydration. */

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

  /* Đồng bộ thuộc tính lang của thẻ <html>. Server đã dựng nó đúng ngay từ
     đầu, nên effect này chỉ còn lo phần bấm nút đổi ngôn ngữ giữa chừng.

     Trình đọc màn hình chọn giọng theo thuộc tính này, để sai là máy đọc tiếng
     Anh bằng giọng tiếng Việt. */
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

    Ngoài provider thì rơi về tiếng Việt thay vì ném: nhiều component nền
    (ErrorBoundary, màn đăng nhập) phải vẽ được kể cả khi cây provider chưa dựng
    xong hoặc đã hỏng. Khác useLocationScope() có chủ ý — thiếu phạm vi CLB là
    số liệu sai, còn thiếu ngôn ngữ chỉ là hiện tiếng Việt. */
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
