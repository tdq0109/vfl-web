import type { IsoDateTime } from '@/features/dat-lich/types';
import type { Vnd } from '@/lib/api/types';

/* Kiểu + khoá i18n của nhãn nhóm Bán vé ngày tại quầy, theo khuôn nhóm Hội
   viên (features/hoi-vien/types.ts).

   Hai bảng nhãn dưới đây chứa khoá i18n chứ không phải chữ tiếng Việt. Riêng
   VAO_KET thì không: nó là quy tắc nghiệp vụ (tiền nào vào két), không phải
   nhãn.

   Mấy giả định còn chờ thu ngân thật xác nhận:
   - một thu ngân mở tối đa một ca đang mở tại một CLB;
   - huỷ giao dịch chỉ trong ca đang mở, không sửa được ca đã đóng;
   - đóng ca cần đếm tiền mặt thực tế; lệch bao nhiêu cũng cho đóng nhưng phải
     ghi lý do;
   - khách vãng lai không bắt buộc để lại thông tin. */

export type PhuongThuc = 'tien-mat' | 'chuyen-khoan' | 'the';

export const PHUONG_THUC_KHOA: Record<PhuongThuc, string> = {
  'tien-mat': 'quay.phuongThuc.tien-mat',
  'chuyen-khoan': 'quay.phuongThuc.chuyen-khoan',
  the: 'quay.phuongThuc.the',
};

export const PHUONG_THUC_ORDER: PhuongThuc[] = ['tien-mat', 'chuyen-khoan', 'the'];

/** Chỉ tiền mặt mới đi vào két. Chuyển khoản và thẻ vào tài khoản ngân hàng,
    không tính vào tiền mặt kỳ vọng cuối ca. */
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

/* Giám sát ca và sổ giao dịch.

   Thêm cho nhu cầu đối chiếu: quản lý phải xem được ca của người khác, cả ca đã
   đóng, và lần được từng giao dịch trong đó. Ba kiểu dưới đây chỉ mô tả dữ
   liệu, luật đọc nó nằm ở giamSat.ts.

   Còn chờ đội .NET chốt (mục 5 tài liệu bàn giao):
   - danh sách ca trả kèm giaoDich của từng ca; đối soát tính từ giao dịch chứ
     không tin số tổng backend gửi kèm;
   - lọc theo khoảng ngày dựa trên moLuc (giờ mở ca) chứ không phải giờ đóng. */

/** Bộ lọc của màn Giám sát ca. Mọi trường đều tuỳ chọn. */
export interface BoLocGiamSat {
  /** 'YYYY-MM-DD' — theo giờ mở ca. */
  tuNgay?: string;
  denNgay?: string;
  locationId?: string;
  thuNganId?: string;
  trangThai?: TrangThaiCa;
  /** Chỉ hiện ca có dấu hiệu cần chú ý — xem `chuYCuaCa()`. */
  chiCanChuY?: boolean;
}

/** Một dòng trong sổ giao dịch: giao dịch kèm ca đã sinh ra nó.

    Giao dịch nằm lồng trong ca nên tự nó không biết ai bán, ở đâu; đối chiếu
    thì luôn cần ba thông tin ấy đi cùng nhau. */
export interface DongSoGiaoDich extends GiaoDich {
  caId: string;
  maCa: string;
  thuNganId: string;
  thuNganTen: string;
  locationId: string;
  locationName?: string;
}

/* Chuyển ca và chốt ngày — ba cơ chế vận hành do người dùng đặt ra, xem
   chuyenCa.ts:

   - mở ca lấy giờ thật lúc bấm nút; bấm muộn hơn giờ khung thì vẫn cho mở nhưng
     ghi lại độ muộn;
   - chuyển ca là một thao tác: chốt ca đang chạy rồi mở ngay ca kế tiếp, tiền
     đầu ca sau lấy thẳng từ tiền đếm của ca trước;
   - chốt ngày tổng kết cả ngày cho nhân viên xác nhận rồi khoá ngày lại. */

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
  /** Ngày làm việc 'YYYY-MM-DD' — ca đêm thuộc về ngày mở, xem khungCa.ts. */
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
