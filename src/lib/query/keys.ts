import type { QueryClient } from '@tanstack/react-query';

/* NƠI DUY NHẤT khai báo khoá cache. Rải chuỗi khắp nơi thì luôn sót một chỗ khi
   invalidate.

   `keys` — cây khoá phân cấp. `keys.hoiVien.all` khớp mọi truy vấn hội viên;
   `keys.hoiVien.list(params)` là một trang cụ thể.

   `AFFECTED_BY` — một sự kiện nghiệp vụ ảnh hưởng nhiều nhánh. Bán một hợp đồng
   đụng tới hội viên, công nợ và tổng quan cùng lúc → khai ở đây, sửa một chỗ. */

export const keys = {
  session: ['session'] as const,

  hoiVien: {
    all: ['hoi-vien'] as const,
    list: (params: object) => ['hoi-vien', 'list', params] as const,
    detail: (id: string) => ['hoi-vien', 'detail', id] as const,
  },
  nhanVien: {
    all: ['nhan-vien'] as const,
    list: (params: object) => ['nhan-vien', 'list', params] as const,
    detail: (id: string) => ['nhan-vien', 'detail', id] as const,
  },
  sanPham: {
    all: ['san-pham'] as const,
    list: (params: object) => ['san-pham', 'list', params] as const,
    detail: (id: string) => ['san-pham', 'detail', id] as const,
    bangGia: ['san-pham', 'bang-gia'] as const,
  },
  khuyenMai: {
    all: ['khuyen-mai'] as const,
  },
  datLich: {
    all: ['dat-lich'] as const,
    tuan: (params: object) => ['dat-lich', 'tuan', params] as const,
    buoi: (id: string) => ['dat-lich', 'buoi', id] as const,
    /* Lịch HLV để dò trùng — KHÔNG có locationId trong khoá vì phải nhìn mọi CLB. */
    hlv: (hlvId: string, tuNgay: string) => ['dat-lich', 'hlv', hlvId, tuNgay] as const,
    danhSachHlv: (locationId?: string) => ['dat-lich', 'ds-hlv', locationId ?? 'all'] as const,
  },
  banHangQuay: {
    all: ['ban-hang-quay'] as const,
    /* Ca đang mở của chính mình tại một CLB — mỗi CLB một ca riêng. */
    caDangMo: (locationId: string) => ['ban-hang-quay', 'ca-dang-mo', locationId] as const,
    hang: (locationId: string) => ['ban-hang-quay', 'hang', locationId] as const,
    /* Giám sát: danh sách ca của MỌI thu ngân theo bộ lọc, và một ca cụ thể. */
    danhSachCa: (params: object) => ['ban-hang-quay', 'ds-ca', params] as const,
    chiTietCa: (caId: string) => ['ban-hang-quay', 'ca', caId] as const,
    /* Ngày làm việc của quầy: mọi ca trong ngày + trạng thái chốt. */
    ngayLamViec: (ngay: string, locationId: string) =>
      ['ban-hang-quay', 'ngay', ngay, locationId] as const,
  },
  hopDong: {
    all: ['hop-dong'] as const,
    list: (params: object) => ['hop-dong', 'list', params] as const,
    detail: (id: string) => ['hop-dong', 'detail', id] as const,
  },
  congNo: {
    all: ['cong-no'] as const,
  },
  tongQuan: {
    /* Mọi sự kiện nghiệp vụ đều invalidate nhánh này → dashboard tự làm mới.
       Các khoá con nằm dưới cùng tiền tố nên `all` quét hết. */
    all: ['tong-quan'] as const,
    tomTat: (params: object) => ['tong-quan', 'tom-tat', params] as const,
    doanhThu: (params: object) => ['tong-quan', 'doanh-thu', params] as const,
    topSanPham: (params: object) => ['tong-quan', 'top-san-pham', params] as const,
    homNay: (locationId?: string) => ['tong-quan', 'hom-nay', locationId ?? 'all'] as const,
  },
} as const;

/** Nhánh khoá cần invalidate khi mỗi sự kiện nghiệp vụ xảy ra. Mở rộng khi dựng
    từng màn (Bước 7+). */
export const AFFECTED_BY = {
  hoiVienThayDoi: [keys.hoiVien.all, keys.tongQuan.all],
  nhanVienThayDoi: [keys.nhanVien.all, keys.tongQuan.all],
  // Đổi giá đụng tới cả khuyến mãi: cảnh báo "phá giá sàn" tính từ giá sản phẩm
  sanPhamThayDoi: [keys.sanPham.all, keys.khuyenMai.all, keys.tongQuan.all],
  khuyenMaiThayDoi: [keys.khuyenMai.all, keys.tongQuan.all],
  datLichThayDoi: [keys.datLich.all, keys.tongQuan.all],
  banHopDong: [keys.hopDong.all, keys.hoiVien.all, keys.congNo.all, keys.tongQuan.all],
  banVeQuay: [keys.banHangQuay.all, keys.congNo.all, keys.tongQuan.all],
} as const;

export type DomainEvent = keyof typeof AFFECTED_BY;

/** Invalidate mọi nhánh mà sự kiện `event` ảnh hưởng. Gọi trong `onSuccess` của
    hook mutation. */
export function invalidateAffected(qc: QueryClient, event: DomainEvent): Promise<unknown> {
  return Promise.all(
    AFFECTED_BY[event].map((queryKey) => qc.invalidateQueries({ queryKey })),
  );
}
