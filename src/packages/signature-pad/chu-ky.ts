/* Chữ ký tay — HÀM THUẦN, không import React.

   Port từ `commercial-console.html`: `initPad` / `clearPad` / `loadSigImage` /
   `padData` (~11993–12022) và vòng lặp điểm ảnh của `stripBg` (~12245–12252).

   Bản cũ trộn phép tính với DOM trong cùng một hàm nên không thử được gì.
   Ở đây tách đúng phần TÍNH ra: cỡ khung vẽ theo mật độ điểm ảnh, phép co ảnh
   chữ ký cho vừa khung, ngưỡng xoá nền trắng, và điều kiện nhận tệp ảnh.
   Phần chạm canvas/DOM nằm trong `ChuKyPad.tsx` và chỉ gọi xuống đây.

   Không import React, không chạm `document`, không gọi API.

   ⚠ NĂM CÁI BẪY, đừng gỡ cái nào khi sửa hàm này:

   1. MỘT CHẤM KHÔNG PHẢI CHỮ KÝ. Bản cũ chỉ bật cờ `drawn` trong `pointermove`,
      không bật trong `pointerdown` — chạm nhầm một cái thì hợp đồng không bị
      coi là đã ký. Giữ nguyên ý đó: một nét phải có từ 2 điểm.
   2. `devicePixelRatio` BẰNG 0 HOẶC KHÔNG CÓ. Trên server và trong môi trường
      test thì không có `window`. Nhân bừa ra khung 0×0 là canvas tàng hình, và
      `toDataURL()` trên canvas rỗng chiều là lỗi ở một số trình duyệt.
   3. CO ẢNH PHẢI DÙNG `min`, KHÔNG PHẢI `max`. Ảnh chữ ký chụp bằng điện thoại
      rất ngang; lấy `max` là phóng to rồi cắt mất đuôi chữ ký.
   4. XOÁ NỀN TRẮNG PHẢI XÉT ĐỦ BA KÊNH MÀU. Bỏ kênh xanh lam thì mực highlight
      vàng (250, 250, 10) cũng bị xoá theo — mất nét ký.
   5. TỆP TẢI LÊN KHÔNG KIỂM. Ảnh gốc 8 MB nhét thẳng vào payload hợp đồng dưới
      dạng base64 là hợp đồng phình gấp bốn và backend trả 413.

   ⚠ HAI HÀM `viSao…` TRẢ `LyDo` (khoá i18n + chỗ điền), KHÔNG trả câu tiếng
   Việt. Màn gọi `t(lyDo.khoa, lyDo.thamSo)`. Không gọi `t()` ngay tại đây: hàm
   thuần không biết ngôn ngữ hiện hành, gọi ở tầng này là đóng băng chuỗi theo
   ngôn ngữ lúc nạp tệp. Dùng `LyDo` chứ không phải khoá trần như
   `features/san-pham/gia.ts` vì hai nhánh mang con số tính ngay trong hàm
   ("Ảnh 8.0 MB, vượt mức 2 MB."). Mọi nhánh lỗi đều trả khoá, không trả câu. */

import type { LyDo } from '@/lib/i18n';

/** Một điểm trên khung vẽ, theo toạ độ CSS (không nhân mật độ điểm ảnh). */
export interface Diem {
  x: number;
  y: number;
}

/** Một nét liền — từ lúc đặt bút tới lúc nhấc bút. */
export type Net = readonly Diem[];

export interface KichThuoc {
  rong: number;
  cao: number;
}

/** Ô đặt ảnh trong khung vẽ — toạ độ góc trên trái + kích thước sau khi co. */
export interface OAnh extends KichThuoc {
  x: number;
  y: number;
}

/* ── Nét vẽ ──────────────────────────────────────────────────────────────── */

/** BẪY 1 — một nét phải có từng này điểm mới tính là có vẽ. */
export const DIEM_TOI_THIEU_MOT_NET = 2;

