import en from './en.json';
import vi from './vi.json';

/* i18n tối giản: từ điển phẳng theo khoá, tiếng Việt là ngôn ngữ gốc.

   Phase 1 chạy tiếng Việt; bản tiếng Anh giữ song song để không phải dịch ngược
   cả hệ thống về sau. Bộ chuyển ngôn ngữ lúc chạy nằm ở
   components/shell/NgonNguProvider.tsx và NutDoiNgonNgu.tsx.

   Từ điển hệ cũ (tu-dien-he-cu.json) có 505 mục nhưng chỉ 43 trùng nguyên văn
   với chuỗi đang dùng; 462 mục còn lại thuộc màn chưa làm ở Phase 1 (lương,
   Academy, Pro Skill, chăm lead, trung tâm báo cáo, đặt target).

   Đã chuyển xong toàn bộ phần sản phẩm. Đếm lại bằng npm run i18n-con-lai —
   hiện còn 11 chuỗi, đều là câu throw cho lập trình viên hoặc mã định dạng của
   Excel.

   Ngôn ngữ nhớ trong cookie (ngonNgu.ts + cookieNgonNgu.ts) nên server đọc
   được: trang trong app/ gọi tTrenServer() và <html lang> đúng ngay từ lần dựng
   HTML đầu, client dùng useT(). Hai hàm, hai phía, đừng gọi nhầm.

   Không có lưới tự động canh khoá gõ sai và khoá chết trong từ điển, nên thêm
   khoá mới thì tự đối chiếu vi.json với en.json. */

export type Locale = 'vi' | 'en';
export const DEFAULT_LOCALE: Locale = 'vi';
export const LOCALES: readonly Locale[] = ['vi', 'en'];

const DICT: Record<Locale, Record<string, string>> = { vi, en };

/** Giá trị chèn vào chỗ trống trong chuỗi — `{ten}`, `{soTien}`. */
export type ThamSo = Record<string, string | number>;

/** Lý do do một hàm thuần trả về: khoá i18n + chỗ điền, để màn gọi
    t(lyDo.khoa, lyDo.thamSo).

    Hàm thuần không biết ngôn ngữ hiện hành nên không được gọi t() tại chỗ. Phần
    lớn hàm chỉ cần trả khoá trần (string | null, xem features/san-pham/gia.ts);
    dùng kiểu này khi có ít nhất một nhánh mang con số tính ngay trong hàm, ví
    dụ "Ảnh 8.0 MB, vượt mức 2 MB.".

    Cả hàm trả cùng một kiểu, đừng trộn khoá trần với LyDo trong một hàm. */
export interface LyDo {
  khoa: string;
  thamSo?: ThamSo;
}

/** Lấy chuỗi theo khoá.

    Thiếu bản dịch thì lùi về tiếng Việt, rồi về chính khoá. Trả khoá chứ không
    trả chuỗi rỗng là cố ý: một ô trống trên màn không ai để ý, còn
    hopDong.luuThayDoi nằm giữa giao diện thì nhìn phát biết ngay là thiếu.

    Chỗ trống viết dạng {ten}. Thiếu giá trị thì giữ nguyên {ten} trên màn, cũng
    vì lý do trên — xoá đi thành "Xin chào ," là câu vẫn đọc được nên không ai
    báo lỗi. */
export function t(key: string, thamSo?: ThamSo, locale: Locale = DEFAULT_LOCALE): string {
  const mau = DICT[locale]?.[key] ?? DICT.vi[key] ?? key;
  if (!thamSo) return mau;
  return mau.replace(/\{(\w+)\}/g, (nguyenVan, ten: string) =>
    ten in thamSo ? String(thamSo[ten]) : nguyenVan,
  );
}

