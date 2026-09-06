import { useCallback, useState } from 'react';

/* Số trang đang xem, TỰ VỀ 1 khi phạm vi xem đổi.

   🐞 VÌ SAO CÓ TỆP NÀY — lỗi thật, dựng lại được trên app đang chạy. Đang ở
   TRANG 2 danh sách hội viên của CLB Quận 1 (28 người, 2 trang), đổi CLB trên
   thanh trên sang Quận 7 (1 người, 1 trang):

     · bảng trống trơn;
     · màn báo **"Không có hội viên khớp bộ lọc."** — sai, CLB đó CÓ hội viên và
       không bộ lọc nào loại ai cả;
     · thanh phân trang biến mất (chỉ một trang thì nó tự ẩn), nên **không còn
       đường nào quay lại trang 1** ngoài đổi bộ lọc hoặc tải lại trang.

   Người vận hành kết luận "Quận 7 không có hội viên nào". Bốn màn có phân trang
   đều dính: cả bốn đã nhớ `setPage(1)` khi đổi BỘ LỌC, nhưng CLB không đến từ bộ
   lọc — nó đến từ thanh trên (`useLocationScope`), nên không ai gọi reset.

   ⚠ CHỈNH STATE NGAY TRONG LÚC RENDER, không dùng `useEffect`. Đây đúng là ca
   React khuyến nghị cách này: state cần đặt lại khi một giá trị bên ngoài đổi.
   Đặt trong effect thì có một nhịp màn đã vẽ bằng số trang CŨ với dữ liệu MỚI —
   tức là vẫn nhìn thấy đúng cái bảng trống, chỉ ngắn hơn. Dự án cũng đã bỏ lối
   `setState` trong effect một lần rồi, ở `LocationProvider`. */

export interface TrangTheoPhamVi {
  trang: number;
  doiTrang: (trang: number) => void;
  /** Về trang đầu — gọi khi đổi bộ lọc hoặc chuỗi tìm kiếm. */
  veTrangDau: () => void;
}

/** `phamVi` là thứ mà đổi nó thì danh sách thành một danh sách khác — ở đây là
    CLB đang chọn. Đổi phạm vi ⇒ số trang về 1. */
export function useTrangTheoPhamVi(phamVi: string): TrangTheoPhamVi {
  const [trang, setTrang] = useState(1);
  const [phamViTruoc, setPhamViTruoc] = useState(phamVi);

  if (phamViTruoc !== phamVi) {
    setPhamViTruoc(phamVi);
    setTrang(1);
  }

  const veTrangDau = useCallback(() => setTrang(1), []);

  /* Trả thẳng `trang`, KHÔNG cần `phamViTruoc === phamVi ? trang : 1`.

     Gọi `setTrang` ngay trong lúc render làm React bỏ kết quả của lần vẽ này và
     vẽ lại LẬP TỨC với state mới, trước khi trình duyệt thấy bất cứ thứ gì — nên
     lần vẽ mang số trang cũ không bao giờ tới DOM. Đã kiểm chứng bằng cách phá
     code: thêm lớp ternary đó vào rồi bỏ ra, không test nào đổi màu. Giữ lại là
     giữ một lớp phòng thủ KHÔNG BAO GIỜ chạy tới, và không ai chứng minh được
     nó còn đúng. */
  return { trang, doiTrang: setTrang, veTrangDau };
}
