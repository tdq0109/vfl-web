import { api } from '@/lib/api';
import type { Paged } from '@/lib/api/types';
import type {
  DoiVaiTroInput,
  NhanVien,
  NhanVienInput,
  NhanVienListParams,
  NhanVienStatus,
} from './types';

/* Nơi duy nhất biết đường dẫn endpoint của nhóm Nhân viên. */

const BASE = '/nhan-vien';

export const nhanVienApi = {
  list(params: NhanVienListParams): Promise<Paged<NhanVien>> {
    return api.get<Paged<NhanVien>>(BASE, {
      query: {
        page: params.page,
        pageSize: params.pageSize,
        search: params.search,
        vaiTro: params.vaiTro,
        trangThai: params.trangThai,
        locationId: params.locationId,
      },
    });
  },

  detail(id: string): Promise<NhanVien> {
    return api.get<NhanVien>(`${BASE}/${id}`);
  },

  create(input: NhanVienInput): Promise<NhanVien> {
    return api.post<NhanVien>(BASE, input);
  },

  update(id: string, input: NhanVienInput): Promise<NhanVien> {
    return api.put<NhanVien>(`${BASE}/${id}`, input);
  },

  /** Endpoint riêng: backend kiểm tra cấp bậc người gán so với vai trò được gán. */
  doiVaiTro(id: string, input: DoiVaiTroInput): Promise<NhanVien> {
    return api.patch<NhanVien>(`${BASE}/${id}/vai-tro`, input);
  },

  doiTrangThai(id: string, trangThai: NhanVienStatus): Promise<NhanVien> {
    return api.patch<NhanVien>(`${BASE}/${id}/trang-thai`, { trangThai });
  },
};
