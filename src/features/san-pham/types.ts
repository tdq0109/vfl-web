import type { IsoDate, Vnd } from '@/lib/api/types';

/* Kiểu + KHOÁ i18n của nhãn nhóm Sản phẩm. Theo đúng khuôn nhóm Hội viên —
   xem `features/hoi-vien/types.ts`.

   ⚠ CÁC BẢNG DƯỚI ĐÂY CHỨA KHOÁ i18n, KHÔNG PHẢI CHỮ TIẾNG VIỆT. Đọc nhãn bằng
   `t(LOAI_SAN_PHAM_KHOA[l])`; khoá phải có thật trong từ
   điển.

   Ba khái niệm giá, đừng lẫn:
     giaNiemYet — giá treo bảng, mặc định khi bán
     giaSan     — giá THẤP NHẤT được phép bán; chỉ Giám đốc trở lên đặt được
     giá sau khuyến mãi — tính ra lúc bán, KHÔNG được xuống dưới giá sàn */

export type LoaiSanPham = 'goi-tap' | 'dich-vu' | 've-ngay' | 'phu-kien';

export const LOAI_SAN_PHAM_KHOA: Record<LoaiSanPham, string> = {
  'goi-tap': 'sanPham.loai.goi-tap',
  'dich-vu': 'sanPham.loai.dich-vu',
  've-ngay': 'sanPham.loai.ve-ngay',
  'phu-kien': 'sanPham.loai.phu-kien',
};

export const LOAI_SAN_PHAM_ORDER: LoaiSanPham[] = ['goi-tap', 'dich-vu', 've-ngay', 'phu-kien'];

export type SanPhamStatus = 'dang-ban' | 'ngung-ban';

/* ⚠ "Ngừng bán" ở đây là TRẠNG THÁI (pill trên bảng). Cái NÚT cùng chữ trên
   ngăn chi tiết là `sanPham.ngungBanNut` — một cái mô tả, một cái sai khiến,
   và bản tiếng Anh tách hẳn ra ("Discontinued" / "Stop selling"). Đừng gộp. */
export const SAN_PHAM_STATUS_KHOA: Record<SanPhamStatus, string> = {
  'dang-ban': 'sanPham.trangThai.dang-ban',
  'ngung-ban': 'sanPham.trangThai.ngung-ban',
};

export const SAN_PHAM_STATUS_ORDER: SanPhamStatus[] = ['dang-ban', 'ngung-ban'];

export interface SanPham {
  id: string;
  maSanPham: string;
  ten: string;
  loai: LoaiSanPham;
  moTa?: string;
  giaNiemYet: Vnd;
  giaSan: Vnd;
  /** Gói tập: thời hạn tính bằng ngày. */
  thoiHanNgay?: number;
  /** Gói tập / dịch vụ: số buổi. */
  soBuoi?: number;
  /** Bỏ trống = áp dụng mọi CLB. */
  locationId?: string;
  locationName?: string;
  trangThai: SanPhamStatus;
  ngayTao: IsoDate;
}

export interface SanPhamListParams {
  page: number;
  pageSize: number;
  search?: string;
  loai?: LoaiSanPham;
  trangThai?: SanPhamStatus;
  locationId?: string;
}

/** Form thêm / sửa. Giá sàn KHÔNG ở đây — có endpoint riêng vì cần quyền cao hơn. */
export interface SanPhamInput {
  ten: string;
  loai: LoaiSanPham;
  moTa?: string;
  giaNiemYet: Vnd;
  thoiHanNgay?: number;
  soBuoi?: number;
  locationId?: string;
}

/* ── Khuyến mãi ─────────────────────────────────────────────────────────── */

export type LoaiGiam = 'phan-tram' | 'so-tien';

export const LOAI_GIAM_KHOA: Record<LoaiGiam, string> = {
  'phan-tram': 'khuyenMai.loaiGiam.phan-tram',
  'so-tien': 'khuyenMai.loaiGiam.so-tien',
};

/* Thứ tự hiện trong ô chọn. Trước đây form lấy từ `Object.keys(LOAI_GIAM_LABEL)`
   — dựa vào thứ tự khoá của object là dựa vào thứ dễ đổi mà không ai để ý, đúng
   lỗi đã sửa ở `GIOI_TINH_ORDER` của nhóm Hội viên. */
export const LOAI_GIAM_ORDER: LoaiGiam[] = ['phan-tram', 'so-tien'];

export interface KhuyenMai {
  id: string;
  ma: string;
  ten: string;
  loaiGiam: LoaiGiam;
  /** Phần trăm (0–100) hoặc số tiền VND, tuỳ `loaiGiam`. */
  giaTri: number;
  tuNgay: IsoDate;
  denNgay: IsoDate;
  /** Rỗng / bỏ trống = áp dụng mọi sản phẩm. */
  sanPhamIds?: string[];
  kichHoat: boolean;
}

export interface KhuyenMaiInput {
  ma: string;
  ten: string;
  loaiGiam: LoaiGiam;
  giaTri: number;
  tuNgay: string;
  denNgay: string;
  sanPhamIds?: string[];
  kichHoat: boolean;
}

/** Trạng thái hiển thị của khuyến mãi — SUY RA từ ngày + cờ kích hoạt, không lưu. */
export type KhuyenMaiStatus = 'dang-chay' | 'sap-toi' | 'het-han' | 'tam-dung';

/* ⚠ "Tạm dừng" ở đây là TRẠNG THÁI. Nút cùng chữ trên bảng là
   `khuyenMai.tamDungNut` ("Pause" chứ không phải "Paused"). Đừng gộp. */
export const KHUYEN_MAI_STATUS_KHOA: Record<KhuyenMaiStatus, string> = {
  'dang-chay': 'khuyenMai.trangThai.dang-chay',
  'sap-toi': 'khuyenMai.trangThai.sap-toi',
  'het-han': 'khuyenMai.trangThai.het-han',
  'tam-dung': 'khuyenMai.trangThai.tam-dung',
};
