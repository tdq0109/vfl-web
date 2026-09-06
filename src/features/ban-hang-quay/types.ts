import type { IsoDateTime } from '@/features/dat-lich/types';
import type { Vnd } from '@/lib/api/types';

/* Kiểu + KHOÁ i18n của nhãn nhóm Bán vé ngày tại quầy. Theo đúng khuôn nhóm
   Hội viên — xem `features/hoi-vien/types.ts`.

   ⚠ HAI BẢNG NHÃN DƯỚI ĐÂY CHỨA KHOÁ i18n, KHÔNG PHẢI CHỮ TIẾNG VIỆT. Riêng
   `VAO_KET` thì KHÔNG — nó là quy tắc nghiệp vụ (tiền nào vào két), không phải
   nhãn, nên đừng đụng vào.

   ⚠ GIẢ ĐỊNH THIẾT KẾ — cần thu ngân thật xác nhận trước khi chốt:
     · một thu ngân mở TỐI ĐA MỘT ca đang mở tại một CLB;
     · huỷ giao dịch chỉ trong ca đang mở, không sửa được ca đã đóng;
     · đóng ca cần đếm tiền mặt thực tế, lệch bao nhiêu cũng cho đóng nhưng phải
       ghi lý do khi lệch;
     · khách vãng lai không bắt buộc để lại thông tin. */

export type PhuongThuc = 'tien-mat' | 'chuyen-khoan' | 'the';

export const PHUONG_THUC_KHOA: Record<PhuongThuc, string> = {
  'tien-mat': 'quay.phuongThuc.tien-mat',
  'chuyen-khoan': 'quay.phuongThuc.chuyen-khoan',
  the: 'quay.phuongThuc.the',
};

export const PHUONG_THUC_ORDER: PhuongThuc[] = ['tien-mat', 'chuyen-khoan', 'the'];

/** Chỉ TIỀN MẶT mới đi vào két. Chuyển khoản và thẻ vào tài khoản ngân hàng,
    không được tính vào tiền mặt kỳ vọng cuối ca. */
export const VAO_KET: Record<PhuongThuc, boolean> = {
  'tien-mat': true,
  'chuyen-khoan': false,
  the: false,
};

export type TrangThaiCa = 'dang-mo' | 'da-dong';

export const TRANG_THAI_CA_KHOA: Record<TrangThaiCa, string> = {
  'dang-mo': 'quay.trangThaiCa.dang-mo',
  'da-dong': 'quay.trangThaiCa.da-dong',
};

/** Một dòng trong giỏ hàng. */
export interface DongHang {
  sanPhamId: string;
  ten: string;
  donGia: Vnd;
  soLuong: number;
}

export interface GiaoDich {
  id: string;
  maGiaoDich: string;
  dong: DongHang[];
  tongTien: Vnd;
  phuongThuc: PhuongThuc;
  /** Khách vãng lai: để trống nếu khách không cho thông tin. */
  khachTen?: string;
  khachSdt?: string;
  luc: IsoDateTime;
  daHuy: boolean;
  lyDoHuy?: string;
}

export interface CaThuNgan {
  id: string;
  maCa: string;
  thuNganId: string;
  thuNganTen: string;
  locationId: string;
  locationName?: string;
  moLuc: IsoDateTime;
  dongLuc?: IsoDateTime;
  /** Tiền mặt có sẵn trong két lúc mở ca. */
  tienDauCa: Vnd;
  /** Tiền mặt đếm được lúc đóng ca. Chỉ có khi đã đóng. */
  tienDemCuoiCa?: Vnd;
  ghiChuDongCa?: string;
  trangThai: TrangThaiCa;
  giaoDich: GiaoDich[];
}

/** Sản phẩm bán được tại quầy (vé ngày, phụ kiện…). */
export interface HangQuay {
  id: string;
  maSanPham: string;
  ten: string;
  gia: Vnd;
}

export interface MoCaInput {
  locationId: string;
  tienDauCa: Vnd;
}

export interface DongCaInput {
  tienDemCuoiCa: Vnd;
  ghiChu?: string;
}

