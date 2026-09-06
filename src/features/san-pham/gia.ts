import { toIsoDate } from '@/lib/format';
import type { KhuyenMai, KhuyenMaiStatus, SanPham } from './types';

/* Quy tắc giá — hàm thuần, không import React.

   Đây là chỗ tiền chạy qua nên tách riêng khỏi component: sai một phép tính là
   bán dưới giá vốn hàng loạt. Backend .NET vẫn phải kiểm tra lại, phần này chỉ
   để chặn sớm và cảnh báo cho người nhập.

   Ba hàm kiểm tra trả về khoá i18n chứ không phải câu tiếng Việt; màn gọi
   t(loi). Hàm thuần không có ngôn ngữ hiện hành để mà tra, gọi t() ở tầng này
   là đóng băng chuỗi theo ngôn ngữ lúc nạp tệp. null vẫn giữ nghĩa "không có
   lỗi" nên chỗ gọi không phải đổi cách kiểm. */

/** Giá sàn không được cao hơn giá niêm yết. Trả khoá i18n hoặc null. */
export function kiemTraGiaSan(giaNiemYet: number, giaSan: number): string | null {
  if (giaSan < 0) return 'sanPham.loi.giaSanAm';
  if (giaSan > giaNiemYet) {
    return 'sanPham.loi.giaSanCaoHon';
  }
  return null;
}

/** Kiểm tra giá trị khuyến mãi hợp lệ theo loại giảm. Trả khoá i18n hoặc
    null. */
export function kiemTraGiaTriGiam(loaiGiam: KhuyenMai['loaiGiam'], giaTri: number): string | null {
  if (giaTri <= 0) return 'sanPham.loi.giamPhaiLonHon0';
  if (loaiGiam === 'phan-tram' && giaTri > 100) return 'sanPham.loi.phanTramQua100';
  return null;
}

/** Giá sau khi áp khuyến mãi, chưa xét giá sàn. Không bao giờ âm. */
export function giaSauGiam(giaGoc: number, khuyenMai: Pick<KhuyenMai, 'loaiGiam' | 'giaTri'>): number {
  const giam =
    khuyenMai.loaiGiam === 'phan-tram'
      ? Math.round((giaGoc * khuyenMai.giaTri) / 100)
      : khuyenMai.giaTri;
  return Math.max(0, giaGoc - giam);
}

/** Khuyến mãi có kéo giá sản phẩm xuống dưới giá sàn không. */
export function viPhamGiaSan(
  sanPham: Pick<SanPham, 'giaNiemYet' | 'giaSan'>,
  khuyenMai: Pick<KhuyenMai, 'loaiGiam' | 'giaTri'>,
): boolean {
  return giaSauGiam(sanPham.giaNiemYet, khuyenMai) < sanPham.giaSan;
}

/** Trạng thái hiển thị của khuyến mãi tại ngày `homNay` (mặc định: hôm nay).
    So sánh theo chuỗi 'YYYY-MM-DD' nên không dính lệch múi giờ. */
export function trangThaiKhuyenMai(
  khuyenMai: Pick<KhuyenMai, 'tuNgay' | 'denNgay' | 'kichHoat'>,
  homNay: Date = new Date(),
): KhuyenMaiStatus {
  if (!khuyenMai.kichHoat) return 'tam-dung';
  const ngay = toIsoDate(homNay);
  if (ngay < khuyenMai.tuNgay) return 'sap-toi';
  if (ngay > khuyenMai.denNgay) return 'het-han';
  return 'dang-chay';
}

/** Khoảng ngày hợp lệ: từ ngày không được sau đến ngày. Trả khoá i18n hoặc
    null. */
export function kiemTraKhoangNgay(tuNgay: string, denNgay: string): string | null {
  if (!tuNgay || !denNgay) return null;
  return tuNgay > denNgay ? 'sanPham.loi.ngayNguoc' : null;
}
