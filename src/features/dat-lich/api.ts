import { api } from '@/lib/api';
import type {
  Buoi,
  BuoiInput,
  HuanLuyenVien,
  KhoangBuoi,
  LichTuanParams,
} from './types';

/* NƠI DUY NHẤT biết đường dẫn endpoint của nhóm Đặt lịch. */

const BASE = '/dat-lich';

export const datLichApi = {
  /** Lịch một tuần. `tuNgay` là thứ Hai. */
  lichTuan(params: LichTuanParams): Promise<Buoi[]> {
    return api.get<Buoi[]>(`${BASE}/tuan`, {
      query: {
        tuNgay: params.tuNgay,
        locationId: params.locationId,
        loai: params.loai,
        hlvId: params.hlvId,
      },
    });
  },

  /** Lịch của MỘT HLV trong tuần, MỌI CLB — để dò trùng lịch.

      ⚠ Cố ý không có tham số locationId: HLV không thể đứng lớp ở hai CLB cùng
      lúc, nên phải nhìn toàn hệ thống. Lọc theo CLB ở đây là tạo ra lỗ hổng. */
  lichHlv(hlvId: string, tuNgay: string): Promise<KhoangBuoi[]> {
    return api.get<KhoangBuoi[]>(`${BASE}/hlv/${hlvId}`, { query: { tuNgay } });
  },

  danhSachHlv(locationId?: string): Promise<HuanLuyenVien[]> {
    return api.get<HuanLuyenVien[]>(`${BASE}/huan-luyen-vien`, { query: { locationId } });
  },

  detail(id: string): Promise<Buoi> {
    return api.get<Buoi>(`${BASE}/buoi/${id}`);
  },

  create(input: BuoiInput): Promise<Buoi> {
    return api.post<Buoi>(`${BASE}/buoi`, input);
  },

  update(id: string, input: BuoiInput): Promise<Buoi> {
    return api.put<Buoi>(`${BASE}/buoi/${id}`, input);
  },

  huyBuoi(id: string): Promise<Buoi> {
    return api.patch<Buoi>(`${BASE}/buoi/${id}/huy`);
  },

  /* ── Chỗ ngồi ────────────────────────────────────────────────────────── */

  /** Giữ chỗ tạm (chưa chốt). Backend đặt hạn giữ. */
  giuCho(buoiId: string, hoiVienId: string): Promise<Buoi> {
    return api.post<Buoi>(`${BASE}/buoi/${buoiId}/giu-cho`, { hoiVienId });
  },

  /** Chốt một chỗ đang giữ. */
  chotCho(buoiId: string, choId: string): Promise<Buoi> {
    return api.post<Buoi>(`${BASE}/buoi/${buoiId}/cho/${choId}/chot`);
  },

  boCho(buoiId: string, choId: string): Promise<Buoi> {
    return api.delete<Buoi>(`${BASE}/buoi/${buoiId}/cho/${choId}`);
  },

  /* ── Hàng chờ ────────────────────────────────────────────────────────── */

  vaoHangCho(buoiId: string, hoiVienId: string): Promise<Buoi> {
    return api.post<Buoi>(`${BASE}/buoi/${buoiId}/hang-cho`, { hoiVienId });
  },

  roiHangCho(buoiId: string, choDoiId: string): Promise<Buoi> {
    return api.delete<Buoi>(`${BASE}/buoi/${buoiId}/hang-cho/${choDoiId}`);
  },
};
