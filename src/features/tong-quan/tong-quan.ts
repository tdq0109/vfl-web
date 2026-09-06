import { addDays, monthBounds, toIsoDate } from '@/lib/format/date';
import type { DiemDoanhThu, Ky, MaKy } from './types';

/* Chọn kỳ · so sánh kỳ · dựng thang biểu đồ — HÀM THUẦN, không import React.

   Dashboard không tự tính tiền (backend cộng), nhưng nó quyết định NGƯỜI XEM SO
   CÁI GÌ VỚI CÁI GÌ — và đó là chỗ báo cáo hay nói dối nhất.

   ⚠ SÁU CÁI BẪY, đừng gỡ cái nào khi sửa hàm này:

   1. KỲ SO SÁNH PHẢI CÙNG ĐỘ DÀI. Tháng này mới qua 10 ngày mà đem so với TRỌN
      tháng trước thì tháng nào cũng "giảm 60%" — Giám đốc sẽ mất niềm tin vào
      dashboard trong đúng một tuần. `kyTruoc()` luôn trả đúng số ngày.
   2. CHIA CHO 0. Kỳ trước bằng 0 thì % thay đổi là vô nghĩa, không phải
      `Infinity` hay `NaN`: trả `null`, màn hiện “mới”.
   3. NGÀY THEO GIỜ ĐỊA PHƯƠNG. `toISOString()` ở múi +7 biến 0h ngày 1 thành
      ngày 31 tháng trước — bài học Bước 10, đừng lặp lại.
   4. CHUỖI NGÀY THIẾU ĐIỂM. API chỉ trả ngày CÓ doanh thu. Vẽ thẳng thì trục
      hoành co lại, ngày nghỉ biến mất và đường biểu đồ dốc sai.
   5. THANG BIỂU ĐỒ KHI MỌI GIÁ TRỊ BẰNG 0. Chia cho max = 0 ra `NaN`, cột SVG
      biến mất không báo lỗi.
   6. KỲ NGƯỢC (từ ngày > đến ngày). Vòng `while` dựng chuỗi ngày sẽ chạy mãi.
      Chặn ngay ở cửa, trả chuỗi rỗng. */

/** Số ngày của kỳ, ĐÓNG hai đầu: 01→01 là 1 ngày. 0 nếu kỳ ngược. */
export function soNgay(ky: Ky): number {
  const tu = ngayCuaChuoi(ky.tuNgay);
  const den = ngayCuaChuoi(ky.denNgay);
  if (!tu || !den) return 0;
  const lech = Math.round((den.getTime() - tu.getTime()) / 86_400_000);
  return lech < 0 ? 0 : lech + 1;
}

/** 'YYYY-MM-DD' → Date 0h ĐỊA PHƯƠNG. null nếu sai định dạng. */
function ngayCuaChuoi(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m || !m[1] || !m[2] || !m[3]) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

/** Khoảng ngày của một kỳ xem nhanh, tính theo `homNay` (mặc định: hôm nay).

    `thang-nay` kết thúc ở HÔM NAY chứ không phải cuối tháng — báo cáo không đếm
    doanh thu của những ngày chưa xảy ra. */
export function khoangKy(ma: MaKy, homNay: Date = new Date()): Ky {
  const nay = toIsoDate(homNay);
  switch (ma) {
    case 'hom-nay':
      return { tuNgay: nay, denNgay: nay };
    case '7-ngay':
      return { tuNgay: toIsoDate(addDays(homNay, -6)), denNgay: nay };
    case '30-ngay':
      return { tuNgay: toIsoDate(addDays(homNay, -29)), denNgay: nay };
    case 'thang-nay':
      return { tuNgay: toIsoDate(monthBounds(homNay).start), denNgay: nay };
    case 'tuy-chon':
      return { tuNgay: nay, denNgay: nay };
  }
}

/** Kỳ liền trước, CÙNG SỐ NGÀY. Kỳ ngược thì trả lại chính nó (không có gì để
    so). */
export function kyTruoc(ky: Ky): Ky {
  const n = soNgay(ky);
  if (n === 0) return ky;
  const tu = ngayCuaChuoi(ky.tuNgay);
  if (!tu) return ky;
  return {
    tuNgay: toIsoDate(addDays(tu, -n)),
    denNgay: toIsoDate(addDays(tu, -1)),
  };
}

/** Phần trăm thay đổi giữa hai kỳ. `null` khi kỳ trước bằng 0 — “tăng vô hạn”
    không phải một con số hiển thị được. */
export function phanTramThayDoi(nay: number, truoc: number): number | null {
  if (!Number.isFinite(nay) || !Number.isFinite(truoc)) return null;
  if (truoc === 0) return null;
  return ((nay - truoc) / Math.abs(truoc)) * 100;
}

