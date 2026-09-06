import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { keys } from '@/lib/query/keys';
import { tongQuanApi } from '../api';
import { kyHopLe, kyTruoc } from '../tong-quan';
import type { Ky, TongQuanParams } from '../types';

/* Toàn bộ logic đọc của Dashboard.

   `keepPreviousData` ở khắp nơi: đổi kỳ mà bảng số nhấp nháy về "đang tải" thì
   người xem mất mạch so sánh. Số cũ mờ đi rồi thay bằng số mới dễ theo dõi hơn. */

function params(ky: Ky, locationId?: string): TongQuanParams {
  return { tuNgay: ky.tuNgay, denNgay: ky.denNgay, locationId };
}

export function useTomTat(ky: Ky, locationId: string | undefined, choPhep = true) {
  const p = params(ky, locationId);
  return useQuery({
    queryKey: keys.tongQuan.tomTat(p),
    queryFn: () => tongQuanApi.tomTat(p),
    enabled: choPhep && kyHopLe(ky),
    placeholderData: keepPreviousData,
  });
}

/** Kỳ liền trước, cùng số ngày, để tính % thay đổi. Dùng đúng endpoint của kỳ
    hiện tại nên khoá cache trùng nhau khi hai kỳ chồng lấp: đổi từ "7 ngày"
    sang "hôm nay" là lấy lại từ cache, không gọi thêm. */
export function useTomTatKyTruoc(ky: Ky, locationId: string | undefined, choPhep = true) {
  const truoc = kyTruoc(ky);
  const p = params(truoc, locationId);
  return useQuery({
    queryKey: keys.tongQuan.tomTat(p),
    queryFn: () => tongQuanApi.tomTat(p),
    enabled: choPhep && kyHopLe(ky),
    placeholderData: keepPreviousData,
  });
}

export function useDoanhThuTheoNgay(ky: Ky, locationId: string | undefined, choPhep = true) {
  const p = params(ky, locationId);
  return useQuery({
    queryKey: keys.tongQuan.doanhThu(p),
    queryFn: () => tongQuanApi.doanhThuTheoNgay(p),
    enabled: choPhep && kyHopLe(ky),
    placeholderData: keepPreviousData,
  });
}

export function useTopSanPham(ky: Ky, locationId: string | undefined, choPhep = true) {
  const p = params(ky, locationId);
  return useQuery({
    queryKey: keys.tongQuan.topSanPham(p),
    queryFn: () => tongQuanApi.topSanPham(p),
    enabled: choPhep && kyHopLe(ky),
    placeholderData: keepPreviousData,
  });
}

/** Việc trong ngày — không phụ thuộc kỳ đang chọn, và cần tươi: người vận hành
    nhìn khối này để biết còn hợp đồng nào đang treo. */
export function useHomNay(locationId?: string) {
  return useQuery({
    queryKey: keys.tongQuan.homNay(locationId),
    queryFn: () => tongQuanApi.homNay(locationId),
    staleTime: 0,
  });
}
