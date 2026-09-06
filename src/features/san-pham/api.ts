import { api } from '@/lib/api';
import type { Paged, Vnd } from '@/lib/api/types';
import type {
  KhuyenMai,
  KhuyenMaiInput,
  SanPham,
  SanPhamInput,
  SanPhamListParams,
  SanPhamStatus,
} from './types';

/* NƠI DUY NHẤT biết đường dẫn endpoint của nhóm Sản phẩm. */

const BASE = '/san-pham';
const KM = '/khuyen-mai';

export const sanPhamApi = {
  list(params: SanPhamListParams): Promise<Paged<SanPham>> {
    return api.get<Paged<SanPham>>(BASE, {
      query: {
        page: params.page,
        pageSize: params.pageSize,
        search: params.search,
        loai: params.loai,
        trangThai: params.trangThai,
        locationId: params.locationId,
      },
    });
  },

  detail(id: string): Promise<SanPham> {
    return api.get<SanPham>(`${BASE}/${id}`);
  },

  create(input: SanPhamInput): Promise<SanPham> {
    return api.post<SanPham>(BASE, input);
  },

  update(id: string, input: SanPhamInput): Promise<SanPham> {
    return api.put<SanPham>(`${BASE}/${id}`, input);
  },

  /** Endpoint riêng: chỉ Giám đốc trở lên, backend kiểm tra lại. */
  datGiaSan(id: string, giaSan: Vnd): Promise<SanPham> {
    return api.patch<SanPham>(`${BASE}/${id}/gia-san`, { giaSan });
  },

  doiTrangThai(id: string, trangThai: SanPhamStatus): Promise<SanPham> {
    return api.patch<SanPham>(`${BASE}/${id}/trang-thai`, { trangThai });
  },

  /* ── Khuyến mãi ─────────────────────────────────────────────────────── */

  listKhuyenMai(): Promise<KhuyenMai[]> {
    return api.get<KhuyenMai[]>(KM);
  },

  createKhuyenMai(input: KhuyenMaiInput): Promise<KhuyenMai> {
    return api.post<KhuyenMai>(KM, input);
  },

  updateKhuyenMai(id: string, input: KhuyenMaiInput): Promise<KhuyenMai> {
    return api.put<KhuyenMai>(`${KM}/${id}`, input);
  },

  doiKichHoatKhuyenMai(id: string, kichHoat: boolean): Promise<KhuyenMai> {
    return api.patch<KhuyenMai>(`${KM}/${id}/kich-hoat`, { kichHoat });
  },
};