/** Đã có chữ ký chưa. Một chấm (nét 1 điểm) KHÔNG tính — xem bẫy 1. */
export function daVe(nets: readonly Net[]): boolean {
  return nets.some((net) => net.length >= DIEM_TOI_THIEU_MOT_NET);
}

/** Số nét thật sự vẽ được — dùng cho nút "Hoàn tác" và cho phần mô tả. */
export function demNet(nets: readonly Net[]): number {
  return nets.filter((net) => net.length >= DIEM_TOI_THIEU_MOT_NET).length;
}

/* ── Khung vẽ ────────────────────────────────────────────────────────────── */

/* Màn 3x nhân lên là canvas gấp 9 lần diện tích cho một khung ký bé tí. Chặn
   trên ở 3 vì mắt không phân biệt nổi nữa mà bộ nhớ thì tăng thật. */
export const DPR_TOI_DA = 3;

export interface KhungVe extends KichThuoc {
  /** Hệ số nhân đã chặn — truyền thẳng vào `ctx.scale()`. */
  ty: number;
}

/** Cỡ thật của canvas (backing store) từ cỡ CSS và mật độ điểm ảnh.

    BẪY 2 — `dpr` không hợp lệ (0, âm, NaN, `undefined` khi không có `window`)
    rơi về 1. Cạnh nhỏ hơn 1 điểm ảnh cũng kéo lên 1: canvas rỗng chiều vừa
    không vẽ được vừa làm `toDataURL()` ném lỗi. */
export function khungVe(rong: number, cao: number, dpr: number | undefined): KhungVe {
  const ty = Number.isFinite(dpr) && (dpr as number) > 0 ? Math.min(dpr as number, DPR_TOI_DA) : 1;
  const canh = (v: number) => Math.max(1, Math.round((Number.isFinite(v) ? v : 0) * ty));
  return { rong: canh(rong), cao: canh(cao), ty };
}

/* ── Nạp ảnh chữ ký có sẵn ───────────────────────────────────────────────── */

/** Co ảnh cho VỪA TRỌN trong khung rồi căn giữa — `object-fit: contain`.

    BẪY 3 — `Math.min` chứ không phải `Math.max`. Trả `null` khi ảnh hoặc khung
    có cạnh bằng 0: chia cho 0 ra `Infinity`, `drawImage()` nhận vào thì hoặc
    ném lỗi hoặc vẽ ra khoảng trắng, cả hai đều khó lần ra nguyên nhân. */
export function veVua(anh: KichThuoc, khung: KichThuoc): OAnh | null {
  const hopLe = (v: number) => Number.isFinite(v) && v > 0;
  if (!hopLe(anh.rong) || !hopLe(anh.cao) || !hopLe(khung.rong) || !hopLe(khung.cao)) {
    return null;
  }
  const ty = Math.min(khung.rong / anh.rong, khung.cao / anh.cao);
  const rong = anh.rong * ty;
  const cao = anh.cao * ty;
  return { x: (khung.rong - rong) / 2, y: (khung.cao - cao) / 2, rong, cao };
}

/* ── Xoá nền trắng ───────────────────────────────────────────────────────── */

/** Điểm ảnh sáng hơn ngưỡng này ở CẢ BA kênh thì coi là nền giấy. Giữ nguyên
    con số 232 của bản cũ — mực ký (#0F2733) và bút bi xanh đều tối hơn nhiều. */
export const NGUONG_NEN_TRANG = 232;

/** Đục trong nền giấy của ảnh chữ ký chụp/scan, SỬA TẠI CHỖ trên mảng RGBA.

    BẪY 4 — phải xét đủ ba kênh. Bỏ một kênh là xoá luôn nét ký màu vàng/lam
    nhạt. So sánh dùng `>` chặt như bản cũ: đúng 232 thì giữ lại.

    Trả về số điểm ảnh đã đục trong, để chỗ gọi biết ảnh có đúng là nền giấy
    không (0 nghĩa là ảnh nền tối — đừng dùng nó làm chữ ký). */
