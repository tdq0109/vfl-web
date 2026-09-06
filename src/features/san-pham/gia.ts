import { toIsoDate } from '@/lib/format';
import type { KhuyenMai, KhuyenMaiStatus, SanPham } from './types';

/* Quy tắc giá — HÀM THUẦN, không import React.

   Đây là chỗ tiền chạy qua nên tách riêng khỏi component: sai một phép tính ở
   đây là bán dưới giá vốn hàng loạt. Backend .NET vẫn phải kiểm tra lại — phần
   này chỉ để chặn sớm và cảnh báo cho người nhập.

   ⚠ BA HÀM KIỂM TRA TRẢ VỀ KHOÁ i18n, KHÔNG PHẢI CÂU TIẾNG VIỆT. Màn gọi
   `t(loi)` để lấy chữ. Không gọi `t()` ngay tại đây: hàm thuần không có ngôn ngữ
   hiện hành để mà tra — gọi `t()` ở tầng này là đóng băng chuỗi theo ngôn ngữ
   lúc nạp tệp, đúng cái bẫy đã ghi ở phần toast của nhóm Hội viên.

   `null` vẫn giữ nguyên nghĩa "không có lỗi", nên chỗ gọi không phải đổi cách
   kiểm. Mọi khoá trả ra phải có thật trong `lib/i18n` — tự đối chiếu. */

/** Giá sàn không được cao hơn giá niêm yết. Trả KHOÁ i18n của lỗi, hoặc null. */
export function kiemTraGiaSan(giaNiemYet: number, giaSan: number): string | null {
  if (giaSan < 0) return 'sanPham.loi.giaSanAm';
  if (giaSan > giaNiemYet) {
    return 'sanPham.loi.giaSanCaoHon';
  }
  return null;
}

/** Kiểm tra giá trị khuyến mãi hợp lệ theo loại giảm. Trả KHOÁ i18n, hoặc null. */
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

/** Khuyến mãi có kéo giá sản phẩm xuống DƯỚI giá sàn không. */
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

/** Khoảng ngày hợp lệ: từ ngày không được sau đến ngày. Trả KHOÁ i18n, hoặc null. */
export function kiemTraKhoangNgay(tuNgay: string, denNgay: string): string | null {
  if (!tuNgay || !denNgay) return null;
  return tuNgay > denNgay ? 'sanPham.loi.ngayNguoc' : null;
}
