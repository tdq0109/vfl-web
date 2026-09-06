import qrcode from 'qrcode-generator';
import { chuoiVietQRHopLe } from './vietqr';

/* Ma trận ô đen/trắng của mã QR — HÀM THUẦN, không chạm DOM.

   Bản cũ vẽ QR bằng thư viện `QRious` tải từ CDN
   (`commercial-console.html` dòng 320). Không có bản cục bộ nào để port, và
   CDN thì không dùng được: bản thật chạy sau tường lửa CLB, mất mạng ra ngoài
   là quầy mất luôn mã QR thu tiền.

   Nay dùng `qrcode-generator` — không có phụ thuộc con, và chính là bản gốc mà
   `QRious` cùng phần lớn thư viện QR khác dẫn xuất ra. Việc mã hoá QR gồm
   Reed-Solomon, chọn mặt nạ và bố trí ma trận; đây đúng loại thuật toán mà mục
   8 dặn "port nguyên văn, đừng viết lại".

   Tầng này chỉ đổi chuỗi thành lưới boolean. Phần vẽ nằm ở `MaQR.tsx`.

   ⚠ BA CÁI BẪY, đừng gỡ cái nào khi sửa hàm này:

   1. VẼ MÃ HỎNG CÒN TỆ HƠN KHÔNG VẼ. Một mã QR nhìn thì mã nào cũng như mã nào;
      khách quét ra chuỗi rác, hoặc tệ hơn là ra một lệnh chuyển tiền sai. Nên
      chuỗi phải qua `chuoiVietQRHopLe()` (đọc lại TLV + đối chiếu CRC) TRƯỚC
      khi dựng ma trận.
   2. MỨC SỬA LỖI. Giữ 'M' như bản cũ (QRious `level:'M'`). Hạ xuống 'L' cho mã
      nhỏ lại là mã in ra giấy nhiệt bị nhoè một góc thì hết quét được.
   3. CHUỖI NGOÀI ASCII. Bộ đổi chuỗi-thành-byte mặc định của thư viện chỉ đúng
      với ASCII/latin. `chuoiVietQR()` đã ép ASCII, nhưng tầng này nhận chuỗi từ
      bên ngoài nên phải tự kiểm lại — im lặng mã hoá sai là mã quét ra chuỗi
      khác hẳn thứ mình định gửi. */

/** Mức sửa lỗi. Giữ 'M' như bản cũ — xem bẫy 2. */
export const MUC_SUA_LOI = 'M';

/** Vùng lặng quanh mã, tính bằng số ô. Chuẩn QR đòi tối thiểu 4; thiếu nó thì
    nhiều máy quét không tìm ra được ba ô định vị ở góc. */
export const VUNG_LANG = 4;

/** Lưới ô đen/trắng của mã QR cho một chuỗi VietQR.

    Trả `null` khi chuỗi không phải mã VietQR nguyên vẹn — chỗ gọi phải hiểu
    `null` là "đừng vẽ gì", xem bẫy 1. */
export function maTranQR(chuoi: string): boolean[][] | null {
  if (!chuoiVietQRHopLe(chuoi)) return null;
  /* BẪY 3 — chặn lại lần nữa ở đúng chỗ sắp mã hoá thành byte. */
  if (!/^[\x20-\x7e]*$/.test(chuoi)) return null;

  try {
    /* `0` = tự chọn phiên bản nhỏ nhất chứa vừa chuỗi. */
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
