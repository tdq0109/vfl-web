import type { IsoDateTime } from '@/features/dat-lich/types';
import type { PhuongThuc } from '@/features/ban-hang-quay/types';
import type { IsoDate, Vnd } from '@/lib/api/types';

/* Kiểu + KHOÁ i18n của nhãn nhóm Hợp đồng. Theo đúng khuôn nhóm Hội viên —
   xem `features/hoi-vien/types.ts`.

   ⚠ BA BẢNG NHÃN DƯỚI ĐÂY CHỨA KHOÁ i18n, KHÔNG PHẢI CHỮ TIẾNG VIỆT.

   ⚠ ĐÂY LÀ CHỖ TIỀN CHẠY QUA. Ba nguyên tắc đã chốt, đừng phá:

   1. TỔNG TIỀN KHÔNG LƯU TRONG KIỂU NÀY. Tính từ `dong` + `khuyenMai` bằng
      `tinhTongHopDong()`. Lưu tổng song song với dòng hàng là mời gọi hai con số
      lệch nhau — hệ cũ đã dính đúng lỗi đó.
   2. GIÁ NIÊM YẾT VÀ GIÁ SÀN ĐƯỢC CHỤP LẠI VÀO TỪNG DÒNG lúc lập hợp đồng.
      Bảng giá đổi sau đó không được làm hợp đồng cũ đọc ra con số khác.
   3. THANH TOÁN ĐÃ HUỶ VẪN NẰM TRONG DANH SÁCH, gắn cờ `daHuy` — bút toán đảo,
      không sửa đè, giống cách huỷ giao dịch ở Bước 11. */

/** Máy trạng thái hợp đồng. Bảng chuyển tiếp hợp lệ nằm ở `hop-dong.ts`, KHÔNG
    rải `if` trong component. */
export type TrangThaiHopDong =
  | 'bao-gia'
  | 'cho-thu-tien'
  | 'cho-xac-minh'
  | 'da-phat-hanh'
  | 'da-ky'
  | 'dang-hieu-luc'
  | 'da-huy'
  | 'tam-dung';

export const TRANG_THAI_HOP_DONG_KHOA: Record<TrangThaiHopDong, string> = {
  'bao-gia': 'hopDong.trangThai.bao-gia',
  'cho-thu-tien': 'hopDong.trangThai.cho-thu-tien',
  'cho-xac-minh': 'hopDong.trangThai.cho-xac-minh',
  'da-phat-hanh': 'hopDong.trangThai.da-phat-hanh',
  'da-ky': 'hopDong.trangThai.da-ky',
  'dang-hieu-luc': 'hopDong.trangThai.dang-hieu-luc',
  'da-huy': 'hopDong.trangThai.da-huy',
  'tam-dung': 'hopDong.trangThai.tam-dung',
};

export const TRANG_THAI_HOP_DONG_ORDER: TrangThaiHopDong[] = [
  'bao-gia',
  'cho-thu-tien',
  'cho-xac-minh',
  'da-phat-hanh',
  'da-ky',
  'dang-hieu-luc',
  'tam-dung',
  'da-huy',
];

/** Trạng thái để HIỂN THỊ — thêm `het-han` suy ra từ ngày kết thúc, không lưu.
    Cùng nguyên lý với `trangThaiKhuyenMai()` (Bước 9) và `trangThaiBuoi()`
    (Bước 10): hợp đồng hết hạn ba tháng mà bản ghi vẫn ghi "đang hiệu lực" là
    lỗi kinh điển của hệ cũ. */
export type TrangThaiHienThi = TrangThaiHopDong | 'het-han';

export const TRANG_THAI_HIEN_THI_KHOA: Record<TrangThaiHienThi, string> = {
  ...TRANG_THAI_HOP_DONG_KHOA,
  'het-han': 'hopDong.trangThai.het-han',
};

/** KHOÁ nhãn NÚT cho từng bước chuyển — đọc theo góc nhìn người bấm.

    ⚠ Hai bảng khác nhau cho cùng một tập trạng thái, và đó là cố ý: bảng trên
    MÔ TẢ hợp đồng đang ở đâu ("Đã huỷ"), bảng này SAI KHIẾN ("Huỷ hợp đồng").
    Cùng họ với "Ngừng bán" pill / "Ngừng bán" nút ở nhóm Sản phẩm. Riêng
    `tam-dung` thì hai bảng trùng chữ ("Tạm dừng") và vẫn phải là hai khoá. */
export const HANH_DONG_KHOA: Record<TrangThaiHopDong, string> = {
  'bao-gia': 'hopDong.hanhDong.bao-gia',
  'cho-thu-tien': 'hopDong.hanhDong.cho-thu-tien',
  'cho-xac-minh': 'hopDong.hanhDong.cho-xac-minh',
  'da-phat-hanh': 'hopDong.hanhDong.da-phat-hanh',
  'da-ky': 'hopDong.hanhDong.da-ky',
  'dang-hieu-luc': 'hopDong.hanhDong.dang-hieu-luc',
  'da-huy': 'hopDong.hanhDong.da-huy',
  'tam-dung': 'hopDong.hanhDong.tam-dung',
};

/** Một dòng sản phẩm trong hợp đồng. `giaNiemYet` và `giaSan` là ảnh chụp tại
    thời điểm lập — xem nguyên tắc 2 ở đầu tệp. */
