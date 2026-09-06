import { LOCALES, type Locale } from './index';

/* Đọc/ghi cookie nhớ ngôn ngữ — hàm thuần, không import React.

   Dùng cookie chứ không phải localStorage như bản đầu, vì trang trong app/ là
   server component: server không đọc được localStorage nên nó dựng HTML bằng
   tiếng Việt rồi client mới sửa lại sau khi hydrate. Người chọn tiếng Anh thấy
   một nhịp tiếng Việt nháy lên, và <html lang> sai trong đúng khoảng đó (trình
   đọc màn hình chọn giọng theo thuộc tính này).

   Ngôn ngữ là thói quen của người dùng chứ không phải bối cảnh phiên làm việc,
   nên cookie phải có Max-Age dài — cookie không Max-Age là cookie phiên, đóng
   trình duyệt là quên.

   Tệp này chỉ nhận và trả chuỗi, không chạm document, không chạm next/headers. */

/** Tên cookie. Giữ đúng tên khoá cũ ở localStorage để đọc log dễ đối chiếu. */
export const KHOA_COOKIE = 'vfl.ngonNgu';

/** Một năm. Dài hơn mọi phiên làm việc, và đổi ngôn ngữ là việc hiếm. */
export const SONG_LAU_GIAY = 60 * 60 * 24 * 365;

/** Ngôn ngữ đọc từ một chuỗi cookie — document.cookie ở client, header Cookie
    ở server. null khi chưa chọn bao giờ hoặc giá trị không dùng được.

    So tên chính xác, không so "có chứa": tìm chuoi.includes('vfl.ngonNgu=') thì
    cookie tên x_vfl.ngonNgu của thứ khác cũng khớp.

    Lấy bản đầu tiên. Cùng một tên có thể xuất hiện hai lần khi tồn tại hai
    cookie khác Path; trình duyệt xếp bản khớp sát nhất lên trước nên bản đầu
    mới là bản đang có hiệu lực. */
export function docTuChuoiCookie(chuoi: string | null | undefined): Locale | null {
  if (!chuoi) return null;
  for (const phan of chuoi.split(';')) {
    const dau = phan.indexOf('=');
    if (dau < 0) continue;
    /* Sau dấu chấm phẩy luôn có dấu cách: "a=1; vfl.ngonNgu=en". */
    if (phan.slice(0, dau).trim() !== KHOA_COOKIE) continue;
    return hopLeCookie(phan.slice(dau + 1).trim());
  }
  return null;
}

/** Lọc giá trị đọc từ cookie. Cookie còn dễ sửa hơn localStorage — người dùng
    tự gõ được trong công cụ dev và nó đi qua đường mạng — nên nhận bừa là t()
    tra vào một từ điển không tồn tại và mọi chuỗi rơi về chính khoá. */
export function hopLeCookie(gia: string | null | undefined): Locale | null {
  return gia && (LOCALES as readonly string[]).includes(gia) ? (gia as Locale) : null;
}

/** Chuỗi gán vào document.cookie để nhớ lựa chọn.

    baoMat là trang đang chạy trên HTTPS. Truyền vào chứ không tự đọc location
    để tệp này còn là hàm thuần, và vì đặt Secure cứng thì cookie không bao giờ
    ghi được lúc chạy npm run dev trên http://localhost, mà trình duyệt im lặng
    bỏ qua chứ không báo gì.

    Path=/ bắt buộc: thiếu nó thì cookie chỉ thuộc về đường dẫn đang đứng, chọn
    tiếng Anh ở /hoi-vien rồi sang /tong-quan là quên sạch.

    SameSite=Lax như cookie phiên. Cookie này không HttpOnly vì client phải đọc
    và ghi được nó; nó không mang gì bí mật, chỉ có hai giá trị vi và en. */
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

/** Chuỗi gán để xoá cookie, dùng khi đăng xuất.

    Max-Age=0 phải đi kèm đúng Path lúc đặt: trình duyệt coi (tên, path) là hai
    cookie khác nhau, xoá sai path là cookie cũ vẫn còn nguyên. */
export function chuoiXoaCookie(): string {
  return `${KHOA_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}
