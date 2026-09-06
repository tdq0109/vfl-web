import { useQueryClient } from '@tanstack/react-query';
import { quenClbDangChon, quenMoiThuCuaNguoiDung } from '@/lib/storage/quenPhien';

/* Dọn mọi thứ thuộc về người dùng trước — kho trình duyệt và cache truy vấn.

   Ở quầy dùng chung một máy: người trước đăng xuất, người sau đăng nhập ngay
   trên cùng tab. Backend đổi phiên đúng nhưng màn hình vẫn là của người trước —
   /api/auth/me trả Trần Sales · staff · một CLB, còn thanh trên vẫn hiện "Phạm
   Giám Đốc" và ô "Tất cả CLB". Nhấn F5 thì đúng lại ngay.

   Nguyên do: QueryClient tạo một lần cho mỗi lần gắn (useState ở
   app/providers.tsx), mà đăng xuất rồi đăng nhập đều là điều hướng phía client
   nên không có lần gắn mới nào. Cache keys.session (staleTime 5 phút) sống
   nguyên, và useQuery ưu tiên dữ liệu đã cache hơn initialData mà layout server
   truyền xuống.

   Nặng hơn chuyện hiện nhầm tên: useSession() nuôi <Can>, hasMinRole() và phạm
   vi CLB, nên cả lớp ẩn nút chạy trên hồ sơ của người trước. Backend vẫn từ
   chối (đã thử, 403) nên không phải lỗ hổng bảo mật, nhưng cùng họ với lỗi thừa
   hưởng CLB.

   Đừng chỉ xoá riêng khoá session: mọi thứ trong cache đều là dữ liệu của người
   trước — danh sách hội viên theo CLB của họ, hợp đồng họ được xem. */

/** Dọn khi bấm đăng xuất: cache + mọi kho theo người dùng, kể cả ngôn ngữ. */
export function useDonPhienKhiDangXuat(): () => void {
  const qc = useQueryClient();
  return () => {
    qc.clear();
    quenMoiThuCuaNguoiDung();
  };
}

/** Dọn khi màn đăng nhập hiện ra: cache + CLB đang chọn, giữ ngôn ngữ.

    Phủ nốt đường hết phiên (GET /api/auth/thoat) — đường đó không chạy được mã
    client nên nút Đăng xuất không với tới. Lý do giữ ngôn ngữ nằm ở
    lib/storage/quenPhien.ts. */
export function useDonPhienKhiVaoManDangNhap(): () => void {
  const qc = useQueryClient();
  return () => {
    qc.clear();
    quenClbDangChon();
  };
}