export function xoaNenTrang(rgba: Uint8ClampedArray, nguong: number = NGUONG_NEN_TRANG): number {
  let daXoa = 0;
  for (let i = 0; i + 3 < rgba.length; i += 4) {
    const r = rgba[i] ?? 0;
    const g = rgba[i + 1] ?? 0;
    const b = rgba[i + 2] ?? 0;
    if (r > nguong && g > nguong && b > nguong) {
      rgba[i + 3] = 0;
      daXoa += 1;
    }
  }
  return daXoa;
}

/* ── Tệp ảnh tải lên ─────────────────────────────────────────────────────── */

export const LOAI_ANH_CHO_PHEP: readonly string[] = ['image/png', 'image/jpeg', 'image/webp'];

/** BẪY 5 — ảnh vào hợp đồng dưới dạng base64, phình thêm ~33%. 2 MB là đủ rộng
    cho một ảnh chữ ký chụp bằng điện thoại. */
export const KICH_THUOC_ANH_TOI_DA = 2 * 1024 * 1024;

/** Vì sao chưa nạp được tệp ảnh chữ ký — `null` nghĩa là nạp được.

    Trả LÝ DO chứ không phải boolean, giống `viSaoKhongChuyenDuoc()` của nhóm
    Hợp đồng: người ở quầy cần biết phải làm gì tiếp, không phải một ô chọn tệp
    im lặng không nhận. */
export function viSaoKhongNapDuocAnh(tep: { type: string; size: number }): LyDo | null {
  if (!LOAI_ANH_CHO_PHEP.includes(tep.type)) {
    return { khoa: 'chuKy.loi.loaiAnhSai' };
  }
  if (tep.size <= 0) return { khoa: 'chuKy.loi.tepRong' };
  if (tep.size > KICH_THUOC_ANH_TOI_DA) {
    const mb = (tep.size / (1024 * 1024)).toFixed(1);
    return {
      khoa: 'chuKy.loi.anhQuaLon',
      thamSo: { mb, toiDa: KICH_THUOC_ANH_TOI_DA / (1024 * 1024) },
    };
  }
  return null;
}

/* ── Ảnh chữ ký gửi đi ───────────────────────────────────────────────────── */

/** Chữ ký PHẢI là ảnh nhúng, không phải đường dẫn.

    BẪY 6 — một đường dẫn `https://…` trỏ tới ảnh chữ ký là chữ ký có thể đổi
    hoặc biến mất sau khi hợp đồng đã ký: máy chủ ảnh chết là hợp đồng trắng ô
    ký, mà đổi tệp ở đầu kia thì không ai biết. Chứng từ phải tự chứa. */
const TIEN_TO_PNG = 'data:image/png;base64,';

/** Data URL của chữ ký, tính theo ký tự. Khung ký 560×180 ở mật độ 2× ra ảnh
    PNG nền trong khoảng vài chục KB; 512 KB đã rất rộng tay. */
export const KICH_THUOC_CHU_KY_TOI_DA = 512 * 1024;

/** Vì sao chưa lưu được chữ ký — `null` nghĩa là lưu được. */
export function viSaoKhongLuuDuocChuKy(anh: string | null | undefined): LyDo | null {
  if (!anh) return { khoa: 'chuKy.loi.chuaKy' };
  if (!anh.startsWith(TIEN_TO_PNG)) {
    return { khoa: 'chuKy.loi.phaiLaPng' };
  }
  if (anh.length <= TIEN_TO_PNG.length) return { khoa: 'chuKy.loi.anhRong' };
  if (anh.length > KICH_THUOC_CHU_KY_TOI_DA) {
    return { khoa: 'chuKy.loi.anhChuKyQuaLon', thamSo: { kb: Math.round(anh.length / 1024) } };
  }
  return null;
}
