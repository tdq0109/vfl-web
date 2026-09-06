import en from './en.json';
import vi from './vi.json';

/* i18n tối giản: từ điển phẳng theo khoá, tiếng Việt là ngôn ngữ gốc.

   Phase 1 chạy tiếng Việt; bản tiếng Anh giữ song song để không phải dịch ngược
   cả hệ thống về sau. Bộ chuyển ngôn ngữ lúc chạy nằm ở
   `components/shell/NgonNguProvider.tsx` + `NutDoiNgonNgu.tsx`.

   ⚠ SỐ LIỆU THẬT, đo lại bằng `npm run i18n-con-lai` (đừng tin con số trong
   đầu — chạy công cụ):
     · lúc bắt đầu, app có **533** chuỗi tiếng Việt người dùng nhìn thấy — ước
       lượng "~600 mục" của tài liệu bàn giao là đúng tầm;
     · từ điển hệ cũ (`tu-dien-he-cu.json`) có 505 mục, nhưng chỉ **43** trùng
       nguyên văn với chuỗi đang dùng. 462 mục còn lại thuộc màn CHƯA làm ở
       Phase 1 (lương/BHXH, Academy, Pro Skill, chăm lead, trung tâm báo cáo,
       đặt target) — giữ lại cho các Phase sau;
     · **đã chuyển XONG TOÀN BỘ**: bảy nhóm nghiệp vụ, bộ component nền
       (`components` + `lib`), hai gói port (`packages`) và nhóm `app`. Công cụ
       (`npm run i18n-con-lai`) còn báo **11** chuỗi, cả 11 đều ngoài phần sản
       phẩm — câu `throw` cho lập trình viên đọc và mã định dạng của Excel.

   Ngôn ngữ nhớ trong COOKIE (`ngonNgu.ts` + `cookieNgonNgu.ts`) nên SERVER đọc
   được: trang trong `app/` gọi `tTrenServer()`, và `<html lang>` đúng ngay từ
   lần dựng HTML đầu. Client dùng `useT()` — hai hàm, hai phía, đừng gọi nhầm.

   ⚠ Bản bàn giao không kèm bộ test, nên KHÔNG còn lưới tự động canh hai chiều
   "khoá gõ sai" và "khoá chết trong từ điển". Thêm
   khoá mới thì phải tự đối chiếu `vi.json` với `en.json`. */

export type Locale = 'vi' | 'en';
export const DEFAULT_LOCALE: Locale = 'vi';
export const LOCALES: readonly Locale[] = ['vi', 'en'];

const DICT: Record<Locale, Record<string, string>> = { vi, en };

/** Giá trị chèn vào chỗ trống trong chuỗi — `{ten}`, `{soTien}`. */
export type ThamSo = Record<string, string | number>;

/** Lý do do một HÀM THUẦN trả về: khoá i18n + chỗ điền, để màn gọi
    `t(lyDo.khoa, lyDo.thamSo)`.

    Hàm thuần không biết ngôn ngữ hiện hành nên không được gọi `t()` tại chỗ —
    gọi ở tầng đó là đóng băng chuỗi theo ngôn ngữ lúc nạp tệp. Phần lớn hàm chỉ
    cần trả KHOÁ TRẦN (`string | null`, xem `features/san-pham/gia.ts`); dùng
    kiểu này khi có ÍT NHẤT MỘT nhánh mang con số tính ngay trong hàm, ví dụ
    "Ảnh 8.0 MB, vượt mức 2 MB." — con số đó chỗ gọi không tự dựng lại được mà
    không lặp luôn phép kiểm.

    Cả hàm trả cùng một kiểu, đừng trộn khoá trần với `LyDo` trong một hàm. */
export interface LyDo {
  khoa: string;
  thamSo?: ThamSo;
}

/** Lấy chuỗi theo khoá.

    Thiếu bản dịch thì lùi về tiếng Việt, rồi về CHÍNH KHOÁ. Trả về khoá — chứ
    không phải chuỗi rỗng — là cố ý: một ô trống trên màn không ai để ý, còn
    `hopDong.luuThayDoi` nằm giữa giao diện thì nhìn phát biết ngay là thiếu.

    Chỗ trống viết dạng `{ten}`. Thiếu giá trị cho một chỗ trống thì GIỮ NGUYÊN
    `{ten}` trên màn, cũng vì lý do trên — xoá đi thành "Xin chào ," là câu vẫn
    đọc được nên không ai báo lỗi. */
export function t(key: string, thamSo?: ThamSo, locale: Locale = DEFAULT_LOCALE): string {
  const mau = DICT[locale]?.[key] ?? DICT.vi[key] ?? key;
  if (!thamSo) return mau;
  return mau.replace(/\{(\w+)\}/g, (nguyenVan, ten: string) =>
    ten in thamSo ? String(thamSo[ten]) : nguyenVan,
  );
}

