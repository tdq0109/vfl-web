/* Cửa công khai của Dashboard.

   ⚠ Như các nhóm khác: tầng hàm thuần nhập THẲNG `@/features/tong-quan/tong-quan`,
   không qua cửa này — cửa kéo theo màn hình `.tsx`. */
export { TongQuanScreen } from './TongQuanScreen';
export {
  MA_KY_KHOA,
  type DiemDoanhThu,
  type HomNay,
  type Ky,
  type MaKy,
  type TomTatTongQuan,
  type TopSanPham,
} from './types';
export {
  chuoiNgay,
  dienDayChuoiNgay,
  khoangKy,
  kyTruoc,
  moTaThayDoi,
  phanTramThayDoi,
  soNgay,
} from './tong-quan';
export { tongQuanApi } from './api';
