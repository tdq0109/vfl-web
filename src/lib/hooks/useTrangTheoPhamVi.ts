import { useCallback, useState } from 'react';

/* Số trang đang xem, tự về 1 khi phạm vi xem đổi.

   Đang ở trang 2 danh sách hội viên của một CLB rồi đổi CLB trên thanh trên
   sang nơi chỉ có 1 trang thì bảng trống trơn, màn báo "không có hội viên khớp
   bộ lọc", và thanh phân trang biến mất nên không còn đường quay lại trang 1.
   Bốn màn có phân trang đều dính: cả bốn đã nhớ setPage(1) khi đổi bộ lọc,
   nhưng CLB đến từ thanh trên (useLocationScope) chứ không từ bộ lọc.

   Chỉnh state ngay trong lúc render chứ không dùng useEffect — đây đúng là ca
   React khuyến nghị cách này, còn effect thì có một nhịp màn đã vẽ bằng số
   trang cũ với dữ liệu mới. */

export interface TrangTheoPhamVi {
  trang: number;
  doiTrang: (trang: number) => void;
  /** Về trang đầu — gọi khi đổi bộ lọc hoặc chuỗi tìm kiếm. */
  veTrangDau: () => void;
}

/** phamVi là thứ mà đổi nó thì danh sách thành một danh sách khác — ở đây là
    CLB đang chọn. Đổi phạm vi thì số trang về 1. */
export function useTrangTheoPhamVi(phamVi: string): TrangTheoPhamVi {
  const [trang, setTrang] = useState(1);
  const [phamViTruoc, setPhamViTruoc] = useState(phamVi);

  if (phamViTruoc !== phamVi) {
    setPhamViTruoc(phamVi);
    setTrang(1);
  }

  const veTrangDau = useCallback(() => setTrang(1), []);

  /* Trả thẳng trang, không cần phamViTruoc === phamVi ? trang : 1: gọi setTrang
     trong lúc render làm React bỏ kết quả lần vẽ này và vẽ lại ngay với state
     mới, nên lần vẽ mang số trang cũ không bao giờ tới DOM. */
  return { trang, doiTrang: setTrang, veTrangDau };
}
