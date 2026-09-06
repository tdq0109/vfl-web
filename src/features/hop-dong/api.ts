import { api } from '@/lib/api';
import type { Paged } from '@/lib/api/types';
import type {
  ChuyenTrangThaiInput,
  HopDong,
  HopDongInput,
  HopDongListParams,
  ThanhToanInput,
} from './types';

/* NƠI DUY NHẤT biết đường dẫn endpoint của nhóm Hợp đồng. Backend .NET chốt hợp
   đồng API thì sửa ở đây, không nơi nào khác.

   ⚠ Bước 12a cố ý KHÔNG có endpoint sửa / huỷ phiếu thu đã ghi, huỷ hoá đơn đã
   phát hành hay trả góp. Đó là Bước 12b và phải làm bằng bút toán đảo. */

const BASE = '/hop-dong';

export const hopDongApi = {
  list(params: HopDongListParams): Promise<Paged<HopDong>> {
    return api.get<Paged<HopDong>>(BASE, {
      query: {
        page: params.page,
        pageSize: params.pageSize,
        search: params.search,
        trangThai: params.trangThai,
        locationId: params.locationId,
      },
    });
  },

  detail(id: string): Promise<HopDong> {
    return api.get<HopDong>(`${BASE}/${id}`);
  },

  create(input: HopDongInput): Promise<HopDong> {
    return api.post<HopDong>(BASE, input);
  },

  /** Chỉ sửa được khi hợp đồng còn ở `bao-gia` — backend PHẢI kiểm lại. */
  update(id: string, input: HopDongInput): Promise<HopDong> {
    return api.put<HopDong>(`${BASE}/${id}`, input);
  },

  /** Một cửa duy nhất cho MỌI bước của máy trạng thái. Backend kiểm lại bảng
      chuyển tiếp, cấp bậc, tách nhiệm và điều kiện thu đủ — frontend chỉ chặn
      sớm. Trùng trạng thái / sai điều kiện: trả 409 kèm ProblemDetails. */
  chuyenTrangThai(id: string, input: ChuyenTrangThaiInput): Promise<HopDong> {
    return api.post<HopDong>(`${BASE}/${id}/chuyen-trang-thai`, input);
  },

  /** Ghi một phiếu thu. Trả về hợp đồng đã cập nhật để màn tính lại còn phải thu. */
  thanhToan(id: string, input: ThanhToanInput): Promise<HopDong> {
    return api.post<HopDong>(`${BASE}/${id}/thanh-toan`, input);
  },
};
