import { api } from '@/lib/api';
import type { Paged } from '@/lib/api/types';
import type { HoiVien, HoiVienInput, HoiVienListParams, HoiVienStatus } from './types';

/* NƠI DUY NHẤT biết đường dẫn endpoint của nhóm Hội viên. Đổi API → sửa ở đây,
   không nơi nào khác. */

const BASE = '/hoi-vien';

export const hoiVienApi = {
  list(params: HoiVienListParams): Promise<Paged<HoiVien>> {
    return api.get<Paged<HoiVien>>(BASE, {
      query: {
        page: params.page,
        pageSize: params.pageSize,
        search: params.search,
        trangThai: params.trangThai,
        locationId: params.locationId,
      },
    });
  },

  detail(id: string): Promise<HoiVien> {
    return api.get<HoiVien>(`${BASE}/${id}`);
  },

  create(input: HoiVienInput): Promise<HoiVien> {
    return api.post<HoiVien>(BASE, input);
  },

  update(id: string, input: HoiVienInput): Promise<HoiVien> {
    return api.put<HoiVien>(`${BASE}/${id}`, input);
  },

  doiTrangThai(id: string, trangThai: HoiVienStatus): Promise<HoiVien> {
    return api.patch<HoiVien>(`${BASE}/${id}/trang-thai`, { trangThai });
  },
};
