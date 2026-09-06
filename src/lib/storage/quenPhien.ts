import { quen as quenNgonNgu } from '@/lib/i18n/ngonNgu';
import { quen as quenClb } from './clbDangChon';

/* Xoá thứ nhớ theo người dùng. Hai cửa, cho hai lúc khác nhau.

   Gom về một chỗ thay vì gọi thẳng hai hàm quen() trong màn, vì chỗ nhớ theo
   người dùng sẽ còn thêm (bộ lọc đã lưu, cột đã ẩn, cỡ trang…) và thứ hỏng ở
   đây không bao giờ tự lộ ra: người thêm kho thứ ba thấy kho của mình chạy
   đúng, không thấy rằng nó ở lại máy sau khi đăng xuất. Chỉ người dùng tiếp
   theo ở quầy mới thấy, mà họ không biết đó là lỗi.

   Nên module nào có export function quen() thì bắt buộc phải được nhập vào đây. */

/** Gọi một hàm dọn, nuốt lỗi của riêng nó.

    Mỗi kho một try riêng: kho này hỏng không được chặn kho kia. Gộp chung một
    try là kho khai sau kho ném sẽ ở lại nguyên vẹn trên máy. */
function anToan(don: () => void): void {
  try {
    don();
  } catch {
    /* Kho bị chặn hoặc trình duyệt lạ — vẫn phải dọn nốt kho còn lại. */
  }
}

/** Xoá CLB đang chọn. Gọi khi màn hình đăng nhập hiện ra.

    CLB không bao giờ được sống sót qua trang đăng nhập. Nút Đăng xuất không
    phải đường ra duy nhất: hết phiên thì server chuyển hướng qua
    GET /api/auth/thoat, và đường đó không chạy được mã client nên
    sessionStorage giữ nguyên CLB của người trước. Dọn ở đây phủ mọi đường.

    Không tốn gì: middleware đá người còn phiên hiệu lực ra khỏi /dang-nhap (xem
    proxy.ts), nên hàm này chỉ chạy đúng lúc không có ai đang đăng nhập.

    Không dọn ngôn ngữ ở đây: ngôn ngữ là thói quen của người dùng
    (cookieNgonNgu.ts), dọn nó mỗi lần mở trang đăng nhập là mọi phiên đều bắt
    đầu bằng tiếng Việt. Nó chỉ dừng ở lần đăng xuất có chủ ý. */
export function quenClbDangChon(): void {
  anToan(quenClb);
}

/** Xoá mọi thứ nhớ theo người dùng. Gọi khi bấm nút Đăng xuất.

    Với CLB thì thừa hưởng là sai số liệu — bán vé và đặt lịch vào nhầm cơ sở.
    Với ngôn ngữ thì chỉ phiền, nhưng cùng một lý do.

    Đánh đổi đã biết: máy cá nhân thì mỗi lần đăng nhập lại phải chọn tiếng Anh
    một lần nữa. Chọn theo quầy vì đó là chỗ có lỗi thật; muốn giữ ngôn ngữ qua
    lần đăng nhập thì bỏ dòng anToan(quenNgonNgu) dưới đây. */
export function quenMoiThuCuaNguoiDung(): void {
  anToan(quenClb);
  anToan(quenNgonNgu);
}
