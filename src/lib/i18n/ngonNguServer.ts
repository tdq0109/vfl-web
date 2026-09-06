import 'server-only';
import { cookies } from 'next/headers';
import { DEFAULT_LOCALE, t as tGoc, type Locale, type ThamSo } from './index';
import { KHOA_COOKIE, hopLeCookie } from './cookieNgonNgu';

/* Ngôn ngữ ở phía server — đọc từ cookie ngay trong lần dựng HTML đầu.

   Đây là nửa còn thiếu của bộ chuyển ngôn ngữ: NgonNguProvider chỉ chạy ở
   client, mà mọi trang trong app/ là server component. Trước khi có tệp này,
   server đoán bừa tiếng Việt nên tiêu đề trang luôn ra tiếng Việt kể cả khi
   người dùng đã chọn tiếng Anh, và <html lang> sai cho tới lúc hydrate xong.

   Đọc cookie làm cả cây route thành động, không dựng tĩnh được nữa. Với hệ này
   là chấp nhận được vì mọi màn đều sau đăng nhập và đều đọc dữ liệu theo phiên.

   Từ Next 15, cookies() trả về Promise nên các hàm ở đây đều async — cùng lý do
   đã ghi ở lib/auth/session.ts. */

/** Ngôn ngữ người này đã chọn, đọc từ cookie. Mặc định tiếng Việt. */
export async function ngonNguTrenServer(): Promise<Locale> {
  try {
    const kho = await cookies();
    return hopLeCookie(kho.get(KHOA_COOKIE)?.value) ?? DEFAULT_LOCALE;
  } catch {
    /* Gọi ngoài ngữ cảnh request (dựng tĩnh, script) — cứ tiếng Việt. */
    return DEFAULT_LOCALE;
  }
}

/** `t()` đã gắn sẵn ngôn ngữ của người đang xem, dùng trong server component.

    Bản song sinh của `useT()` bên client. Đặt tên khác nhau là CỐ Ý: hai hàm
    chạy ở hai phía và không thay thế cho nhau được, nên đừng để ai gọi nhầm
    `useT()` trong một trang server rồi tự hỏi vì sao chữ không đổi. */
export async function tTrenServer(): Promise<(key: string, thamSo?: ThamSo) => string> {
  const ngonNgu = await ngonNguTrenServer();
  return (key, thamSo) => tGoc(key, thamSo, ngonNgu);
}