export interface DongHopDong {
  sanPhamId: string;
  ten: string;
  giaNiemYet: Vnd;
  giaSan: Vnd;
  /** Giá bán thực tế do sales nhập. Không được dưới `giaSan`. */
  donGia: Vnd;
  soLuong: number;
}

/** Khuyến mãi áp cho cả hợp đồng — chụp lại để về sau sửa khuyến mãi gốc không
    làm đổi hợp đồng đã lập. */
export interface KhuyenMaiApDung {
  id?: string;
  ma: string;
  ten: string;
  loaiGiam: 'phan-tram' | 'so-tien';
  giaTri: number;
}

export interface ThanhToanHopDong {
  id: string;
  soTien: Vnd;
  phuongThuc: PhuongThuc;
  luc: IsoDateTime;
  nguoiThuId: string;
  nguoiThuTen: string;
  ghiChu?: string;
  /** Huỷ phiếu thu = ghi cờ, KHÔNG xoá dòng. */
  daHuy: boolean;
  lyDoHuy?: string;
}

/** Chữ ký tay của hội viên, chụp ở bước "ký".

    `anh` là ảnh PNG dạng data URL, nền đã đục trong nên đè thẳng lên bản hợp
    đồng khi in. CỐ Ý nhúng ảnh chứ không lưu đường dẫn: hợp đồng là chứng từ,
    một đường dẫn có thể chết hoặc bị thay tệp mà không ai biết. Điều kiện hợp
    lệ nằm ở `viSaoKhongLuuDuocChuKy()` trong `@/packages/signature-pad/chu-ky`,
    có test riêng.

    ⚠ Bước 12a chỉ giữ chữ ký của BÊN B (hội viên). Chữ ký đại diện CLB bên A ở
    hệ cũ lấy sẵn từ cấu hình thương hiệu của CLB — phần đó chưa port. */
export interface ChuKyHopDong {
  anh: string;
  luc: IsoDateTime;
  nguoiKyTen?: string;
}

/** Một mốc trong nhật ký chuyển trạng thái. Hợp đồng là chứng từ — phải truy
    được ai chuyển, lúc nào, vì sao. */
export interface MocHopDong {
  trangThai: TrangThaiHopDong;
  luc: IsoDateTime;
  nguoiId: string;
  nguoiTen: string;
  ghiChu?: string;
}

export interface HopDong {
  id: string;
  maHopDong: string;
  hoiVienId: string;
  hoiVienTen: string;
  hoiVienSdt?: string;
  locationId: string;
  locationName?: string;
  /** Người lập — KHÔNG được tự xác minh hợp đồng của chính mình. */
  nguoiLapId: string;
  nguoiLapTen: string;
  dong: DongHopDong[];
  khuyenMai?: KhuyenMaiApDung;
  thanhToan: ThanhToanHopDong[];
  trangThai: TrangThaiHopDong;
  ngayLap: IsoDate;
  /** Hiệu lực — bắt buộc trước khi kích hoạt. */
  ngayBatDau?: IsoDate;
  ngayKetThuc?: IsoDate;
  ngayPhatHanh?: IsoDate;
  ngayKy?: IsoDate;
  /** Có khi hội viên ký trên màn. Ký giấy thì trống — hệ vẫn ghi nhận `ngayKy`. */
  chuKy?: ChuKyHopDong;
  nguoiXacMinhId?: string;
  nguoiXacMinhTen?: string;
  ghiChu?: string;
  lichSu: MocHopDong[];
}

export interface HopDongListParams {
  page: number;
  pageSize: number;
  search?: string;
  trangThai?: TrangThaiHopDong;
  locationId?: string;
}

/** Dữ liệu lập / sửa hợp đồng. Chỉ sửa được khi còn ở `bao-gia`. */
export interface HopDongInput {
  hoiVienId: string;
  locationId: string;
  dong: DongHopDong[];
  khuyenMai?: KhuyenMaiApDung;
  ngayBatDau?: string;
  ngayKetThuc?: string;
  ghiChu?: string;
}

export interface ChuyenTrangThaiInput {
  den: TrangThaiHopDong;
  ghiChu?: string;
  /** Chỉ có nghĩa khi `den === 'da-ky'`: ảnh PNG data URL của chữ ký hội viên.
      Bỏ trống = ký giấy, hệ chỉ ghi nhận trạng thái + ngày như trước Bước 12a. */
  chuKy?: string;
}

export interface ThanhToanInput {
  soTien: Vnd;
  phuongThuc: PhuongThuc;
  ghiChu?: string;
}

/** Lý do chặn một thao tác: KHOÁ i18n + tham số, để MÀN dịch ra chữ.

    Vì sao không trả thẳng câu tiếng Việt như trước: hàm thuần không biết ngôn
    ngữ hiện hành, gọi `t()` ở tầng đó là đóng băng chuỗi theo ngôn ngữ lúc nạp
    tệp. Vì sao không trả mỗi khoá: phần lớn lý do có SỐ hoặc TÊN kèm theo, mà
    chỉ hàm thuần mới biết chúng — bắt màn tự tính lại là chép logic phân nhánh
    ra hai chỗ.

    `dongViPham` chỉ có ở lý do "dưới giá sàn": danh sách dòng để màn liệt kê
    chi tiết. Ghép câu bằng `lyDoThanhChu()` trong `lyDo.ts`. */
export interface LyDoChan {
  khoa: string;
  thamSo?: Record<string, string | number>;
  dongViPham?: readonly DongHopDong[];
}