export type ChieuThayDoi = 'tang' | 'giam' | 'khong-doi' | 'khong-so-duoc';

export function chieuThayDoi(pt: number | null): ChieuThayDoi {
  if (pt === null) return 'khong-so-duoc';
  if (Math.abs(pt) < 0.05) return 'khong-doi';
  return pt > 0 ? 'tang' : 'giam';
}

/** '+12,5%' · '−8,0%' · '0%' · '—'. Dấu phẩy thập phân theo lối Việt. */
export function moTaThayDoi(pt: number | null): string {
  const chieu = chieuThayDoi(pt);
  if (chieu === 'khong-so-duoc') return '—';
  if (chieu === 'khong-doi') return '0%';
  const so = Math.abs(pt as number).toFixed(1).replace('.', ',');
  return `${(pt as number) > 0 ? '+' : '−'}${so}%`;
}

/** Mọi ngày trong kỳ, theo thứ tự. Rỗng nếu kỳ ngược — BẪY 6. */
export function chuoiNgay(ky: Ky): string[] {
  const n = soNgay(ky);
  const tu = ngayCuaChuoi(ky.tuNgay);
  if (n === 0 || !tu) return [];
  const ra: string[] = [];
  for (let i = 0; i < n; i += 1) ra.push(toIsoDate(addDays(tu, i)));
  return ra;
}

/** Điền 0 cho ngày không có dữ liệu và bỏ điểm nằm ngoài kỳ — BẪY 4.
    Ngày trùng nhau thì cộng dồn, phòng khi backend trả tách theo CLB. */
export function dienDayChuoiNgay(diem: readonly DiemDoanhThu[], ky: Ky): DiemDoanhThu[] {
  const theoNgay = new Map<string, DiemDoanhThu>();
  for (const d of diem) {
    const cu = theoNgay.get(d.ngay);
    theoNgay.set(
      d.ngay,
      cu
        ? { ngay: d.ngay, doanhThu: cu.doanhThu + d.doanhThu, soGiaoDich: cu.soGiaoDich + d.soGiaoDich }
        : d,
    );
  }
  return chuoiNgay(ky).map(
    (ngay) => theoNgay.get(ngay) ?? { ngay, doanhThu: 0, soGiaoDich: 0 },
  );
}

export function tongDoanhThu(diem: readonly DiemDoanhThu[]): number {
  return diem.reduce((tong, d) => tong + d.doanhThu, 0);
}

export interface ThangCot {
  /** Đỉnh trục tung, đã làm tròn lên cho dễ đọc. 0 khi chưa có số liệu. */
  dinh: number;
  /** Ba mốc kẻ ngang, từ trên xuống. Rỗng khi `dinh === 0`. */
  moc: number[];
}

/** Thang trục tung: làm tròn LÊN tới bậc 1 / 2 / 5 × 10^n gần nhất để mốc đọc
    được (2.000.000 chứ không phải 1.873.412). */
export function thangCot(giaTri: readonly number[]): ThangCot {
  const max = giaTri.reduce((m, v) => (v > m ? v : m), 0);
  /* BẪY 5 — không có số liệu thì đỉnh là 0 và màn phải tự biết vẽ nền trống. */
  if (max <= 0) return { dinh: 0, moc: [] };

  const bac = 10 ** Math.floor(Math.log10(max));
  const heSo = [1, 2, 2.5, 5, 10].find((h) => h * bac >= max) ?? 10;
  const dinh = heSo * bac;
  return { dinh, moc: [dinh, dinh / 2, 0] };
}

/** Chiều cao cột theo phần trăm (0–100). Không bao giờ trả `NaN` — BẪY 5. */
export function phanTramCot(giaTri: number, dinh: number): number {
  if (!Number.isFinite(giaTri) || dinh <= 0) return 0;
  return Math.max(0, Math.min(100, (giaTri / dinh) * 100));
}

/** Nhãn ngắn trên trục hoành: 'DD/MM'. Nhiều ngày quá thì màn tự thưa nhãn. */
export function nhanNgayNgan(ngay: string): string {
  const d = ngayCuaChuoi(ngay);
  if (!d) return ngay;
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Bước thưa nhãn để trục hoành không chồng chữ: tối đa ~10 nhãn. */
export function buocThuaNhan(soDiem: number): number {
  return Math.max(1, Math.ceil(soDiem / 10));
}

/** Kỳ có hợp lệ để gửi lên API không. */
export function kyHopLe(ky: Ky): boolean {
  return soNgay(ky) > 0;
}
