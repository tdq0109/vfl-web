import { LOCALES, type Locale } from './index';

/* Đọc/ghi cookie nhớ ngôn ngữ — hàm thuần, chỉ nhận và trả chuỗi.

   Dùng cookie chứ không phải localStorage vì trang trong app/ là server
   component: server không đọc được localStorage nên dựng HTML bằng tiếng Việt
   rồi client mới sửa lại sau khi hydrate, người chọn tiếng Anh thấy một nhịp
   tiếng Việt nháy lên và <html lang> sai trong khoảng đó.

   Cookie phải có Max-Age dài: ngôn ngữ là thói quen của người dùng, còn cookie
   không Max-Age là cookie phiên, đóng trình duyệt là quên. */

/** Tên cookie. Giữ đúng tên khoá cũ ở localStorage để đọc log dễ đối chiếu. */
export const KHOA_COOKIE = 'vfl.ngonNgu';

/** Một năm. Dài hơn mọi phiên làm việc, và đổi ngôn ngữ là việc hiếm. */
export const SONG_LAU_GIAY = 60 * 60 * 24 * 365;

/** Ngôn ngữ đọc từ một chuỗi cookie — document.cookie ở client, header Cookie ở
    server. null khi chưa chọn bao giờ hoặc giá trị không dùng được.

    So tên chính xác chứ không so "có chứa", nếu không cookie tên x_vfl.ngonNgu
    của thứ khác cũng khớp. Lấy bản đầu tiên vì trình duyệt xếp bản khớp sát
    nhất lên trước. */
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

    baoMat là trang đang chạy trên HTTPS, truyền vào chứ không tự đọc location
    để tệp này còn là hàm thuần — và đặt Secure cứng thì cookie không bao giờ
    ghi được lúc chạy dev trên http://localhost, mà trình duyệt im lặng bỏ qua.

    Path=/ bắt buộc, thiếu nó thì chọn tiếng Anh ở /hoi-vien rồi sang /tong-quan
    là quên sạch. Cookie này không HttpOnly vì client phải đọc và ghi được; nó
    chỉ có hai giá trị vi và en. */
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
