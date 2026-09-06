import { LOCALES, type Locale } from './index';

/* Đọc/ghi cookie nhớ ngôn ngữ — HÀM THUẦN, không import React.

   Vì sao là COOKIE chứ không phải `localStorage` như bản đầu: trang trong
   `app/` là SERVER COMPONENT. Server không đọc được `localStorage`, nên nó dựng
   HTML bằng tiếng Việt rồi client mới sửa lại sau khi hydrate — người chọn
   tiếng Anh thấy một nhịp tiếng Việt nháy lên, và `<html lang>` sai trong đúng
   khoảng đó (trình đọc màn hình chọn giọng theo thuộc tính này). Cookie đi kèm
   request nên server biết ngay từ lần dựng HTML đầu.

   Không đổi ý ban đầu: ngôn ngữ vẫn là THÓI QUEN của người dùng chứ không phải
   bối cảnh phiên làm việc, nên cookie phải có `Max-Age` dài — cookie không
   `Max-Age` là cookie phiên, đóng trình duyệt là quên, tức là tụt về đúng cái
   `sessionStorage` mà bản đầu đã cố tránh.

   Toàn bộ tệp này chỉ nhận và trả CHUỖI — không chạm `document`, không chạm
   `next/headers`. Nhờ vậy test được cả hai đầu bằng chuỗi thật. */

/** Tên cookie. Giữ đúng tên khoá cũ ở `localStorage` để đọc log dễ đối chiếu. */
export const KHOA_COOKIE = 'vfl.ngonNgu';

/** Một năm. Dài hơn mọi phiên làm việc, và đổi ngôn ngữ là việc hiếm. */
export const SONG_LAU_GIAY = 60 * 60 * 24 * 365;

/** Ngôn ngữ đọc từ một chuỗi cookie — `document.cookie` ở client, header
    `Cookie` ở server. `null` khi chưa chọn bao giờ hoặc giá trị không dùng được.

    BẪY 1 — SO TÊN CHÍNH XÁC, không so "có chứa". Tìm `chuoi.includes('vfl.ngonNgu=')`
    là cookie tên `x_vfl.ngonNgu` của thứ khác cũng khớp, và người dùng bỗng
    thấy giao diện đổi ngôn ngữ vì một cookie không liên quan.

    BẪY 2 — LẤY BẢN ĐẦU TIÊN. Cùng một tên có thể xuất hiện HAI lần khi tồn tại
    hai cookie khác `Path` (ví dụ một bản cũ đặt nhầm ở `/hoi-vien`). Trình duyệt
    xếp bản khớp sát nhất lên trước, nên bản đầu tiên mới là bản đang có hiệu lực
    — lấy bản cuối là đọc phải cookie chết. */
export function docTuChuoiCookie(chuoi: string | null | undefined): Locale | null {
  if (!chuoi) return null;
  for (const phan of chuoi.split(';')) {
    const dau = phan.indexOf('=');
    if (dau < 0) continue;
    /* BẪY 3 — sau dấu chấm phẩy luôn có dấu cách: "a=1; vfl.ngonNgu=en". */
    if (phan.slice(0, dau).trim() !== KHOA_COOKIE) continue;
    return hopLeCookie(phan.slice(dau + 1).trim());
  }
  return null;
}

/** Lọc giá trị đọc từ cookie. Cookie còn dễ sửa hơn `localStorage` — người dùng
    tự gõ được trong công cụ dev, và nó đi qua đường mạng — nên nhận bừa là `t()`
    tra vào một từ điển không tồn tại và mọi chuỗi rơi về chính khoá. */
export function hopLeCookie(gia: string | null | undefined): Locale | null {
  return gia && (LOCALES as readonly string[]).includes(gia) ? (gia as Locale) : null;
}

/** Chuỗi gán vào `document.cookie` để nhớ lựa chọn.

    `baoMat` = trang đang chạy trên HTTPS. Truyền vào chứ không tự đọc
    `location` để tệp này còn là hàm thuần — và vì đặt `Secure` cứng là cookie
    KHÔNG BAO GIỜ ghi được lúc chạy `npm run dev` trên `http://localhost`, mà
    trình duyệt thì im lặng bỏ qua chứ không báo gì.

    BẪY 4 — `Path=/` bắt buộc. Thiếu nó thì cookie chỉ thuộc về đường dẫn đang
    đứng: chọn tiếng Anh ở `/hoi-vien` rồi sang `/tong-quan` là quên sạch. Đây là
    loại lỗi không ai báo vì nó "chỉ thỉnh thoảng mới sai".

    `SameSite=Lax` như cookie phiên (`lib/auth/session.ts`). Cookie này KHÔNG
    `HttpOnly` — client phải đọc và ghi được nó. Nó không mang gì bí mật: chỉ có
    đúng hai giá trị `vi` và `en`. */
export function chuoiGanCookie(ngonNgu: Locale, baoMat: boolean): string {
  const phan = [
    `${KHOA_COOKIE}=${ngonNgu}`,
    'Path=/',
    `Max-Age=${SONG_LAU_GIAY}`,
    'SameSite=Lax',
  ];
  if (baoMat) phan.push('Secure');
  return phan.join('; ');
}

/** Chuỗi gán để XOÁ cookie — dùng khi đăng xuất và trong test.

    `Max-Age=0` phải đi kèm ĐÚNG `Path` lúc đặt: trình duyệt coi (tên, path) là
    hai cookie khác nhau, nên xoá sai path là cookie cũ vẫn còn nguyên và lần đọc
    sau vẫn thấy ngôn ngữ của người trước. */
export function chuoiXoaCookie(): string {
  return `${KHOA_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}