export interface BanHangInput {
  dong: DongHang[];
  phuongThuc: PhuongThuc;
  khachTen?: string;
  khachSdt?: string;
}

/* ── GIÁM SÁT CA & SỔ GIAO DỊCH ────────────────────────────────────────────

   Thêm cho nhu cầu ĐỐI CHIẾU: quản lý phải xem được ca của NGƯỜI KHÁC, cả ca đã
   đóng, và lần được từng giao dịch trong đó. Ba kiểu dưới đây chỉ mô tả dữ liệu
   — luật đọc nó nằm ở `giamSat.ts`.

   ⚠ GIẢ ĐỊNH THIẾT KẾ, cần đội .NET chốt (xem mục 5 tài liệu bàn giao):
     · danh sách ca trả kèm `giaoDich` của từng ca — đối soát tính TỪ giao dịch,
       không tin số tổng do backend gửi kèm;
     · lọc theo khoảng ngày dựa trên `moLuc` (giờ MỞ ca), không phải giờ đóng:
       ca đêm mở 22h hôm trước thuộc về ngày mở, đúng như cách thu ngân giao ca. */

/** Bộ lọc của màn Giám sát ca. Mọi trường đều tuỳ chọn. */
export interface BoLocGiamSat {
  /** 'YYYY-MM-DD' — theo giờ MỞ ca. */
  tuNgay?: string;
  denNgay?: string;
  locationId?: string;
  thuNganId?: string;
  trangThai?: TrangThaiCa;
  /** Chỉ hiện ca có dấu hiệu cần chú ý — xem `chuYCuaCa()`. */
  chiCanChuY?: boolean;
}

/** Một dòng trong SỔ GIAO DỊCH: giao dịch kèm ca đã sinh ra nó.

    Giao dịch nằm lồng trong ca nên tự nó không biết ai bán, ở đâu. Đối chiếu thì
    luôn cần ba thông tin ấy đi cùng nhau. */
export interface DongSoGiaoDich extends GiaoDich {
  caId: string;
  maCa: string;
  thuNganId: string;
  thuNganTen: string;
  locationId: string;
  locationName?: string;
}

/* ── CHUYỂN CA & CHỐT NGÀY ─────────────────────────────────────────────────

   Ba cơ chế vận hành do người dùng đặt ra, xem `chuyenCa.ts`:

     · MỞ CA lấy giờ THẬT lúc bấm nút. Bấm muộn hơn giờ khung thì vẫn cho mở,
       nhưng ghi lại độ muộn và cảnh báo — không im lặng làm tròn cho đẹp.
     · CHUYỂN CA là MỘT thao tác: chốt ca đang chạy rồi mở ngay ca kế tiếp, tiền
       đầu ca sau LẤY THẲNG từ tiền đếm của ca trước.
     · CHỐT NGÀY tổng kết cả ngày cho nhân viên xác nhận rồi khoá ngày lại. */

export interface ChuyenCaInput {
  /** Tiền mặt đếm được cuối ca đang chạy. Cũng chính là tiền đầu ca kế tiếp. */
  tienDemCuoiCa: Vnd;
  ghiChu?: string;
}

export interface KetQuaChuyenCa {
  caDaDong: CaThuNgan;
  caMoi: CaThuNgan;
}

/** Bản ghi "ngày này đã chốt". Có bản ghi = ngày đã khoá. */
export interface ChotNgay {
  id: string;
  /** Ngày LÀM VIỆC 'YYYY-MM-DD' — ca đêm thuộc về ngày mở, xem `khungCa.ts`. */
  ngay: string;
  locationId: string;
  locationName?: string;
  chotLuc: IsoDateTime;
  nguoiChotId: string;
  nguoiChotTen: string;
  ghiChu?: string;
}

export interface ChotNgayInput {
  ngay: string;
  locationId: string;
  ghiChu?: string;
}

/** Một ngày làm việc của một CLB, kèm trạng thái chốt. */
export interface NgayLamViecQuay {
  ngay: string;
  locationId: string;
  ca: CaThuNgan[];
  /** `null` = chưa chốt. */
  chotNgay: ChotNgay | null;
}
