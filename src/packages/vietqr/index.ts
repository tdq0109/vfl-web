/* Cửa công khai của gói VietQR.

   ⚠ Cùng quy ước với `features/` và `signature-pad`: module hàm thuần
   (`vietqr.ts`, `ma-tran.ts`) KHÔNG import qua cửa này — cửa kéo theo `MaQR.tsx`,
   tức là kéo React vào tầng đáng ra chỉ có phép tính. Cần hàm thuần thì nhập
   thẳng `@/packages/vietqr/vietqr`. */
export { MaQR } from './MaQR';
export { KhoiChuyenKhoan } from './KhoiChuyenKhoan';
export type { NganHang, ThongTinChuyenKhoan } from './vietqr';
