import { api } from '@/lib/api';
import type {
  BanHangInput,
  BoLocGiamSat,
  CaThuNgan,
  ChotNgay,
  ChotNgayInput,
  ChuyenCaInput,
  DongCaInput,
  GiaoDich,
  HangQuay,
  KetQuaChuyenCa,
  MoCaInput,
  NgayLamViecQuay,
} from './types';

/* Nơi duy nhất biết đường dẫn endpoint của nhóm Bán vé ngày tại quầy. */

const BASE = '/ban-hang-quay';

export const banHangQuayApi = {
  /** Ca đang mở của chính người đăng nhập tại CLB này. null nếu chưa mở ca. */
  caDangMo(locationId: string): Promise<CaThuNgan | null> {
    return api.get<CaThuNgan | null>(`${BASE}/ca-dang-mo`, { query: { locationId } });
  },

  moCa(input: MoCaInput): Promise<CaThuNgan> {
    return api.post<CaThuNgan>(`${BASE}/ca`, input);
  },

  dongCa(caId: string, input: DongCaInput): Promise<CaThuNgan> {
    return api.post<CaThuNgan>(`${BASE}/ca/${caId}/dong`, input);
  },

  /** Hàng bán được tại quầy — vé ngày và phụ kiện đang mở bán. */
  hangQuay(locationId: string): Promise<HangQuay[]> {
    return api.get<HangQuay[]>(`${BASE}/hang`, { query: { locationId } });
  },

  banHang(caId: string, input: BanHangInput): Promise<GiaoDich> {
    return api.post<GiaoDich>(`${BASE}/ca/${caId}/giao-dich`, input);
  },

  huyGiaoDich(caId: string, giaoDichId: string, lyDo: string): Promise<GiaoDich> {
    return api.patch<GiaoDich>(`${BASE}/ca/${caId}/giao-dich/${giaoDichId}/huy`, { lyDo });
  },

  /* Giám sát ca.

     Hai đường dẫn dưới đây là giả định, chưa chốt với đội .NET (mục 5 tài liệu
     bàn giao). Backend phải tự chặn theo quyền: ai không đủ cấp thì 404/403,
     đừng trả danh sách rỗng. Lớp ẩn nút ở frontend không phải hàng rào. */

  /** Mọi ca trong khoảng lọc, của mọi thu ngân, kể cả ca đã đóng.

      Khác caDangMo(): hàm kia trả ca của chính mình để đứng bán, hàm này trả ca
      của người khác để giám sát. Trả kèm giaoDich của từng ca vì đối soát phải
      tính từ giao dịch chứ không tin số tổng backend gửi kèm. */
  danhSachCa(boLoc: BoLocGiamSat): Promise<CaThuNgan[]> {
    return api.get<CaThuNgan[]>(`${BASE}/ca`, {
      query: {
        tuNgay: boLoc.tuNgay ?? null,
        denNgay: boLoc.denNgay ?? null,
        locationId: boLoc.locationId ?? null,
        thuNganId: boLoc.thuNganId ?? null,
        trangThai: boLoc.trangThai ?? null,
      },
    });
  },

  /** Một ca kèm toàn bộ giao dịch — để mở ra soi từng phiếu. */
  chiTietCa(caId: string): Promise<CaThuNgan> {
    return api.get<CaThuNgan>(`${BASE}/ca/${caId}`);
  },

  /* Chuyển ca và chốt ngày — vẫn là giả định, chưa chốt với đội .NET. */

  /** Chuyển ca: chốt ca đang chạy rồi mở ngay ca kế tiếp, trong một giao dịch.

      Không có tham số tienDauCa, và đó là điểm quan trọng nhất của endpoint
      này: tiền đầu ca sau là tiền đếm của ca trước, do backend gán. Cho gõ tay
      là dựng lại đúng lỗ hổng mà cơ chế này sinh ra để bịt.

      Phải nguyên tử ở backend: đóng được mà mở hỏng là quầy đứng hình giữa ca. */
  chuyenCa(caId: string, input: ChuyenCaInput): Promise<KetQuaChuyenCa> {
    return api.post<KetQuaChuyenCa>(`${BASE}/ca/${caId}/chuyen-ca`, input);
  },

  /** Một ngày làm việc của một CLB: mọi ca trong ngày + trạng thái chốt.

      Khác danhSachCa(): hàm kia dành cho người giám sát (cần cấp leader), hàm
      này dành cho chính người đang trực quầy để xác nhận ngày của mình, nên thu
      ngân gọi được nhưng chỉ CLB của họ. */
  ngayLamViec(ngay: string, locationId: string): Promise<NgayLamViecQuay> {
    return api.get<NgayLamViecQuay>(`${BASE}/ngay`, { query: { ngay, locationId } });
  },

  /** Chốt ngày — khoá ngày lại sau khi nhân viên xác nhận bản tổng kết. */
  chotNgay(input: ChotNgayInput): Promise<ChotNgay> {
    return api.post<ChotNgay>(`${BASE}/chot-ngay`, input);
  },
};
