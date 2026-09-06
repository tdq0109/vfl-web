/* Kiểu dùng chung ở tầng API. Hình dạng cụ thể sẽ khớp với hợp đồng API của
   backend .NET khi có — hiện lấy dạng phổ biến nhất của ASP.NET. */

/** Số tiền VND, luôn số nguyên đồng. Alias thuần, không nhánh (branded) —
    thêm nhánh sau rẻ hơn gỡ ra. */
export type Vnd = number;

/** Ngày dạng 'YYYY-MM-DD' theo giờ địa phương. */
export type IsoDate = string;

/** Tài khoản ngân hàng nhận tiền chuyển khoản của một CLB.

    Backend là nguồn sự thật duy nhất, khác hệ cũ vốn để mỗi máy tự cấu hình rồi
    lưu trong localStorage: một quầy gõ nhầm một chữ số là khách chuyển tiền vào
    tài khoản người lạ mà không ai đối chiếu được.

    Đi kèm Location chứ không phải endpoint riêng, vì hồ sơ người dùng đã mang
    sẵn danh sách CLB. bin là mã 6 chữ số của NAPAS — tra bảng, đừng đoán. */
export interface TaiKhoanNhanTien {
  bin: string;
  soTaiKhoan: string;
  tenChuTaiKhoan: string;
}

export interface Location {
  id: string;
  name: string;
  shortName?: string;
  /** Thiếu nghĩa là CLB này chưa cấu hình tài khoản; màn thu tiền không hiện
      mã QR. */
  taiKhoanNhanTien?: TaiKhoanNhanTien;
}

/** Tham số phân trang gửi lên API. `page` đếm từ 1. */
export interface PageQuery {
  page: number;
  pageSize: number;
  search?: string;
  /** 'field' tăng dần, '-field' giảm dần. */
  sort?: string;
}

export interface Paged<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
