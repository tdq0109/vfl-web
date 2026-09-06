import { api } from '@/lib/api';
import type { DiemDoanhThu, HomNay, TomTatTongQuan, TongQuanParams, TopSanPham } from './types';

/* Nơi duy nhất biết đường dẫn endpoint của Dashboard.

   Không có endpoint so sánh hai kỳ: màn gọi tomTat hai lần, một cho kỳ đang xem
   và một cho kyTruoc(), rồi so ở frontend. Backend nhờ vậy chỉ phải biết một
   phép cộng theo khoảng ngày. */

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

  /** Doanh thu theo ngày. Backend có quyền trả thưa (bỏ ngày không phát
      sinh), dienDayChuoiNgay() lo phần điền 0. */
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
