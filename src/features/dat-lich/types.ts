import type { IsoDate } from '@/lib/api/types';

/* Kiểu + khoá i18n của nhãn nhóm Đặt lịch, theo khuôn nhóm Hội viên
   (features/hoi-vien/types.ts). Các bảng dưới đây chứa khoá i18n chứ không phải
   chữ tiếng Việt; đọc nhãn bằng t(LOAI_BUOI_KHOA[l]).

   Thời gian dùng chuỗi 'YYYY-MM-DDTHH:mm' theo giờ địa phương, không kèm múi
   giờ, không dùng Date để lưu: cả hệ chạy một múi giờ, và so sánh chuỗi cùng
   định dạng cho đúng thứ tự thời gian mà không lệch ngày như toISOString(). */

export type IsoDateTime = string;

export type LoaiBuoi = 'pt' | 'lop' | 'sgt';

/** Bản đầy đủ — ô chọn và ngăn chi tiết, chỗ có sẵn bề ngang để giải thích. */
export const LOAI_BUOI_KHOA: Record<LoaiBuoi, string> = {
  pt: 'datLich.loai.pt',
  lop: 'datLich.loai.lop',
  sgt: 'datLich.loai.sgt',
};

/** Bản viết tắt — pill trên thẻ buổi, chỗ chỉ vừa vài ký tự.

    Hai bảng riêng chứ không phải một, vì cùng một loại buổi có hai cách gọi tuỳ
    chỗ đứng: "PT (1 kèm 1)" trong ô chọn nhưng chỉ "PT" trên pill. */
export const LOAI_BUOI_NGAN_KHOA: Record<LoaiBuoi, string> = {
  pt: 'datLich.loaiNgan.pt',
  lop: 'datLich.loaiNgan.lop',
  sgt: 'datLich.loaiNgan.sgt',
};

export const LOAI_BUOI_ORDER: LoaiBuoi[] = ['pt', 'lop', 'sgt'];

/** Sức chứa mặc định theo loại. PT luôn 1 kèm 1. */
export const SUC_CHUA_MAC_DINH: Record<LoaiBuoi, number> = {
  pt: 1,
  lop: 20,
  sgt: 6,
};

export type TrangThaiBuoi = 'mo' | 'day' | 'da-huy' | 'da-xong';

export const TRANG_THAI_BUOI_KHOA: Record<TrangThaiBuoi, string> = {
  mo: 'datLich.trangThai.mo',
  day: 'datLich.trangThai.day',
  'da-huy': 'datLich.trangThai.da-huy',
  'da-xong': 'datLich.trangThai.da-xong',
};

/** Một chỗ đã đặt trong buổi. */
export interface ChoDat {
  id: string;
  hoiVienId: string;
  hoiVienTen: string;
  /** true là mới giữ chỗ, chưa chốt; hết hạn thì tự nhả. */
  giuCho: boolean;
  /** Thời điểm hết hạn giữ chỗ. Chỉ có khi giuCho. */
  giuChoDenLuc?: IsoDateTime;
}

/** Một người trong hàng chờ. */
export interface ChoDoi {
  id: string;
  hoiVienId: string;
  hoiVienTen: string;
  /** Thứ tự trong hàng, 1 là người đầu. */
  thuTu: number;
}

export interface Buoi {
  id: string;
  loai: LoaiBuoi;
  ten: string;
  /** Bỏ trống là chưa phân HLV; khi đó không kiểm tra trùng lịch. */
  hlvId?: string;
  hlvTen?: string;
  locationId: string;
  locationName?: string;
  batDau: IsoDateTime;
  ketThuc: IsoDateTime;
  sucChua: number;
  daDat: ChoDat[];
  hangCho: ChoDoi[];
  daHuy: boolean;
}

/** Buổi rút gọn dùng để kiểm tra trùng lịch — chỉ cần ngần này. */
export interface KhoangBuoi {
  id: string;
  hlvId?: string;
  batDau: IsoDateTime;
  ketThuc: IsoDateTime;
  daHuy: boolean;
}

export interface LichTuanParams {
  /** Thứ Hai của tuần, dạng 'YYYY-MM-DD'. */
  tuNgay: IsoDate;
  /** Bỏ trống = mọi CLB. */
  locationId?: string;
  loai?: LoaiBuoi;
  hlvId?: string;
}

export interface BuoiInput {
  loai: LoaiBuoi;
  ten: string;
  hlvId?: string;
  locationId: string;
  batDau: IsoDateTime;
  ketThuc: IsoDateTime;
  sucChua: number;
}

/** Huấn luyện viên chọn được khi xếp lịch. */
export interface HuanLuyenVien {
  id: string;
  hoTen: string;
}
