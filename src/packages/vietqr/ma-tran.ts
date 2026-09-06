import qrcode from 'qrcode-generator';
import { chuoiVietQRHopLe } from './vietqr';

/* Ma trận ô đen/trắng của mã QR — hàm thuần, không chạm DOM. Phần vẽ ở MaQR.tsx.

   Bản cũ vẽ QR bằng QRious tải từ CDN, không dùng lại được: bản thật chạy sau
   tường lửa CLB, mất mạng ra ngoài là quầy mất luôn mã QR thu tiền. Nay dùng
   qrcode-generator — không có phụ thuộc con, và chính là bản gốc mà QRious dẫn
   xuất ra.

   Ba chỗ đừng gỡ khi sửa: chuỗi phải qua chuoiVietQRHopLe() trước khi dựng ma
   trận, vì mã hỏng thì khách quét ra chuỗi rác hoặc một lệnh chuyển tiền sai;
   mức sửa lỗi giữ 'M', hạ xuống 'L' là in giấy nhiệt nhoè một góc hết quét
   được; chuỗi phải là ASCII vì bộ đổi chuỗi-thành-byte của thư viện chỉ đúng
   với ASCII/latin. */

/** Mức sửa lỗi. Giữ 'M' như bản cũ. */
export const MUC_SUA_LOI = 'M';

/** Vùng lặng quanh mã, tính bằng số ô. Chuẩn QR đòi tối thiểu 4; thiếu nó thì
    nhiều máy quét không tìm ra được ba ô định vị ở góc. */
export const VUNG_LANG = 4;

/** Lưới ô đen/trắng của mã QR cho một chuỗi VietQR.

    Trả null khi chuỗi không phải mã VietQR nguyên vẹn — chỗ gọi phải hiểu null
    là "đừng vẽ gì". */
export function maTranQR(chuoi: string): boolean[][] | null {
  if (!chuoiVietQRHopLe(chuoi)) return null;
  /* Chặn lại lần nữa ở đúng chỗ sắp mã hoá thành byte. */
  if (!/^[\x20-\x7e]*$/.test(chuoi)) return null;

  try {
    /* 0 nghĩa là tự chọn phiên bản nhỏ nhất chứa vừa chuỗi. */
    const qr = qrcode(0, MUC_SUA_LOI);
    qr.addData(chuoi);
    qr.make();

    const soO = qr.getModuleCount();
    const luoi: boolean[][] = [];
    for (let hang = 0; hang < soO; hang += 1) {
      const dong: boolean[] = [];
      for (let cot = 0; cot < soO; cot += 1) dong.push(qr.isDark(hang, cot));
      luoi.push(dong);
    }
    return luoi;
  } catch {
    /* Chuỗi dài quá sức chứa của QR phiên bản 40, hoặc lỗi khác của thư viện.
       Không vẽ còn hơn vẽ bừa. */
    return null;
  }
}
