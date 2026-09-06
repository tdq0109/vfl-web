import type { Location, TaiKhoanNhanTien } from '@/lib/api/types';

/* Tra cứu theo câu lạc bộ — hàm thuần, không import React.

   Ở đây chứ không nằm trong features/hop-dong: luật này là luật của CLB, và cả
   nhóm Hợp đồng lẫn nhóm Bán vé quầy đều cần. */

/** Tài khoản nhận chuyển khoản của một câu lạc bộ cụ thể.

    Luôn tra theo locationId của chứng từ (hợp đồng đang mở, ca quầy đang bán)
    chứ không phải CLB đang chọn trên thanh trên. Hai thứ đó khác nhau ngay khi
    người có cờ toàn hệ thống mở một hợp đồng của CLB khác; lấy nhầm là khách
    chuyển tiền về CLB không bán.

    Trả undefined khi không tra được — chỗ gọi phải hiểu là đừng hiện mã QR.
    Đừng rơi về một tài khoản mặc định nào: rơi về CLB đầu danh sách là cách êm
    ái nhất để tiền chạy sai chỗ mà màn hình vẫn trông bình thường. */
export function taiKhoanNhanTienCua(
  locationId: string,
  locations: readonly Location[],
): TaiKhoanNhanTien | undefined {
  return locations.find((l) => l.id === locationId)?.taiKhoanNhanTien;
}
