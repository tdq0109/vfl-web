/* Cửa công khai của nhóm Hợp đồng. Feature khác chỉ import từ đây.

   ⚠ Tầng hàm thuần của nhóm khác thì nhập THẲNG `@/features/hop-dong/hop-dong`,
   đừng đi qua cửa này — cửa kéo theo màn hình .tsx, tức là kéo React vào chỗ
   đáng ra chỉ có phép tính. */
export { HopDongScreen } from './HopDongScreen';
export {
  HANH_DONG_KHOA,
  TRANG_THAI_HOP_DONG_KHOA,
  type DongHopDong,
  type HopDong,
  type ThanhToanHopDong,
  type TrangThaiHienThi,
  type TrangThaiHopDong,
} from './types';
export {
  conPhaiThu,
  daThuDu,
  tienDaThu,
  tinhTongHopDong,
  trangThaiHienThi,
  viSaoKhongChuyenDuoc,
} from './hop-dong';
export { hopDongApi } from './api';
