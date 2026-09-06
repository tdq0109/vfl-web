import { useQueryClient } from '@tanstack/react-query';
import { quenClbDangChon, quenMoiThuCuaNguoiDung } from '@/lib/storage/quenPhien';

/* Dọn mọi thứ thuộc về NGƯỜI DÙNG TRƯỚC — kho trình duyệt VÀ cache truy vấn.

   🐞 VÌ SAO CÓ TỆP NÀY — lỗi thật, dựng lại được trên app đang chạy. Ở quầy dùng
   chung một máy: người trước đăng xuất, người sau đăng nhập ngay trên cùng tab.
   Backend đổi phiên đúng, nhưng MÀN HÌNH vẫn là của người trước:

     `/api/auth/me` trả  →  Trần Sales · staff · một CLB
     thanh trên hiện     →  "Phạm Giám Đốc" · "PĐ" · có ô "Tất cả CLB"

   Nhấn F5 thì đúng lại ngay — đó chính là bằng chứng chỉ mặt thủ phạm.

   Nguyên do: `QueryClient` tạo MỘT LẦN cho mỗi lần gắn (`useState` ở
   `app/providers.tsx`), mà đăng xuất rồi đăng nhập đều là điều hướng phía
   client — không có lần gắn mới nào. Cache `keys.session` (`staleTime` 5 phút)
   sống nguyên, và `useQuery` ưu tiên dữ liệu đã cache hơn `initialData` mà
   layout server truyền xuống.

   ⚠ HỆ QUẢ NẶNG HƠN "hiện nhầm tên": `useSession()` nuôi `<Can>`, `hasMinRole()`
   và phạm vi CLB. Nghĩa là toàn bộ lớp "ẩn nút" chạy trên HỒ SƠ CỦA NGƯỜI TRƯỚC
   — người sau thấy nút của cấp cao hơn, và thấy cả ô "Tất cả CLB". Backend vẫn
   từ chối (đã thử: 403), nên đây không phải lỗ hổng bảo mật; nhưng nó là cùng
   một họ với lỗi thừa hưởng CLB ở A4, chỉ sâu hơn một tầng.

   ⚠ ĐỪNG chỉ xoá riêng khoá `session`. Mọi thứ trong cache đều là dữ liệu của
   người trước — danh sách hội viên theo CLB của họ, hợp đồng họ được xem. Xoá
   sạch là cách duy nhất không phải nhớ danh sách. */

/** Dọn khi bấm ĐĂNG XUẤT: cache + mọi kho theo người dùng (kể cả ngôn ngữ). */
export function useDonPhienKhiDangXuat(): () => void {
  const qc = useQueryClient();
  return () => {
    qc.clear();
    quenMoiThuCuaNguoiDung();
  };
}

/** Dọn khi MÀN ĐĂNG NHẬP hiện ra: cache + CLB đang chọn, GIỮ ngôn ngữ.

    Phủ nốt đường hết phiên (`GET /api/auth/thoat`) — đường đó không chạy được mã
    client nên nút Đăng xuất không với tới. Lý do giữ ngôn ngữ nằm ở
    `lib/storage/quenPhien.ts`. */
export function useDonPhienKhiVaoManDangNhap(): () => void {
  const qc = useQueryClient();
  return () => {
    qc.clear();
    quenClbDangChon();
  };
}
