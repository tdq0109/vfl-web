import { quen as quenNgonNgu } from '@/lib/i18n/ngonNgu';
import { quen as quenClb } from './clbDangChon';

/* Xoá thứ nhớ theo NGƯỜI DÙNG. Hai cửa, cho hai lúc khác nhau.

   ⚠ VÌ SAO CÓ TỆP NÀY thay vì gọi thẳng hai hàm `quen()` trong màn: chỗ nhớ theo
   người dùng sẽ còn thêm (bộ lọc đã lưu, cột đã ẩn, cỡ trang…), và thứ hỏng ở
   đây KHÔNG BAO GIỜ tự lộ ra. Người thêm kho thứ ba sẽ thấy kho của mình chạy
   đúng, không thấy rằng nó ở lại máy sau khi đăng xuất — chỉ người dùng TIẾP
   THEO ở quầy mới thấy, và họ không biết đó là lỗi.

   Vì vậy: MỘT cửa tập trung. Module nào có `export function quen()` thì BẮT BUỘC
   phải được nhập vào đây — không có lưới tự động canh việc đó nữa.

   Đây là chuyện của QUẦY: máy dùng chung, người trước rời đi rồi người sau đăng
   nhập ngay trên cùng tab. */

/** Gọi một hàm dọn, nuốt lỗi của riêng nó.

    Mỗi kho một `try` RIÊNG: kho này hỏng không được chặn kho kia. Gộp chung một
    `try` là kho khai sau kho ném sẽ ở lại nguyên vẹn trên máy — đúng cái lỗi tệp
    này sinh ra để chặn, chỉ im lặng hơn. */
function anToan(don: () => void): void {
  try {
    don();
  } catch {
    /* Kho bị chặn hoặc trình duyệt lạ — vẫn phải dọn nốt kho còn lại. */
  }
}

/** Xoá CLB đang chọn. Gọi khi màn hình ĐĂNG NHẬP hiện ra.

    ⚠ Luật: **CLB không bao giờ sống sót qua trang đăng nhập.** Nút Đăng xuất
    không phải đường ra duy nhất — hết phiên thì server chuyển hướng qua
    `GET /api/auth/thoat`, và đường đó không chạy được mã client nên
    `sessionStorage` giữ nguyên CLB của người trước. Dọn ở đây phủ MỌI đường:
    đăng xuất, hết phiên, gõ thẳng URL.

    Không tốn gì: middleware đá người còn phiên hiệu lực ra khỏi `/dang-nhap`
    (xem `proxy.ts`), nên hàm này chỉ chạy đúng lúc KHÔNG CÓ AI đang đăng nhập —
    mà lúc đó thì không CLB nào được phép còn chọn.

    KHÔNG dọn ngôn ngữ ở đây: ngôn ngữ là thói quen của người dùng
    (`cookieNgonNgu.ts`), dọn nó ở mỗi lần mở trang đăng nhập là mọi phiên đều
    bắt đầu bằng tiếng Việt và tuỳ chọn thành vô nghĩa. Nó chỉ dừng ở lần đăng
    xuất CÓ CHỦ Ý — xem `quenMoiThuCuaNguoiDung()`. */
export function quenClbDangChon(): void {
  anToan(quenClb);
}

/** Xoá MỌI thứ nhớ theo người dùng. Gọi khi bấm nút Đăng xuất.

    Với CLB thì thừa hưởng là sai SỐ LIỆU — bán vé và đặt lịch vào nhầm cơ sở.
    Với ngôn ngữ thì chỉ phiền, nhưng cùng một lý do.

    ⚠ ĐÁNH ĐỔI ĐÃ BIẾT: máy CÁ NHÂN thì mỗi lần đăng nhập lại phải chọn tiếng Anh
    một lần nữa, tức là ngôn ngữ mất tính "thói quen" mà `cookieNgonNgu.ts` cố
    giữ. Chọn quầy vì đó là chỗ có lỗi thật; muốn giữ ngôn ngữ qua lần đăng nhập
    thì bỏ đúng dòng `anToan(quenNgonNgu)` dưới đây, và nhớ bỏ cả dòng tương ứng
    trong test. */
export function quenMoiThuCuaNguoiDung(): void {
  anToan(quenClb);
  anToan(quenNgonNgu);
}
