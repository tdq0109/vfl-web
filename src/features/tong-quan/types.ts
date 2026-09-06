import type { IsoDate, Vnd } from '@/lib/api/types';

/* Kiểu + KHOÁ i18n của nhãn Dashboard. Theo đúng khuôn nhóm Hội viên — xem
   `features/hoi-vien/types.ts`.

   ⚠ BẢNG DƯỚI ĐÂY CHỨA KHOÁ i18n, KHÔNG PHẢI CHỮ TIẾNG VIỆT. Đọc nhãn bằng
   `t(MA_KY_KHOA[m])`; khoá phải có thật trong từ điển `lib/i18n`.

   ⚠ Dashboard KHÔNG có nghiệp vụ riêng — nó chỉ tổng hợp lại sáu nhóm kia. Mọi
   con số ở đây là do backend cộng; frontend chỉ lo CHỌN KỲ, SO SÁNH KỲ và VẼ.
   Đừng bao giờ tự cộng doanh thu từ danh sách hợp đồng ở màn này: hai nguồn số
   sẽ lệch nhau và không ai biết tin cái nào. */

/** Kỳ xem nhanh. `tuy-chon` = người dùng tự nhập hai đầu ngày. */
export type MaKy = 'hom-nay' | '7-ngay' | '30-ngay' | 'thang-nay' | 'tuy-chon';

export const MA_KY_KHOA: Record<MaKy, string> = {
  'hom-nay': 'tongQuan.ky.hom-nay',
  '7-ngay': 'tongQuan.ky.7-ngay',
  '30-ngay': 'tongQuan.ky.30-ngay',
  'thang-nay': 'tongQuan.ky.thang-nay',
  'tuy-chon': 'tongQuan.ky.tuy-chon',
};

/** Các kỳ hiện thành nút bấm nhanh; `tuy-chon` bật khi người dùng sửa ô ngày. */
export const MA_KY_ORDER: MaKy[] = ['hom-nay', '7-ngay', '30-ngay', 'thang-nay'];

/** Khoảng ngày ĐÓNG hai đầu, theo giờ địa phương. */
export interface Ky {
  tuNgay: IsoDate;
  denNgay: IsoDate;
}

/** Số tổng hợp của một kỳ. Cùng hình dạng cho kỳ hiện tại và kỳ trước — màn gọi
    hai lần rồi so, không có endpoint "so sánh" riêng. */
export interface TomTatTongQuan {
  doanhThu: Vnd;
  /** Hợp đồng phát hành trong kỳ. */
  soHopDong: number;
  hoiVienMoi: number;
  /** Buổi tập đã diễn ra (không tính buổi huỷ). */
  soBuoiTap: number;
  /** Doanh thu bán vé ngày tại quầy, nằm trong `doanhThu`. */
  doanhThuQuay: Vnd;
  /** Còn phải thu của hợp đồng chưa thu đủ — số CHỐT TẠI THỜI ĐIỂM XEM,
      không thuộc về kỳ nào, nên không so sánh kỳ trước. */
  congNo: Vnd;
}

/** Một điểm trên biểu đồ doanh thu theo ngày. */
export interface DiemDoanhThu {
  ngay: IsoDate;
  doanhThu: Vnd;
  soGiaoDich: number;
}

export interface TopSanPham {
  sanPhamId: string;
  ten: string;
  soLuong: number;
  doanhThu: Vnd;
}

/** Khối “hôm nay” — việc đang chờ người vận hành, ai cũng xem được. */
export interface HomNay {
  soBuoiHomNay: number;
  soBuoiConCho: number;
  hopDongChoThuTien: number;
  hopDongChoXacMinh: number;
  /** Quầy đang mở ca hay chưa (null khi xem nhiều CLB). */
  caQuayDangMo: boolean | null;
}

export interface TongQuanParams {
  tuNgay: string;
  denNgay: string;
  locationId?: string;
}
