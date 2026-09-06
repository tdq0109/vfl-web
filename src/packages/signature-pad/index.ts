/* Cửa công khai của gói chữ ký tay.

   ⚠ Cùng quy ước với `features/`: module hàm thuần `chu-ky.ts` KHÔNG import qua
   cửa này — cửa kéo theo `ChuKyPad.tsx`, tức là kéo React vào tầng đáng ra chỉ
   có phép tính. Cần hàm thuần thì nhập thẳng `@/packages/signature-pad/chu-ky`. */
export { ChuKyPad, type ChuKyPadHandle } from './ChuKyPad';
