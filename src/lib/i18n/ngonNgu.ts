import { DEFAULT_LOCALE, LOCALES, type Locale } from './index';
import {
  KHOA_COOKIE,
  chuoiGanCookie,
  chuoiXoaCookie,
  docTuChuoiCookie,
} from './cookieNgonNgu';

/* Ngôn ngữ đang chọn — kho ngoài React, để `useSyncExternalStore` đọc.

   Dựng theo đúng khuôn `lib/storage/clbDangChon.ts`, kể cả bài học đã trả giá ở
   đó: kho là NGUỒN SỰ THẬT, nên ghi hỏng mà không có bản tạm thì nút đổi ngôn
   ngữ bật ngược về chỗ cũ ngay khi vừa bấm.

   ⚠ COOKIE, không phải `localStorage` (bản đầu) và cũng không phải
   `sessionStorage` (khác với CLB đang chọn). Ngôn ngữ vẫn là THÓI QUEN của
   người dùng nên phải sống qua nhiều phiên — nhưng nó còn phải để SERVER đọc
   được, vì mọi trang trong `app/` là server component. Lý do đầy đủ và các bẫy
   của phép đọc/ghi nằm ở `cookieNgonNgu.ts`.

   ⚠ KHÁC `localStorage` MỘT ĐIỂM SỐNG CÒN: ghi cookie hỏng thì trình duyệt IM
   LẶNG. `localStorage.setItem` ném `SecurityError` khi bị chặn, còn gán
   `document.cookie` không ném gì cả — chuỗi vào hư không và lần đọc sau vẫn ra
   giá trị cũ. Vì vậy `luu()` phải ĐỌC LẠI để biết mình có ghi được không. */

export { KHOA_COOKIE };

type Listener = () => void;
const listeners = new Set<Listener>();

/* Bản tạm trong bộ nhớ, CHỈ dùng sau một lần ghi HỎNG thật — xem `clbDangChon.ts`. */
let banTam: Locale | null = null;
let ghiDuoc = true;

/** Chuỗi cookie của trang, `null` khi chạy ở server hoặc khi trình duyệt chặn. */
function chuoiCookie(): string | null {
  try {
    return typeof document === 'undefined' ? null : document.cookie;
  } catch {
    return null;
  }
}

/** Trang có đang chạy trên HTTPS không — quyết định cờ `Secure` của cookie. */
function dangHttps(): boolean {
  try {
    return typeof location !== 'undefined' && location.protocol === 'https:';
  } catch {
    return false;
  }
}

export function dangKy(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function bao(): void {
  for (const listener of [...listeners]) listener();
}

/** Ảnh chụp phía client. `null` khi chưa chọn bao giờ. */
export function docDaLuu(): Locale | null {
  if (!ghiDuoc) return banTam;
  return docTuChuoiCookie(chuoiCookie());
}

/** Lọc giá trị đọc từ kho. Kho là chỗ NGƯỜI NGOÀI sửa được (công cụ dev, tiện
    ích trình duyệt, hoặc chính ta bỏ bớt một ngôn ngữ ở bản sau) — nhận bừa là
    `t()` tra vào một từ điển không tồn tại. */
export function hopLe(gia: string | null): Locale | null {
  return gia !== null && (LOCALES as readonly string[]).includes(gia) ? (gia as Locale) : null;
}

/** Ngôn ngữ có hiệu lực — giá trị đã lưu nếu còn dùng được, không thì mặc định. */
export function ngonNguHieuLuc(daLuu: string | null): Locale {
  return hopLe(daLuu) ?? DEFAULT_LOCALE;
}

export function luu(ngonNgu: Locale): void {
  banTam = ngonNgu;
  try {
    if (typeof document !== 'undefined') {
      document.cookie = chuoiGanCookie(ngonNgu, dangHttps());
    }
    /* ĐỌC LẠI, không tin vào việc gán không ném. Trình duyệt chặn cookie thì
       phép gán trên im lặng không làm gì — mà `useSyncExternalStore` lấy kho làm
       nguồn sự thật, nên tin bừa là nút đổi bật ngược về chỗ cũ ngay khi vừa
       bấm, bấm mãi không đổi được và không báo gì. */
    ghiDuoc = docTuChuoiCookie(chuoiCookie()) === ngonNgu;
  } catch {
    ghiDuoc = false;
  }
  bao();
}

/** Quên lựa chọn đã nhớ.

    ĐỪNG gọi thẳng từ màn: đường đăng xuất đi qua `lib/storage/quenPhien.ts`, cửa
    duy nhất dọn mọi kho theo người dùng, và có test bắt buộc mọi `quen()` phải
    nối vào đó. Test vẫn gọi thẳng để mỗi ca bắt đầu sạch. */
export function quen(): void {
  banTam = null;
  ghiDuoc = true;
  try {
    if (typeof document !== 'undefined') document.cookie = chuoiXoaCookie();
  } catch {
    /* Không xoá được thì bản tạm đã về null, coi như chưa chọn gì. */
  }
  bao();
}

/** Ngôn ngữ còn lại khi bấm nút đổi. Hai ngôn ngữ nên là phép lật đơn giản;
    thêm ngôn ngữ thứ ba thì đây phải thành danh sách chọn, không phải nút lật. */
export function ngonNguKia(hienTai: Locale): Locale {
  return hienTai === 'vi' ? 'en' : 'vi';
}
