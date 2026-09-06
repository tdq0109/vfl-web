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

/* Ngôn ngữ đang chọn, nhớ trong COOKIE.

   Dựng theo đúng khuôn `LocationProvider`: `useSyncExternalStore` đọc kho ngoài
   React, nên server và lần render hydrate đầu tiên dùng ảnh chụp SERVER, hydrate
   xong React tự đọc ảnh chụp CLIENT. Không `useEffect` để đặt state, không lệch
   hydration.

   ⚠ ẢNH CHỤP SERVER NAY LÀ MỘT PROP, KHÔNG PHẢI HẰNG `null`. Đó là toàn bộ ý
   nghĩa của việc chuyển sang cookie: server ĐỌC ĐƯỢC lựa chọn (xem
   `lib/i18n/ngonNguServer.ts`) nên nó dựng HTML đúng ngôn ngữ ngay từ đầu, rồi
   truyền chính giá trị đó xuống đây. Hai bên khớp nhau nên không còn nhịp tiếng
   Việt nháy lên trước khi hydrate — đó là thứ bản `localStorage` không làm được.

   ⚠ `ngonNguBanDau` phải là giá trị SERVER ĐÃ DÙNG để dựng HTML, không phải một
   giá trị đọc lại ở client. Đọc lại ở client là quay về đúng lệch hydration mà
   `useSyncExternalStore` sinh ra để tránh. */

interface NgonNguContextValue {
  ngonNgu: Locale;
  doiNgonNgu: (ngonNgu: Locale) => void;
  /** `t()` đã gắn sẵn ngôn ngữ hiện tại — component không phải tự truyền. */
  t: (key: string, thamSo?: ThamSo) => string;
}

const NgonNguContext = createContext<NgonNguContextValue | null>(null);

interface Props {
  children: ReactNode;
  /** Ngôn ngữ SERVER đã dùng để dựng HTML — đọc từ cookie ở `app/layout.tsx`. */
  ngonNguBanDau?: Locale;
}

export function NgonNguProvider({ children, ngonNguBanDau = DEFAULT_LOCALE }: Props) {
  /* Ảnh chụp server phải ỔN ĐỊNH giữa các lần render: trả một hàm mới mỗi lần
     là React coi như kho đổi liên tục và render vô hạn. */
  const anhChupServer = useCallback(() => ngonNguBanDau, [ngonNguBanDau]);
  const daLuu = useSyncExternalStore(dangKy, docDaLuu, anhChupServer);
  const ngonNgu = ngonNguHieuLuc(daLuu);

  const doiNgonNgu = useCallback((moi: Locale) => {
    luu(moi);
  }, []);

  /* Đồng bộ thuộc tính `lang` của thẻ <html>. Server nay đã dựng nó ĐÚNG ngay
     từ đầu (`app/layout.tsx` đọc cookie), nên effect này chỉ còn lo phần bấm nút
     đổi ngôn ngữ giữa chừng — lúc đó không có lần dựng HTML nào nữa để sửa hộ.

     Trình đọc màn hình chọn giọng đọc theo thuộc tính này, nên để sai là máy đọc
     tiếng Anh bằng giọng tiếng Việt. Đây là tác dụng phụ lên DOM ngoài React,
     đúng chỗ dùng `useEffect`. */
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

/** Ngôn ngữ hiện tại + hàm đổi + `t()` đã gắn ngôn ngữ.

    Ngoài provider thì rơi về tiếng Việt thay vì ném: nhiều component nền
    (`ErrorBoundary`, màn đăng nhập) phải vẽ được kể cả khi cây provider chưa
    dựng xong hoặc đã hỏng. Đây là khác biệt CÓ CHỦ Ý so với `useLocationScope()`
    — thiếu phạm vi CLB là số liệu sai, còn thiếu ngôn ngữ chỉ là hiện tiếng Việt. */
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
