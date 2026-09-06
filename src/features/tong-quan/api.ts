import { api } from '@/lib/api';
import type { DiemDoanhThu, HomNay, TomTatTongQuan, TongQuanParams, TopSanPham } from './types';

/* NƠI DUY NHẤT biết đường dẫn endpoint của Dashboard.

   ⚠ Không có endpoint "so sánh hai kỳ". Màn gọi `tomTat` HAI LẦN — một cho kỳ
   đang xem, một cho `kyTruoc()` — rồi so ở frontend. Backend nhờ vậy chỉ phải
   biết một phép cộng theo khoảng ngày, và cách chọn kỳ so sánh nằm trong module
   hàm thuần đã có test. */

const BASE = '/tong-quan';

function query(params: TongQuanParams) {
  return {
    tuNgay: params.tuNgay,
    denNgay: params.denNgay,
    locationId: params.locationId,
  };
}

export const tongQuanApi = {
  tomTat(params: TongQuanParams): Promise<TomTatTongQuan> {
    return api.get<TomTatTongQuan>(`${BASE}/tom-tat`, { query: query(params) });
  },

  /** Doanh thu theo ngày. Backend có quyền trả THƯA (bỏ ngày không phát sinh) —
      `dienDayChuoiNgay()` lo phần điền 0. */
  doanhThuTheoNgay(params: TongQuanParams): Promise<DiemDoanhThu[]> {
    return api.get<DiemDoanhThu[]>(`${BASE}/doanh-thu`, { query: query(params) });
  },

  topSanPham(params: TongQuanParams, gioiHan = 5): Promise<TopSanPham[]> {
    return api.get<TopSanPham[]>(`${BASE}/top-san-pham`, {
      query: { ...query(params), gioiHan },
    });
  },

  /** Việc đang chờ trong ngày — không phụ thuộc kỳ đang chọn. */
  homNay(locationId?: string): Promise<HomNay> {
    return api.get<HomNay>(`${BASE}/hom-nay`, { query: { locationId } });
  },
};
