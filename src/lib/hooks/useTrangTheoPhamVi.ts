import { useCallback, useState } from 'react';

/* Số trang đang xem, tự về 1 khi phạm vi xem đổi.

   Lỗi thật: đang ở trang 2 danh sách hội viên của CLB Quận 1 (28 người, 2
   trang), đổi CLB trên thanh trên sang Quận 7 (1 người, 1 trang) thì bảng trống
   trơn, màn báo "Không có hội viên khớp bộ lọc" — sai, CLB đó có hội viên — và
   thanh phân trang biến mất vì chỉ còn một trang, nên không còn đường nào quay
   lại trang 1 ngoài đổi bộ lọc hoặc tải lại trang.

   Bốn màn có phân trang đều dính. Cả bốn đã nhớ setPage(1) khi đổi bộ lọc,
   nhưng CLB không đến từ bộ lọc mà đến từ thanh trên (useLocationScope) nên
   không ai gọi reset.

   Chỉnh state ngay trong lúc render chứ không dùng useEffect. Đây đúng là ca
   React khuyến nghị cách này: state cần đặt lại khi một giá trị bên ngoài đổi.
   Đặt trong effect thì có một nhịp màn đã vẽ bằng số trang cũ với dữ liệu mới. */

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

  /* Trả thẳng trang, không cần phamViTruoc === phamVi ? trang : 1.

     Gọi setTrang ngay trong lúc render làm React bỏ kết quả của lần vẽ này và
     vẽ lại lập tức với state mới, trước khi trình duyệt thấy gì, nên lần vẽ
     mang số trang cũ không bao giờ tới DOM. Thêm lớp ternary đó chỉ là một lớp
     phòng thủ không bao giờ chạy tới. */
  return { trang, doiTrang: setTrang, veTrangDau };
}
