import type { IsoDate } from '@/lib/api/types';
import type { Role } from '@/lib/auth/permissions';

/* Kiểu + khoá i18n của nhãn nhóm Nhân viên, theo khuôn nhóm Hội viên
   (features/hoi-vien/types.ts). Bảng dưới đây chứa khoá i18n chứ không phải chữ
   tiếng Việt; đọc nhãn bằng t(NHAN_VIEN_STATUS_KHOA[s]). Giữ hình
   Record<NhanVienStatus, string> để TypeScript vẫn bắt thiếu nhánh lúc biên
   dịch; còn khoá có thật trong từ điển hay không thì phải tự đối chiếu.

   Không có lương, phụ cấp hay chấm công ở đây: payroll không thuộc Phase 1 —
   sai lương là sai với người lao động, phần đó cần 6–8 tuần riêng. */

export type NhanVienStatus = 'dang-lam' | 'nghi-phep' | 'da-nghi';

export const NHAN_VIEN_STATUS_KHOA: Record<NhanVienStatus, string> = {
  'dang-lam': 'nhanVien.trangThai.dang-lam',
  'nghi-phep': 'nhanVien.trangThai.nghi-phep',
  'da-nghi': 'nhanVien.trangThai.da-nghi',
};

export const NHAN_VIEN_STATUS_ORDER: NhanVienStatus[] = ['dang-lam', 'nghi-phep', 'da-nghi'];

export interface NhanVien {
  id: string;
  maNhanVien: string;
  hoTen: string;
  soDienThoai: string;
  email: string;
  /** Mã vai trò — xem lib/auth/permissions.ts */
  vaiTro: string;
  locationId: string;
  locationName?: string;
  /** Cờ toàn hệ thống — chỉ Giám đốc / CEO gán được. */
  allLocations: boolean;
  trangThai: NhanVienStatus;
  ngayVaoLam: IsoDate;
  ghiChu?: string;
}

export interface NhanVienListParams {
  page: number;
  pageSize: number;
  search?: string;
  vaiTro?: Role;
  trangThai?: NhanVienStatus;
  locationId?: string;
}

/** Dữ liệu form thêm / sửa hồ sơ. Vai trò và cờ toàn hệ thống đổi qua endpoint
    riêng vì chúng chịu kiểm tra phân quyền chặt hơn. */
export interface NhanVienInput {
  hoTen: string;
  soDienThoai: string;
  email: string;
  locationId: string;
  ngayVaoLam?: string;
  ghiChu?: string;
}

/** Dữ liệu đổi vai trò — chiều 1 + chiều 3 của phân quyền. */
export interface DoiVaiTroInput {
  vaiTro: Role;
  allLocations: boolean;
}
