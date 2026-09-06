import type { Location, TaiKhoanNhanTien } from '@/lib/api/types';

/* Tra cứu theo câu lạc bộ — HÀM THUẦN, không import React.

   Ở đây chứ không nằm trong `features/hop-dong`: luật này là luật của CLB, và cả
   nhóm Hợp đồng lẫn nhóm Bán vé quầy đều cần. Để nó nằm trong một feature rồi
   feature kia nhập chéo sang là bắt đầu con đường mọi thứ nhập của mọi thứ. */

/** Tài khoản nhận chuyển khoản của MỘT câu lạc bộ cụ thể.

    ⚠ BẪY — luôn tra theo `locationId` của CHỨNG TỪ (hợp đồng đang mở, ca quầy
    đang bán), KHÔNG phải CLB đang chọn trên thanh trên. Hai thứ đó khác nhau
    ngay khi người có cờ toàn hệ thống mở một hợp đồng của CLB khác; lấy nhầm là
    khách chuyển tiền về CLB không bán, và kế toán bên bán không thấy tiền đâu.

    Trả `undefined` khi không tra được — chỗ gọi phải hiểu là "không hiện mã QR".
    TUYỆT ĐỐI không rơi về một tài khoản mặc định nào: rơi về CLB đầu danh sách
    là cách êm ái nhất để tiền chạy sai chỗ mà màn hình vẫn trông bình thường. */
export function taiKhoanNhanTienCua(
  locationId: string,
  locations: readonly Location[],
): TaiKhoanNhanTien | undefined {
  return locations.find((l) => l.id === locationId)?.taiKhoanNhanTien;
}
