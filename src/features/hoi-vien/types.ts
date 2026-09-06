import type { IsoDate } from '@/lib/api/types';

/* Kiểu + KHOÁ i18n của nhãn nhóm Hội viên. Nhãn để một chỗ, mọi nơi hiển thị
   lấy từ đây.

   ⚠ CÁC BẢNG DƯỚI ĐÂY CHỨA KHOÁ i18n, KHÔNG PHẢI CHỮ TIẾNG VIỆT. Đọc nhãn bằng
   `t(HOI_VIEN_STATUS_KHOA[s])` — xem `NgonNguProvider.useT()`.

   Vì sao vẫn giữ hình `Record<HoiVienStatus, string>` thay vì ghép khoá từ giá
   trị lúc chạy: `Record` bắt TypeScript kiểm ĐỦ NHÁNH ngay lúc biên dịch — thêm
   một trạng thái mới mà quên khai nhãn là lỗi biên dịch, không phải một ô trống
   trên màn. Ghép chuỗi thì mất hẳn hàng rào đó. Phần còn lại — khoá có thật
   trong từ điển hay không — phải tự đối chiếu với `lib/i18n`.

   Đây là khuôn cho 5 nhóm nghiệp vụ còn lại; xem mục 3 của tài liệu bàn giao. */

export type HoiVienStatus = 'dang-hoat-dong' | 'tam-dung' | 'het-han' | 'huy';

export const HOI_VIEN_STATUS_KHOA: Record<HoiVienStatus, string> = {
  'dang-hoat-dong': 'hoiVien.trangThai.dang-hoat-dong',
  'tam-dung': 'hoiVien.trangThai.tam-dung',
  'het-han': 'hoiVien.trangThai.het-han',
  huy: 'hoiVien.trangThai.huy',
};

export const HOI_VIEN_STATUS_ORDER: HoiVienStatus[] = [
  'dang-hoat-dong',
  'tam-dung',
  'het-han',
  'huy',
];

export type GioiTinh = 'nam' | 'nu' | 'khac';

export const GIOI_TINH_KHOA: Record<GioiTinh, string> = {
  nam: 'hoiVien.gioiTinh.nam',
  nu: 'hoiVien.gioiTinh.nu',
  khac: 'hoiVien.gioiTinh.khac',
};

/* Thứ tự hiện trong ô chọn. Trước đây lấy từ `Object.keys(GIOI_TINH_LABEL)` —
   dựa vào thứ tự khoá của object là dựa vào thứ dễ đổi mà không ai để ý. */
export const GIOI_TINH_ORDER: GioiTinh[] = ['nam', 'nu', 'khac'];

export interface HoiVien {
  id: string;
  maHoiVien: string;
  hoTen: string;
  soDienThoai: string;
  email?: string;
  gioiTinh?: GioiTinh;
  ngaySinh?: IsoDate;
  locationId: string;
  locationName?: string;
  trangThai: HoiVienStatus;
  ngayThamGia: IsoDate;
  ghiChu?: string;
}

/** Tham số truy vấn danh sách. `page` đếm từ 1. */
export interface HoiVienListParams {
  page: number;
  pageSize: number;
  search?: string;
  trangThai?: HoiVienStatus;
  locationId?: string;
}

/** Dữ liệu form thêm / sửa. */
export interface HoiVienInput {
  hoTen: string;
  soDienThoai: string;
  email?: string;
  gioiTinh?: GioiTinh;
  ngaySinh?: string;
  locationId: string;
  ghiChu?: string;
}
