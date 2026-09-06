import { useQuery } from '@tanstack/react-query';
import { keys } from '@/lib/query/keys';
import { banHangQuayApi } from '../api';
import type { BoLocGiamSat } from '../types';

/* Toàn bộ phần gọi API của màn Giám sát ca. Component chỉ nhận props và vẽ. */

/** Danh sách ca theo bộ lọc SERVER — ngày, CLB, thu ngân, trạng thái.

    ⚠ Hai tầng lọc, cố ý:
      · những gì backend lọc được thì để backend lọc (ngày / CLB / người / trạng
        thái) — không kéo cả tháng về máy rồi mới cắt;
      · riêng "chỉ ca cần chú ý" lọc Ở CLIENT, vì nó là kết luận của hàm thuần
        `chuYCuaCa()`, mà luật ấy thuộc về frontend. Backend không nên đoán lại
        và hai bên không được có hai định nghĩa khác nhau về "đáng ngờ". */
export function useDanhSachCa(boLoc: BoLocGiamSat, batDau = true) {
  /* `chiCanChuY` KHÔNG nằm trong khoá cache: nó không đổi dữ liệu tải về, chỉ
     đổi cách hiển thị. Đưa vào là mỗi lần tích/bỏ tích lại gọi mạng một lần. */
  const khoaLoc = {
    tuNgay: boLoc.tuNgay,
    denNgay: boLoc.denNgay,
    locationId: boLoc.locationId,
    thuNganId: boLoc.thuNganId,
    trangThai: boLoc.trangThai,
  };

  return useQuery({
    queryKey: keys.banHangQuay.danhSachCa(khoaLoc),
    queryFn: () => banHangQuayApi.danhSachCa(khoaLoc),
    enabled: batDau,
    /* Ca đang mở là trạng thái đang chạy — người giám sát mở màn ra là muốn
       thấy số của lúc này, không phải số của 5 phút trước. */
    staleTime: 15_000,
  });
}

/** Một ngày làm việc của quầy: mọi ca trong ngày + trạng thái chốt.

    Dùng cho màn CHỐT NGÀY của chính người trực quầy, nên khác `useDanhSachCa`:
    hàm kia cần cấp `leader`, hàm này thu ngân gọi được cho CLB của mình. */
export function useNgayLamViec(ngay: string, locationId: string | undefined) {
  return useQuery({
    queryKey: keys.banHangQuay.ngayLamViec(ngay, locationId ?? ''),
    queryFn: () => banHangQuayApi.ngayLamViec(ngay, locationId as string),
    enabled: Boolean(locationId),
    /* Ngày đang chạy thì số còn đổi — đừng để người ta xác nhận số cũ. */
    staleTime: 0,
  });
}
