/* Mock backend .NET để chạy thử frontend khi chưa có backend thật.

   Chạy:  npm run mock      (cổng 5099, khớp DOTNET_API_URL trong .env.local)

   Chỉ dùng để phát triển và diễn tập. Dữ liệu nằm trong RAM và mất khi tắt;
   "token" là chuỗi tok:<email> không ký, không hạn — đừng bao giờ trỏ bản dựng
   thật vào đây.

   Mock tự kiểm các quy tắc quan trọng, để chứng minh frontend không phải nơi
   giữ luật:
     · chuyển trạng thái sai bảng           → 409
     · phát hành khi chưa thu đủ            → 409
     · người lập tự xác minh hợp đồng mình  → 403
     · bán dưới giá sàn                     → 400 kèm ProblemDetails.errors
     · thu quá số còn phải thu              → 400

   Ba tài khoản (mật khẩu bất kỳ) để thử phân quyền mà không cần nhiều tài khoản:
     sale@vfl.vn    → staff       (lập hợp đồng)
     ketoan@vfl.vn  → accountant  (xác minh & phát hành)
     gd@vfl.vn      → director    (toàn hệ thống, xem báo cáo)

   Phủ đủ endpoint của: auth, hội viên, sản phẩm và khuyến mãi, hợp
   đồng, tổng quan, bán vé ngày tại quầy, nhân viên (kèm ba chiều phân quyền),
   đặt lịch (kèm chống trùng lịch HLV). */

import { createServer } from 'node:http';

const PORT = 5099;

/* `taiKhoanNhanTien` đi kèm CLB — backend .NET thật cũng phải trả như vậy, xem
   `Location` trong `src/lib/api/types.ts`. HAI CLB CỐ Ý HAI TÀI KHOẢN KHÁC NHAU:
   chỉ khi khác nhau mới thử được luật "mã QR lấy theo CLB của hợp đồng, không
   theo CLB đang chọn trên thanh trên".

   Số tài khoản ở đây là số bịa để diễn tập, đừng chép sang bản thật. */
const LOCATIONS = [
  {
    id: 'q1',
    name: 'VFL Quận 1',
    shortName: 'Q1',
    taiKhoanNhanTien: {
      bin: '970436',
      soTaiKhoan: '0071000123456',
      tenChuTaiKhoan: 'CTY CP FITNESS VIET NAM',
    },
  },
  {
    id: 'q7',
    name: 'VFL Quận 7',
    shortName: 'Q7',
    taiKhoanNhanTien: {
      bin: '970407',
      soTaiKhoan: '19001234567890',
      tenChuTaiKhoan: 'CTY CP FITNESS VIET NAM CN Q7',
    },
  },
];

const USERS = {
  'sale@vfl.vn': {
    id: 'u-sale',
    fullName: 'Trần Sales',
    email: 'sale@vfl.vn',
    role: 'staff',
    locations: [LOCATIONS[0]],
    allLocations: false,
  },
  'ketoan@vfl.vn': {
    id: 'u-ketoan',
    fullName: 'Lê Kế Toán',
    email: 'ketoan@vfl.vn',
    role: 'accountant',
    locations: LOCATIONS,
    allLocations: false,
  },
  'gd@vfl.vn': {
    id: 'u-gd',
    fullName: 'Phạm Giám Đốc',
    email: 'gd@vfl.vn',
    role: 'director',
    locations: LOCATIONS,
    allLocations: true,
  },
};

const HOI_VIEN = [
  { id: 'hv1', maHoiVien: 'HV0001', hoTen: 'Nguyễn Văn An', soDienThoai: '0901234567', locationId: 'q1', locationName: 'VFL Quận 1', trangThai: 'dang-hoat-dong', ngayThamGia: '2025-03-04' },
  { id: 'hv2', maHoiVien: 'HV0002', hoTen: 'Trần Thị Bình', soDienThoai: '0912345678', locationId: 'q1', locationName: 'VFL Quận 1', trangThai: 'dang-hoat-dong', ngayThamGia: '2026-01-20' },
  { id: 'hv3', maHoiVien: 'HV0003', hoTen: 'Lê Minh Cường', soDienThoai: '0987654321', locationId: 'q7', locationName: 'VFL Quận 7', trangThai: 'tam-dung', ngayThamGia: '2024-11-02' },
];

/* Nhân viên — thêm để diễn tập được màn Nhân viên (trước đó mock chưa phủ, nên
   cả màn chỉ ra lỗi tải). Ba người đầu TRÙNG id với ba tài khoản đăng nhập ở
   `USERS`: có vậy mới thử được luật "không tự đổi vai trò của chính mình". */
const NHAN_VIEN = [
  { id: 'u-sale', maNhanVien: 'NV0001', hoTen: 'Trần Sales', soDienThoai: '0903111222', email: 'sale@vfl.vn', vaiTro: 'staff', locationId: 'q1', locationName: 'VFL Quận 1', allLocations: false, trangThai: 'dang-lam', ngayVaoLam: '2025-02-10' },
  { id: 'u-ketoan', maNhanVien: 'NV0002', hoTen: 'Lê Kế Toán', soDienThoai: '0903222333', email: 'ketoan@vfl.vn', vaiTro: 'accountant', locationId: 'q1', locationName: 'VFL Quận 1', allLocations: false, trangThai: 'dang-lam', ngayVaoLam: '2024-06-01' },
  { id: 'u-gd', maNhanVien: 'NV0003', hoTen: 'Phạm Giám Đốc', soDienThoai: '0903333444', email: 'gd@vfl.vn', vaiTro: 'director', locationId: 'q1', locationName: 'VFL Quận 1', allLocations: true, trangThai: 'dang-lam', ngayVaoLam: '2023-01-15' },
  { id: 'nv4', maNhanVien: 'NV0004', hoTen: 'Võ Huấn Luyện', soDienThoai: '0903444555', email: 'hlv@vfl.vn', vaiTro: 'coach', locationId: 'q1', locationName: 'VFL Quận 1', allLocations: false, trangThai: 'nghi-phep', ngayVaoLam: '2025-09-01', ghiChu: 'Nghỉ phép tới hết tháng.' },
  { id: 'nv5', maNhanVien: 'NV0005', hoTen: 'Đỗ Trưởng Nhóm', soDienThoai: '0903555666', email: 'leader.q7@vfl.vn', vaiTro: 'leader', locationId: 'q7', locationName: 'VFL Quận 7', allLocations: false, trangThai: 'dang-lam', ngayVaoLam: '2025-04-20' },
  { id: 'nv6', maNhanVien: 'NV0006', hoTen: 'Bùi Cộng Tác', soDienThoai: '0903666777', email: 'ctv.q7@vfl.vn', vaiTro: 'ctv', locationId: 'q7', locationName: 'VFL Quận 7', allLocations: false, trangThai: 'da-nghi', ngayVaoLam: '2024-03-03' },
];

const SAN_PHAM = [
  { id: 'sp1', maSanPham: 'GT12', ten: 'Gói tập 12 tháng', loai: 'goi-tap', giaNiemYet: 12_000_000, giaSan: 9_500_000, thoiHanNgay: 365, trangThai: 'dang-ban', ngayTao: '2025-01-01' },
  { id: 'sp2', maSanPham: 'GT01', ten: 'Gói tập 1 tháng', loai: 'goi-tap', giaNiemYet: 1_200_000, giaSan: 950_000, thoiHanNgay: 30, trangThai: 'dang-ban', ngayTao: '2025-01-01' },
  { id: 'sp3', maSanPham: 'PT10', ten: 'PT 10 buổi', loai: 'dich-vu', giaNiemYet: 5_000_000, giaSan: 4_000_000, soBuoi: 10, trangThai: 'dang-ban', ngayTao: '2025-01-01' },
];

const KHUYEN_MAI = [
  { id: 'km1', ma: 'HE2026', ten: 'Hè 2026 giảm 10%', loaiGiam: 'phan-tram', giaTri: 10, tuNgay: '2026-06-01', denNgay: '2026-12-31', kichHoat: true },
  { id: 'km2', ma: 'CU500', ten: 'Giảm 500k', loaiGiam: 'so-tien', giaTri: 500_000, tuNgay: '2026-01-01', denNgay: '2026-12-31', kichHoat: true },
];

const CHUYEN_TIEP = {
  'bao-gia': ['cho-thu-tien', 'da-huy'],
  'cho-thu-tien': ['cho-xac-minh', 'da-huy'],
  'cho-xac-minh': ['da-phat-hanh', 'da-huy'],
  'da-phat-hanh': ['da-ky'],
  'da-ky': ['dang-hieu-luc'],
  'dang-hieu-luc': [],
  'da-huy': [],
  'tam-dung': [],
};

const RANK = { ctv: 10, staff: 20, coach: 20, leader: 30, accountant: 35, manager: 40, director: 60, ceo: 100 };
const QUYEN = { 'bao-gia': 20, 'cho-thu-tien': 20, 'cho-xac-minh': 20, 'da-phat-hanh': 35, 'da-ky': 20, 'dang-hieu-luc': 20, 'da-huy': 30, 'tam-dung': 40 };

let seq = 4;
const HOP_DONG = [
  {
    id: 'hd1', maHopDong: 'HD0001', hoiVienId: 'hv1', hoiVienTen: 'Nguyễn Văn An', hoiVienSdt: '0901234567',
    locationId: 'q1', locationName: 'VFL Quận 1', nguoiLapId: 'u-sale', nguoiLapTen: 'Trần Sales',
    dong: [{ sanPhamId: 'sp1', ten: 'Gói tập 12 tháng', giaNiemYet: 12_000_000, giaSan: 9_500_000, donGia: 12_000_000, soLuong: 1 }],
    thanhToan: [], trangThai: 'bao-gia', ngayLap: '2026-08-20', ghiChu: 'Khách hẹn chuyển khoản trong tuần.',
    lichSu: [{ trangThai: 'bao-gia', luc: '2026-08-20T09:15', nguoiId: 'u-sale', nguoiTen: 'Trần Sales' }],
  },
  {
    id: 'hd2', maHopDong: 'HD0002', hoiVienId: 'hv2', hoiVienTen: 'Trần Thị Bình', hoiVienSdt: '0912345678',
    locationId: 'q1', locationName: 'VFL Quận 1', nguoiLapId: 'u-sale', nguoiLapTen: 'Trần Sales',
    dong: [{ sanPhamId: 'sp2', ten: 'Gói tập 1 tháng', giaNiemYet: 1_200_000, giaSan: 950_000, donGia: 1_200_000, soLuong: 3 }],
    thanhToan: [{ id: 'tt1', soTien: 3_600_000, phuongThuc: 'chuyen-khoan', luc: '2026-02-01T10:00', nguoiThuId: 'u-sale', nguoiThuTen: 'Trần Sales', daHuy: false }],
    trangThai: 'dang-hieu-luc', ngayLap: '2026-02-01', ngayBatDau: '2026-02-01', ngayKetThuc: '2026-05-01',
    ngayPhatHanh: '2026-02-01', ngayKy: '2026-02-01', nguoiXacMinhId: 'u-ketoan', nguoiXacMinhTen: 'Lê Kế Toán',
    lichSu: [{ trangThai: 'dang-hieu-luc', luc: '2026-02-01T11:00', nguoiId: 'u-sale', nguoiTen: 'Trần Sales' }],
  },
  /* Hai hợp đồng có phiếu thu trong tuần này — để biểu đồ dashboard có dữ liệu
     THƯA (21/8 và 24/8 có, 22–23 và 25–26 trống) mà kiểm tra phần điền 0. */
  {
    id: 'hd3', maHopDong: 'HD0003', hoiVienId: 'hv3', hoiVienTen: 'Lê Minh Cường', hoiVienSdt: '0987654321',
    locationId: 'q1', locationName: 'VFL Quận 1', nguoiLapId: 'u-sale', nguoiLapTen: 'Trần Sales',
    dong: [{ sanPhamId: 'sp3', ten: 'PT 10 buổi', giaNiemYet: 5_000_000, giaSan: 4_000_000, donGia: 5_000_000, soLuong: 1 }],
    thanhToan: [{ id: 'tt3', soTien: 5_000_000, phuongThuc: 'tien-mat', luc: '2026-08-21T09:30', nguoiThuId: 'u-sale', nguoiThuTen: 'Trần Sales', daHuy: false }],
    trangThai: 'dang-hieu-luc', ngayLap: '2026-08-21', ngayBatDau: '2026-08-21', ngayKetThuc: '2026-11-21',
    ngayPhatHanh: '2026-08-21', ngayKy: '2026-08-21', nguoiXacMinhId: 'u-ketoan', nguoiXacMinhTen: 'Lê Kế Toán',
    lichSu: [{ trangThai: 'dang-hieu-luc', luc: '2026-08-21T10:00', nguoiId: 'u-ketoan', nguoiTen: 'Lê Kế Toán' }],
  },
  {
    id: 'hd4', maHopDong: 'HD0004', hoiVienId: 'hv2', hoiVienTen: 'Trần Thị Bình', hoiVienSdt: '0912345678',
    locationId: 'q1', locationName: 'VFL Quận 1', nguoiLapId: 'u-sale', nguoiLapTen: 'Trần Sales',
    dong: [{ sanPhamId: 'sp1', ten: 'Gói tập 12 tháng', giaNiemYet: 12_000_000, giaSan: 9_500_000, donGia: 11_000_000, soLuong: 1 }],
    thanhToan: [{ id: 'tt4', soTien: 4_000_000, phuongThuc: 'chuyen-khoan', luc: '2026-08-24T15:00', nguoiThuId: 'u-sale', nguoiThuTen: 'Trần Sales', daHuy: false }],
    trangThai: 'cho-thu-tien', ngayLap: '2026-08-24', ngayBatDau: '2026-09-01',
    lichSu: [{ trangThai: 'cho-thu-tien', luc: '2026-08-24T15:00', nguoiId: 'u-sale', nguoiTen: 'Trần Sales' }],
  },
];

/* Buổi tập — thêm để diễn tập được màn Đặt lịch (mock trước đó chưa phủ, nên cả
   màn chỉ ra lỗi tải). Ngày sinh theo TUẦN CHỨA HÔM NAY để mở màn lên là thấy
   buổi ngay, không phải bấm lùi tuần.

   HLV lấy từ `NHAN_VIEN` để hai màn khớp nhau: HLV trong ô chọn đúng là người có
   trong danh bạ, không phải một danh sách bịa riêng. */
let seqBuoi = 1;
const buoiId = () => `bu${seqBuoi++}`;

/** 'YYYY-MM-DDTHH:mm' của ngày thứ Hai tuần này + `lech` ngày, tại giờ `gio`. */
function lucTrongTuan(lech, gio) {
  const d = new Date();
  const thu = (d.getDay() + 6) % 7; /* 0 = thứ Hai */
  d.setDate(d.getDate() - thu + lech);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${gio}`;
}

const BUOI = [
  {
    id: buoiId(), loai: 'lop', ten: 'Yoga sáng', hlvId: 'nv4', hlvTen: 'Võ Huấn Luyện',
    locationId: 'q1', locationName: 'VFL Quận 1',
    batDau: lucTrongTuan(0, '06:00'), ketThuc: lucTrongTuan(0, '07:00'),
    sucChua: 20,
    daDat: [
      { id: 'c1', hoiVienId: 'hv1', hoiVienTen: 'Nguyễn Văn An', giuCho: false },
      { id: 'c2', hoiVienId: 'hv2', hoiVienTen: 'Trần Thị Bình', giuCho: true, giuChoDenLuc: lucTrongTuan(6, '23:59') },
    ],
    hangCho: [], daHuy: false,
  },
  {
    /* PT 1 kèm 1 và ĐÃ ĐẦY — để thử được nhánh "Buổi đã đầy, có thể vào hàng chờ"
       và khối hàng chờ mà không phải tự dựng dữ liệu. */
    id: buoiId(), loai: 'pt', ten: 'PT sáng — anh Cường', hlvId: 'nv4', hlvTen: 'Võ Huấn Luyện',
    locationId: 'q1', locationName: 'VFL Quận 1',
    batDau: lucTrongTuan(1, '08:00'), ketThuc: lucTrongTuan(1, '09:00'),
    sucChua: 1,
    daDat: [{ id: 'c3', hoiVienId: 'hv3', hoiVienTen: 'Lê Minh Cường', giuCho: false }],
    hangCho: [{ id: 'w1', hoiVienId: 'hv1', hoiVienTen: 'Nguyễn Văn An', thuTu: 1 }],
    daHuy: false,
  },
  {
    id: buoiId(), loai: 'sgt', ten: 'SGT chiều', locationId: 'q1', locationName: 'VFL Quận 1',
    batDau: lucTrongTuan(2, '17:30'), ketThuc: lucTrongTuan(2, '18:30'),
    sucChua: 6, daDat: [], hangCho: [], daHuy: false,
  },
  {
    id: buoiId(), loai: 'lop', ten: 'Zumba tối', hlvId: 'nv5', hlvTen: 'Đỗ Trưởng Nhóm',
    locationId: 'q7', locationName: 'VFL Quận 7',
    batDau: lucTrongTuan(3, '19:00'), ketThuc: lucTrongTuan(3, '20:00'),
    sucChua: 25, daDat: [], hangCho: [], daHuy: false,
  },
  {
    /* Buổi ĐÃ HUỶ — để thấy thẻ mờ đi và nhánh "Buổi đã huỷ." */
    id: buoiId(), loai: 'lop', ten: 'Boxing (đã huỷ)', hlvId: 'nv4', hlvTen: 'Võ Huấn Luyện',
    locationId: 'q1', locationName: 'VFL Quận 1',
    batDau: lucTrongTuan(4, '18:00'), ketThuc: lucTrongTuan(4, '19:00'),
    sucChua: 15, daDat: [], hangCho: [], daHuy: true,
  },
];

/* Hàng bán tại quầy và ca thu ngân — giữ trong RAM như mọi thứ khác của mock. */
const HANG_QUAY = [
  { id: 'v1', maSanPham: 'VE-NGAY', ten: 'Vé tập ngày', gia: 100_000 },
  { id: 'v2', maSanPham: 'VE-NHOM', ten: 'Vé lớp nhóm', gia: 150_000 },
  { id: 'n1', maSanPham: 'NUOC-500', ten: 'Nước suối 500ml', gia: 15_000 },
  { id: 'n2', maSanPham: 'DIEN-GIAI', ten: 'Nước điện giải', gia: 35_000 },
  { id: 'k1', maSanPham: 'KHAN', ten: 'Khăn tập', gia: 50_000 },
];

const CA_QUAY = [];
const CHOT_NGAY = [];

/* KHUNG CA CHUẨN — phải khớp `features/ban-hang-quay/khungCa.ts`. Mock giữ bản
   2 ca; đây là GIẢ ĐỊNH chờ vận hành chốt, và nếu mỗi CLB một khung khác nhau
   thì khung phải đi kèm `Location` chứ không nằm ở đây. */
const KHUNG_CA = [
  { id: 'sang', batDau: '06:00', ketThuc: '14:00' },
  { id: 'chieu', batDau: '14:00', ketThuc: '22:00' },
];

const phutCua = (hhmm) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

/** Khung chứa thời điểm 'YYYY-MM-DDTHH:mm', hoặc null. */
function khungCua(luc) {
  const t = phutCua(luc.slice(11, 16));
  return (
    KHUNG_CA.find((k) => {
      const bd = phutCua(k.batDau);
      const kt = phutCua(k.ketThuc);
      return kt > bd ? t >= bd && t < kt : t >= bd || t < kt;
    }) ?? null
  );
}

/** NGÀY LÀM VIỆC của một mốc — ca đêm sau nửa đêm thuộc về ngày hôm trước. */
function ngayLamViecCua(luc) {
  const k = khungCua(luc);
  if (!k) return luc.slice(0, 10);
  const bd = phutCua(k.batDau);
  const kt = phutCua(k.ketThuc);
  const t = phutCua(luc.slice(11, 16));
  return kt <= bd && t < kt ? congNgay(luc.slice(0, 10), -1) : luc.slice(0, 10);
}

/* Tiện ích thời gian cho phần Đặt lịch.

   Dùng chuỗi 'YYYY-MM-DDTHH:mm' giờ địa phương, giống quy ước ở
   features/dat-lich/types.ts. Đừng đổi sang toISOString(): ở múi +7 nó biến 0h
   ngày 1 thành ngày 31 tháng trước. */

const hai = (n) => String(n).padStart(2, '0');

/** 'YYYY-MM-DDTHH:mm' của thời điểm hiện tại. */
const thoiDiemNay = () => {
  const d = new Date();
  return `${d.getFullYear()}-${hai(d.getMonth() + 1)}-${hai(d.getDate())}T${hai(d.getHours())}:${hai(d.getMinutes())}`;
};

/** 'YYYY-MM-DD' + n ngày. */
function congNgay(ngay, n) {
  const [y, m2, d2] = ngay.split('-').map(Number);
  const d = new Date(y, m2 - 1, d2 + n);
  return `${d.getFullYear()}-${hai(d.getMonth() + 1)}-${hai(d.getDate())}`;
}

/** Thứ Hai của tuần chứa `ngay`. */
function thuHaiCua(ngay) {
  const [y, m2, d2] = ngay.split('-').map(Number);
  const d = new Date(y, m2 - 1, d2);
  return congNgay(ngay, -((d.getDay() + 6) % 7));
}

/** 'YYYY-MM-DDTHH:mm' + n phút. */
function congPhut(luc, n) {
  const [ngay, gio] = luc.split('T');
  const [y, m2, d2] = ngay.split('-').map(Number);
  const [hh, mm] = gio.split(':').map(Number);
  const d = new Date(y, m2 - 1, d2, hh, mm + n);
  return `${d.getFullYear()}-${hai(d.getMonth() + 1)}-${hai(d.getDate())}T${hai(d.getHours())}:${hai(d.getMinutes())}`;
}

/** Hai khoảng có chồng nhau không — nửa mở, chạm biên KHÔNG tính. */
const chongLan = (a1, a2, b1, b2) => a1 < b2 && b1 < a2;

/** Kiểm một buổi sắp lưu. Trả `null` nếu hợp lệ, hoặc mô tả lỗi để trả về.

    Đây mới là nơi giữ luật. Frontend có dò trùng lịch ngay lúc nhập, nhưng đó
    chỉ để báo sớm: giữa lúc mở form và lúc bấm lưu, người khác có thể đã xếp mất
    chỗ đó. */
function kiemBuoi(input, boQuaId) {
  if (!String(input.ten ?? '').trim()) {
    return { status: 400, detail: 'Thiếu tên buổi.', errors: { ten: ['Bắt buộc.'] } };
  }
  if (!input.batDau || !input.ketThuc || input.ketThuc <= input.batDau) {
    return {
      status: 400,
      detail: 'Giờ kết thúc phải sau giờ bắt đầu.',
      errors: { ketThuc: ['Phải sau giờ bắt đầu.'] },
    };
  }
  if (!Number.isInteger(input.sucChua) || input.sucChua < 1) {
    return {
      status: 400,
      detail: 'Sức chứa không hợp lệ.',
      errors: { sucChua: ['Phải là số nguyên từ 1.'] },
    };
  }
  if (input.loai === 'pt' && input.sucChua !== 1) {
    return {
      status: 400,
      detail: 'Buổi PT là 1 kèm 1.',
      errors: { sucChua: ['Buổi PT phải có sức chứa bằng 1.'] },
    };
  }
  if (input.hlvId) {
    /* Trùng lịch HLV soát TOÀN HỆ THỐNG, không lọc theo CLB — một người không
       đứng lớp ở hai CLB cùng lúc được. */
    const trung = BUOI.filter(
      (b) =>
        b.id !== boQuaId &&
        !b.daHuy &&
        b.hlvId === input.hlvId &&
        chongLan(input.batDau, input.ketThuc, b.batDau, b.ketThuc),
    );
    if (trung.length > 0) {
      return {
        status: 409,
        detail: `Huấn luyện viên đã có ${trung.length} buổi khác trùng giờ.`,
        errors: { hlvId: ['Trùng lịch.'] },
      };
    }
  }
  return null;
}


const json = (res, status, body) => {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
};

const problem = (res, status, detail, errors) =>
  json(res, status, { type: 'about:blank', title: detail, status, detail, ...(errors ? { errors } : {}) });

const paged = (items, url) => {
  const page = Number(url.searchParams.get('page') ?? 1);
  const pageSize = Number(url.searchParams.get('pageSize') ?? 20);
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    page,
    pageSize,
    total: items.length,
    totalPages: Math.max(1, Math.ceil(items.length / pageSize)),
  };
};

const body = (req) =>
  new Promise((resolve) => {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => resolve(raw ? JSON.parse(raw) : {}));
  });

/** Token giả: `tok:<email>`. Đủ để mock biết ai đang gọi. */
const userOf = (req) => {
  const auth = req.headers.authorization ?? '';
  const email = auth.replace(/^Bearer tok:/, '');
  return USERS[email] ?? null;
};

const tongHopDong = (hd) => {
  const tamTinh = hd.dong.reduce((t, d) => t + d.donGia * d.soLuong, 0);
  if (!hd.khuyenMai) return tamTinh;
  const giam =
    hd.khuyenMai.loaiGiam === 'phan-tram'
      ? Math.round((tamTinh * hd.khuyenMai.giaTri) / 100 / 1000) * 1000
      : hd.khuyenMai.giaTri;
  return tamTinh - Math.min(Math.max(0, giam), tamTinh);
};

const daThu = (hd) => hd.thanhToan.filter((t) => !t.daHuy).reduce((t, x) => t + x.soTien, 0);
const conPhaiThu = (hd) => Math.max(0, tongHopDong(hd) - daThu(hd));

/* Giờ địa phương, không dùng toISOString().

   Bản đầu dùng new Date().toISOString().slice(0, 16), tức giờ UTC. Ở múi +7,
   một giao dịch lúc 9h sáng được ghi là 02:00 — lệch đúng 7 tiếng so với mọi
   thứ frontend hiển thị (`fmtDateTime` đọc chuỗi không có múi giờ là giờ ĐỊA
   PHƯƠNG). Với màn Giám sát ca thì sai này không còn vô hại: "ca mở quá 12
   tiếng" đo bằng hiệu hai mốc, nên ca vừa mở đã bị báo bỏ quên. Cùng bài học đã
   ghi ở phần Đặt lịch ngay trên. */
const nowIso = () => thoiDiemNay();
const todayIso = () => thoiDiemNay().slice(0, 10);

// Định tuyến

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const p = url.pathname;
  const m = req.method;
  const seg = p.split('/').filter(Boolean);

  console.log(m, p);

  if (p === '/auth/login' && m === 'POST') {
    const { email } = await body(req);
    const user = USERS[String(email).trim().toLowerCase()];
    if (!user) return problem(res, 401, 'Email không tồn tại trong bản mock.');
    return json(res, 200, {
      accessToken: `tok:${user.email}`,
      refreshToken: `ref:${user.email}`,
      expiresIn: 900,
      refreshExpiresIn: 2_592_000,
      user,
    });
  }

  if (p === '/auth/refresh' && m === 'POST') {
    const { refreshToken } = await body(req);
    const email = String(refreshToken ?? '').replace(/^ref:/, '');
    const user = USERS[email];
    if (!user) return problem(res, 401, 'Refresh token không hợp lệ.');
    return json(res, 200, {
      accessToken: `tok:${user.email}`,
      refreshToken: `ref:${user.email}`,
      expiresIn: 900,
      refreshExpiresIn: 2_592_000,
      user,
    });
  }

  if (p === '/auth/logout') return json(res, 200, {});

  const me = userOf(req);
  if (p === '/auth/me') {
    if (!me) return problem(res, 401, 'Chưa đăng nhập.');
    return json(res, 200, me);
  }
  if (!me) return problem(res, 401, 'Chưa đăng nhập.');

  /* Hội viên / sản phẩm / khuyến mãi — chỉ đủ để màn hợp đồng chọn được. */
  if (p === '/hoi-vien' && m === 'GET') {
    const q = (url.searchParams.get('search') ?? '').toLowerCase();
    const loc = url.searchParams.get('locationId');
    const ds = HOI_VIEN.filter(
      (h) =>
        (!loc || h.locationId === loc) &&
        (!q || h.hoTen.toLowerCase().includes(q) || h.soDienThoai.includes(q)),
    );
    return json(res, 200, paged(ds, url));
  }

  /* Chi tiết / thêm / sửa / đổi trạng thái hội viên — thêm khi cần diễn tập màn
     Hội viên (trước đó mock chỉ có danh sách, nên ngăn chi tiết luôn trả 404). */
  if (seg[0] === 'hoi-vien' && seg[1] && !seg[2] && m === 'GET') {
    const hv = HOI_VIEN.find((h) => h.id === seg[1]);
    return hv ? json(res, 200, hv) : problem(res, 404, 'Không tìm thấy hội viên.');
  }

  if (p === '/hoi-vien' && m === 'POST') {
    const input = await body(req);
    if (!String(input.hoTen ?? '').trim()) {
      return problem(res, 400, 'Thiếu họ tên.', { hoTen: ['Bắt buộc.'] });
    }
    if (!String(input.soDienThoai ?? '').trim()) {
      return problem(res, 400, 'Thiếu số điện thoại.', { soDienThoai: ['Bắt buộc.'] });
    }
    const n = HOI_VIEN.length + 1;
    const hv = {
      id: `hv${n}`,
      maHoiVien: `HV${String(n).padStart(4, '0')}`,
      ...input,
      locationName: LOCATIONS.find((l) => l.id === input.locationId)?.name,
      trangThai: 'dang-hoat-dong',
      ngayThamGia: todayIso(),
    };
    HOI_VIEN.push(hv);
    return json(res, 201, hv);
  }

  if (seg[0] === 'hoi-vien' && seg[1] && m === 'PUT' && !seg[2]) {
    const hv = HOI_VIEN.find((h) => h.id === seg[1]);
    if (!hv) return problem(res, 404, 'Không tìm thấy hội viên.');
    Object.assign(hv, await body(req));
    hv.locationName = LOCATIONS.find((l) => l.id === hv.locationId)?.name;
    return json(res, 200, hv);
  }

  if (seg[0] === 'hoi-vien' && seg[1] && seg[2] === 'trang-thai' && m === 'PATCH') {
    const hv = HOI_VIEN.find((h) => h.id === seg[1]);
    if (!hv) return problem(res, 404, 'Không tìm thấy hội viên.');
    const { trangThai } = await body(req);
    if (!['dang-hoat-dong', 'tam-dung', 'het-han', 'huy'].includes(trangThai)) {
      return problem(res, 400, 'Trạng thái không hợp lệ.', { trangThai: ['Giá trị lạ.'] });
    }
    hv.trangThai = trangThai;
    return json(res, 200, hv);
  }

  /* Nhân viên. Mock tự kiểm đủ ba chiều phân quyền: frontend ẩn nút, còn đây
     mới là chỗ trả 403. Bỏ ẩn nút bằng devtools rồi bấm vẫn không qua được. */
  if (p === '/nhan-vien' && m === 'GET') {
    const q = (url.searchParams.get('search') ?? '').toLowerCase();
    const loc = url.searchParams.get('locationId');
    const vaiTro = url.searchParams.get('vaiTro');
    const trangThai = url.searchParams.get('trangThai');
    const ds = NHAN_VIEN.filter(
      (n) =>
        /* Người mang cờ toàn hệ thống hiện ở MỌI phạm vi CLB — nếu lọc mất thì
           Giám đốc biến khỏi danh sách ngay khi chọn một CLB cụ thể. */
        (!loc || n.locationId === loc || n.allLocations) &&
        (!vaiTro || n.vaiTro === vaiTro) &&
        (!trangThai || n.trangThai === trangThai) &&
        (!q ||
          n.hoTen.toLowerCase().includes(q) ||
          n.soDienThoai.includes(q) ||
          n.email.toLowerCase().includes(q) ||
          n.maNhanVien.toLowerCase().includes(q)),
    );
    return json(res, 200, paged(ds, url));
  }

  if (seg[0] === 'nhan-vien' && seg[1] && !seg[2] && m === 'GET') {
    const nv = NHAN_VIEN.find((n) => n.id === seg[1]);
    return nv ? json(res, 200, nv) : problem(res, 404, 'Không tìm thấy nhân viên.');
  }

  if (p === '/nhan-vien' && m === 'POST') {
    if (RANK[me.role] < RANK.manager) {
      return problem(res, 403, 'Chỉ Quản lý CLB trở lên mới thêm được nhân viên.');
    }
    const input = await body(req);
    const loi = {};
    if (!String(input.hoTen ?? '').trim()) loi.hoTen = ['Bắt buộc.'];
    if (!String(input.soDienThoai ?? '').trim()) loi.soDienThoai = ['Bắt buộc.'];
    if (!String(input.email ?? '').trim()) loi.email = ['Bắt buộc.'];
    else if (NHAN_VIEN.some((n) => n.email === input.email)) {
      /* Email là tài khoản đăng nhập nên phải duy nhất — kiểm ở đây để màn có
         chỗ thử hiện lỗi theo ô nhập. */
      loi.email = ['Email này đã có người dùng.'];
    }
    if (Object.keys(loi).length) return problem(res, 400, 'Dữ liệu chưa hợp lệ.', loi);

    const n = NHAN_VIEN.length + 1;
    const nv = {
      id: `nv${n}`,
      maNhanVien: `NV${String(n).padStart(4, '0')}`,
      ...input,
      locationName: LOCATIONS.find((l) => l.id === input.locationId)?.name,
      /* Vai trò KHÔNG nhận từ form thêm — gán sau qua endpoint riêng, đúng như
         dòng mô tả trên ngăn thêm. */
      vaiTro: 'ctv',
      allLocations: false,
      trangThai: 'dang-lam',
      ngayVaoLam: input.ngayVaoLam || todayIso(),
    };
    NHAN_VIEN.push(nv);
    return json(res, 201, nv);
  }

  if (seg[0] === 'nhan-vien' && seg[1] && !seg[2] && m === 'PUT') {
    const nv = NHAN_VIEN.find((n) => n.id === seg[1]);
    if (!nv) return problem(res, 404, 'Không tìm thấy nhân viên.');
    if (RANK[me.role] <= RANK[nv.vaiTro]) {
      return problem(res, 403, 'Không sửa được hồ sơ người ngang hoặc cao cấp hơn mình.');
    }
    const input = await body(req);
    Object.assign(nv, input);
    nv.locationName = LOCATIONS.find((l) => l.id === nv.locationId)?.name;
    return json(res, 200, nv);
  }

  if (seg[0] === 'nhan-vien' && seg[1] && seg[2] === 'vai-tro' && m === 'PATCH') {
    const nv = NHAN_VIEN.find((n) => n.id === seg[1]);
    if (!nv) return problem(res, 404, 'Không tìm thấy nhân viên.');
    const { vaiTro, allLocations } = await body(req);

    /* Chiều 1 — phải cao hơn HẲN, cả người bị đổi lẫn vai trò định gán. */
    if (me.id === nv.id) return problem(res, 403, 'Không tự đổi vai trò của chính mình.');
    if (RANK[me.role] <= RANK[nv.vaiTro]) {
      return problem(res, 403, 'Không đổi được vai trò người ngang hoặc cao cấp hơn mình.');
    }
    if (!RANK[vaiTro]) return problem(res, 400, 'Vai trò lạ.', { vaiTro: ['Giá trị lạ.'] });
    if (RANK[me.role] <= RANK[vaiTro]) {
      return problem(res, 403, 'Không gán được vai trò ngang hoặc cao hơn mình.', {
        vaiTro: ['Vượt quá cấp bậc của bạn.'],
      });
    }
    /* Chiều 3 — cờ toàn hệ thống chỉ Giám đốc trở lên gán được. */
    if (allLocations !== nv.allLocations && RANK[me.role] < RANK.director) {
      return problem(res, 403, 'Chỉ Giám đốc / Tổng giám đốc gán được cờ toàn hệ thống.', {
        allLocations: ['Vượt quá cấp bậc của bạn.'],
      });
    }
    nv.vaiTro = vaiTro;
    nv.allLocations = Boolean(allLocations);
    return json(res, 200, nv);
  }

  if (seg[0] === 'nhan-vien' && seg[1] && seg[2] === 'trang-thai' && m === 'PATCH') {
    const nv = NHAN_VIEN.find((n) => n.id === seg[1]);
    if (!nv) return problem(res, 404, 'Không tìm thấy nhân viên.');
    if (RANK[me.role] <= RANK[nv.vaiTro]) {
      return problem(res, 403, 'Không đổi được trạng thái người ngang hoặc cao cấp hơn mình.');
    }
    const { trangThai } = await body(req);
    if (!['dang-lam', 'nghi-phep', 'da-nghi'].includes(trangThai)) {
      return problem(res, 400, 'Trạng thái không hợp lệ.', { trangThai: ['Giá trị lạ.'] });
    }
    nv.trangThai = trangThai;
    return json(res, 200, nv);
  }

  /* Đặt lịch. Tự kiểm đúng những luật mà lich.ts chỉ cảnh báo sớm ở frontend:
       · HLV trùng lịch                      → 409
       · giờ kết thúc không sau giờ bắt đầu  → 400
       · PT mà sức chứa khác 1               → 400
       · đặt chỗ khi buổi huỷ / đã đầy       → 409 */
  const buoiCuaId = (id) => BUOI.find((b) => b.id === id);
  const choConHieuLuc = (b) =>
    b.daDat.filter((c) => !c.giuCho || (c.giuChoDenLuc ?? '') > thoiDiemNay());

  if (p === '/dat-lich/tuan' && m === 'GET') {
    const tuNgay = url.searchParams.get('tuNgay') ?? '';
    const loc = url.searchParams.get('locationId');
    const loai = url.searchParams.get('loai');
    const hlvId = url.searchParams.get('hlvId');
    const denNgay = congNgay(tuNgay, 7);
    const ds = BUOI.filter(
      (b) =>
        b.batDau.slice(0, 10) >= tuNgay &&
        b.batDau.slice(0, 10) < denNgay &&
        (!loc || b.locationId === loc) &&
        (!loai || b.loai === loai) &&
        (!hlvId || b.hlvId === hlvId),
    );
    return json(res, 200, ds);
  }

  if (seg[0] === 'dat-lich' && seg[1] === 'hlv' && seg[2] && m === 'GET') {
    /* Lịch của MỘT hlv, MỌI CLB — cố ý không lọc theo CLB, xem ghi chú ở
       `datLichApi.lichHlv`. Buổi huỷ vẫn trả về, phía frontend tự bỏ. */
    const tuNgay = url.searchParams.get('tuNgay') ?? '';
    const thuHai = thuHaiCua(tuNgay);
    const denNgay = congNgay(thuHai, 7);
    const ds = BUOI.filter(
      (b) =>
        b.hlvId === seg[2] && b.batDau.slice(0, 10) >= thuHai && b.batDau.slice(0, 10) < denNgay,
    ).map((b) => ({ id: b.id, hlvId: b.hlvId, batDau: b.batDau, ketThuc: b.ketThuc, daHuy: b.daHuy }));
    return json(res, 200, ds);
  }

  if (p === '/dat-lich/huan-luyen-vien' && m === 'GET') {
    const loc = url.searchParams.get('locationId');
    /* HLV lấy từ danh bạ nhân viên để hai màn khớp nhau: vai trò `coach` hoặc
       `leader`, chưa nghỉ việc. Không dựng một danh sách bịa riêng. */
    const ds = NHAN_VIEN.filter(
      (n) =>
        (n.vaiTro === 'coach' || n.vaiTro === 'leader') &&
        n.trangThai !== 'da-nghi' &&
        (!loc || n.locationId === loc || n.allLocations),
    ).map((n) => ({ id: n.id, hoTen: n.hoTen }));
    return json(res, 200, ds);
  }

  if (seg[0] === 'dat-lich' && seg[1] === 'buoi' && seg[2] && !seg[3] && m === 'GET') {
    const b = buoiCuaId(seg[2]);
    return b ? json(res, 200, b) : problem(res, 404, 'Không tìm thấy buổi.');
  }

  if (p === '/dat-lich/buoi' && m === 'POST') {
    if (RANK[me.role] < RANK.leader) return problem(res, 403, 'Không đủ quyền xếp lịch.');
    const input = await body(req);
    const loi = kiemBuoi(input, null);
    if (loi) return problem(res, loi.status, loi.detail, loi.errors);
    const b = {
      id: buoiId(),
      ...input,
      hlvTen: NHAN_VIEN.find((n) => n.id === input.hlvId)?.hoTen,
      locationName: LOCATIONS.find((l) => l.id === input.locationId)?.name,
      daDat: [],
      hangCho: [],
      daHuy: false,
    };
    BUOI.push(b);
    return json(res, 201, b);
  }

  if (seg[0] === 'dat-lich' && seg[1] === 'buoi' && seg[2] && !seg[3] && m === 'PUT') {
    if (RANK[me.role] < RANK.leader) return problem(res, 403, 'Không đủ quyền xếp lịch.');
    const b = buoiCuaId(seg[2]);
    if (!b) return problem(res, 404, 'Không tìm thấy buổi.');
    const input = await body(req);
    const loi = kiemBuoi(input, b.id);
    if (loi) return problem(res, loi.status, loi.detail, loi.errors);
    Object.assign(b, input);
    b.hlvTen = NHAN_VIEN.find((n) => n.id === b.hlvId)?.hoTen;
    b.locationName = LOCATIONS.find((l) => l.id === b.locationId)?.name;
    return json(res, 200, b);
  }

  if (seg[0] === 'dat-lich' && seg[1] === 'buoi' && seg[2] && seg[3] === 'huy' && m === 'PATCH') {
    if (RANK[me.role] < RANK.leader) return problem(res, 403, 'Không đủ quyền huỷ buổi.');
    const b = buoiCuaId(seg[2]);
    if (!b) return problem(res, 404, 'Không tìm thấy buổi.');
    b.daHuy = true;
    return json(res, 200, b);
  }

  if (seg[0] === 'dat-lich' && seg[1] === 'buoi' && seg[2] && seg[3] === 'giu-cho' && m === 'POST') {
    const b = buoiCuaId(seg[2]);
    if (!b) return problem(res, 404, 'Không tìm thấy buổi.');
    const { hoiVienId } = await body(req);
    if (b.daHuy) return problem(res, 409, 'Buổi đã huỷ.');
    if (b.ketThuc <= thoiDiemNay()) return problem(res, 409, 'Buổi đã kết thúc.');
    if (choConHieuLuc(b).some((c) => c.hoiVienId === hoiVienId)) {
      return problem(res, 409, 'Hội viên đã có chỗ trong buổi này.');
    }
    if (choConHieuLuc(b).length >= b.sucChua) return problem(res, 409, 'Buổi đã đầy.');
    const hv = HOI_VIEN.find((h) => h.id === hoiVienId);
    b.daDat.push({
      id: `c${seqBuoi++}`,
      hoiVienId,
      hoiVienTen: hv?.hoTen ?? hoiVienId,
      giuCho: true,
      /* Hạn giữ chỗ do BACKEND đặt, không do frontend — 15 phút. */
      giuChoDenLuc: congPhut(thoiDiemNay(), 15),
    });
    return json(res, 200, b);
  }

  if (seg[0] === 'dat-lich' && seg[1] === 'buoi' && seg[3] === 'cho' && seg[4] && seg[5] === 'chot' && m === 'POST') {
    const b = buoiCuaId(seg[2]);
    if (!b) return problem(res, 404, 'Không tìm thấy buổi.');
    const c = b.daDat.find((x) => x.id === seg[4]);
    if (!c) return problem(res, 404, 'Không tìm thấy chỗ.');
    c.giuCho = false;
    delete c.giuChoDenLuc;
    return json(res, 200, b);
  }

  if (seg[0] === 'dat-lich' && seg[1] === 'buoi' && seg[3] === 'cho' && seg[4] && !seg[5] && m === 'DELETE') {
    const b = buoiCuaId(seg[2]);
    if (!b) return problem(res, 404, 'Không tìm thấy buổi.');
    b.daDat = b.daDat.filter((x) => x.id !== seg[4]);
    return json(res, 200, b);
  }

  if (seg[0] === 'dat-lich' && seg[1] === 'buoi' && seg[2] && seg[3] === 'hang-cho' && !seg[4] && m === 'POST') {
    const b = buoiCuaId(seg[2]);
    if (!b) return problem(res, 404, 'Không tìm thấy buổi.');
    const { hoiVienId } = await body(req);
    if (b.hangCho.some((c) => c.hoiVienId === hoiVienId)) {
      return problem(res, 409, 'Hội viên đã ở trong hàng chờ.');
    }
    const hv = HOI_VIEN.find((h) => h.id === hoiVienId);
    b.hangCho.push({
      id: `w${seqBuoi++}`,
      hoiVienId,
      hoiVienTen: hv?.hoTen ?? hoiVienId,
      thuTu: b.hangCho.length + 1,
    });
    return json(res, 200, b);
  }

  if (seg[0] === 'dat-lich' && seg[1] === 'buoi' && seg[3] === 'hang-cho' && seg[4] && m === 'DELETE') {
    const b = buoiCuaId(seg[2]);
    if (!b) return problem(res, 404, 'Không tìm thấy buổi.');
    b.hangCho = b.hangCho.filter((x) => x.id !== seg[4]);
    /* Đánh lại số thứ tự — bỏ người thứ 1 mà giữ nguyên số thì hàng chờ bắt đầu
       từ 2, không ai hiểu. */
    b.hangCho.forEach((c, i) => {
      c.thuTu = i + 1;
    });
    return json(res, 200, b);
  }


  if (p === '/san-pham' && m === 'GET') return json(res, 200, paged(SAN_PHAM, url));
  if (p === '/khuyen-mai' && m === 'GET') return json(res, 200, KHUYEN_MAI);

  /* Sản phẩm: chi tiết, thêm, sửa, giá sàn, trạng thái. Trước đó mock chỉ có
     danh sách nên ngăn chi tiết luôn trả 404 mà không ai để ý. */
  if (seg[0] === 'san-pham' && seg[1] && !seg[2] && m === 'GET') {
    const sp = SAN_PHAM.find((x) => x.id === seg[1]);
    return sp ? json(res, 200, sp) : problem(res, 404, 'Không tìm thấy sản phẩm.');
  }

  if (p === '/san-pham' && m === 'POST') {
    if (RANK[me.role] < RANK.manager) {
      return problem(res, 403, 'Chỉ Quản lý CLB trở lên mới thêm được sản phẩm.');
    }
    const input = await body(req);
    const loi = {};
    if (!String(input.ten ?? '').trim()) loi.ten = ['Bắt buộc.'];
    if (!(Number(input.giaNiemYet) > 0)) loi.giaNiemYet = ['Phải lớn hơn 0.'];
    if (Object.keys(loi).length) return problem(res, 400, 'Dữ liệu chưa hợp lệ.', loi);

    const n = SAN_PHAM.length + 1;
    const sp = {
      id: `sp${n}`,
      maSanPham: `SP${String(n).padStart(4, '0')}`,
      ...input,
      locationName: LOCATIONS.find((l) => l.id === input.locationId)?.name,
      /* Giá sàn KHÔNG nhận từ form thêm — đặt sau qua endpoint riêng, đúng như
         dòng mô tả trên ngăn thêm. Mặc định 0 nghĩa là chưa đặt. */
      giaSan: 0,
      trangThai: 'dang-ban',
      ngayTao: todayIso(),
    };
    SAN_PHAM.push(sp);
    return json(res, 201, sp);
  }

  if (seg[0] === 'san-pham' && seg[1] && !seg[2] && m === 'PUT') {
    if (RANK[me.role] < RANK.manager) return problem(res, 403, 'Không đủ quyền sửa sản phẩm.');
    const sp = SAN_PHAM.find((x) => x.id === seg[1]);
    if (!sp) return problem(res, 404, 'Không tìm thấy sản phẩm.');
    Object.assign(sp, await body(req));
    sp.locationName = LOCATIONS.find((l) => l.id === sp.locationId)?.name;
    return json(res, 200, sp);
  }

  if (seg[0] === 'san-pham' && seg[1] && seg[2] === 'gia-san' && m === 'PATCH') {
    const sp = SAN_PHAM.find((x) => x.id === seg[1]);
    if (!sp) return problem(res, 404, 'Không tìm thấy sản phẩm.');
    /* Quyền `san-pham.gia-san` — Giám đốc trở lên. Frontend đã ẩn khối nhập,
       nhưng luật nằm ở đây. */
    if (RANK[me.role] < RANK.director) {
      return problem(res, 403, 'Chỉ Giám đốc trở lên đặt được giá sàn.');
    }
    const { giaSan } = await body(req);
    if (!(Number(giaSan) >= 0)) {
      return problem(res, 400, 'Giá sàn không hợp lệ.', { giaSan: ['Không được âm.'] });
    }
    if (Number(giaSan) > sp.giaNiemYet) {
      return problem(res, 400, 'Giá sàn cao hơn giá niêm yết.', {
        giaSan: ['Không được cao hơn giá niêm yết.'],
      });
    }
    sp.giaSan = Number(giaSan);
    return json(res, 200, sp);
  }

  if (seg[0] === 'san-pham' && seg[1] && seg[2] === 'trang-thai' && m === 'PATCH') {
    if (RANK[me.role] < RANK.manager) return problem(res, 403, 'Không đủ quyền đổi trạng thái.');
    const sp = SAN_PHAM.find((x) => x.id === seg[1]);
    if (!sp) return problem(res, 404, 'Không tìm thấy sản phẩm.');
    const { trangThai } = await body(req);
    if (!['dang-ban', 'ngung-ban'].includes(trangThai)) {
      return problem(res, 400, 'Trạng thái không hợp lệ.', { trangThai: ['Giá trị lạ.'] });
    }
    sp.trangThai = trangThai;
    return json(res, 200, sp);
  }

  // Khuyến mãi: thêm, sửa, bật tắt
  if (p === '/khuyen-mai' && m === 'POST') {
    if (RANK[me.role] < RANK.manager) return problem(res, 403, 'Không đủ quyền thêm khuyến mãi.');
    const input = await body(req);
    const loi = {};
    if (!String(input.ma ?? '').trim()) loi.ma = ['Bắt buộc.'];
    else if (KHUYEN_MAI.some((k) => k.ma === String(input.ma).toUpperCase())) {
      loi.ma = ['Mã này đã có chương trình khác dùng.'];
    }
    if (!String(input.ten ?? '').trim()) loi.ten = ['Bắt buộc.'];
    if (Object.keys(loi).length) return problem(res, 400, 'Dữ liệu chưa hợp lệ.', loi);
    const km = { id: `km${KHUYEN_MAI.length + 1}`, ...input, ma: String(input.ma).toUpperCase() };
    KHUYEN_MAI.push(km);
    return json(res, 201, km);
  }

  if (seg[0] === 'khuyen-mai' && seg[1] && !seg[2] && m === 'PUT') {
    if (RANK[me.role] < RANK.manager) return problem(res, 403, 'Không đủ quyền sửa khuyến mãi.');
    const km = KHUYEN_MAI.find((k) => k.id === seg[1]);
    if (!km) return problem(res, 404, 'Không tìm thấy khuyến mãi.');
    Object.assign(km, await body(req));
    return json(res, 200, km);
  }

  if (seg[0] === 'khuyen-mai' && seg[1] && seg[2] === 'kich-hoat' && m === 'PATCH') {
    if (RANK[me.role] < RANK.manager) return problem(res, 403, 'Không đủ quyền bật/tắt khuyến mãi.');
    const km = KHUYEN_MAI.find((k) => k.id === seg[1]);
    if (!km) return problem(res, 404, 'Không tìm thấy khuyến mãi.');
    const { kichHoat } = await body(req);
    km.kichHoat = Boolean(kichHoat);
    return json(res, 200, km);
  }


  /* Hợp đồng */
  if (p === '/hop-dong' && m === 'GET') {
    const q = (url.searchParams.get('search') ?? '').toLowerCase();
    const tt = url.searchParams.get('trangThai');
    const loc = url.searchParams.get('locationId');
    const ds = HOP_DONG.filter(
      (h) =>
        (!loc || h.locationId === loc) &&
        (!tt || h.trangThai === tt) &&
        (!q || h.maHopDong.toLowerCase().includes(q) || h.hoiVienTen.toLowerCase().includes(q)),
    );
    return json(res, 200, paged(ds, url));
  }

  if (p === '/hop-dong' && m === 'POST') {
    const input = await body(req);
    const duoiSan = input.dong.filter((d) => d.donGia < d.giaSan);
    if (duoiSan.length > 0) {
      return problem(res, 400, 'Có dòng bán dưới giá sàn.', {
        dong: [`${duoiSan.length} dòng dưới giá sàn.`],
      });
    }
    const hv = HOI_VIEN.find((h) => h.id === input.hoiVienId);
    if (!hv) return problem(res, 400, 'Hội viên không tồn tại.', { hoiVienId: ['Không tìm thấy hội viên.'] });
    seq += 1;
    const hd = {
      id: `hd${seq}`,
      maHopDong: `HD${String(seq).padStart(4, '0')}`,
      hoiVienId: hv.id,
      hoiVienTen: hv.hoTen,
      hoiVienSdt: hv.soDienThoai,
      locationId: input.locationId,
      locationName: LOCATIONS.find((l) => l.id === input.locationId)?.name,
      nguoiLapId: me.id,
      nguoiLapTen: me.fullName,
      dong: input.dong,
      khuyenMai: input.khuyenMai,
      thanhToan: [],
      trangThai: 'bao-gia',
      ngayLap: todayIso(),
      ngayBatDau: input.ngayBatDau,
      ngayKetThuc: input.ngayKetThuc,
      ghiChu: input.ghiChu,
      lichSu: [{ trangThai: 'bao-gia', luc: nowIso(), nguoiId: me.id, nguoiTen: me.fullName }],
    };
    HOP_DONG.unshift(hd);
    return json(res, 201, hd);
  }

  if (seg[0] === 'hop-dong' && seg[1]) {
    const hd = HOP_DONG.find((h) => h.id === seg[1]);
    if (!hd) return problem(res, 404, 'Không tìm thấy hợp đồng.');

    if (seg.length === 2 && m === 'GET') return json(res, 200, hd);

    if (seg.length === 2 && m === 'PUT') {
      if (hd.trangThai !== 'bao-gia') return problem(res, 409, 'Chỉ sửa được khi còn là báo giá.');
      const input = await body(req);
      Object.assign(hd, {
        dong: input.dong,
        khuyenMai: input.khuyenMai,
        ngayBatDau: input.ngayBatDau,
        ngayKetThuc: input.ngayKetThuc,
        ghiChu: input.ghiChu,
      });
      return json(res, 200, hd);
    }

    if (seg[2] === 'chuyen-trang-thai' && m === 'POST') {
      const { den, ghiChu, chuKy } = await body(req);
      if (!CHUYEN_TIEP[hd.trangThai]?.includes(den)) {
        return problem(res, 409, `Không chuyển được từ ${hd.trangThai} sang ${den}.`);
      }
      if (RANK[me.role] < QUYEN[den]) return problem(res, 403, 'Không đủ quyền cho bước này.');
      if ((den === 'cho-xac-minh' || den === 'da-phat-hanh') && conPhaiThu(hd) > 0) {
        return problem(res, 409, `Chưa thu đủ — còn ${conPhaiThu(hd)} ₫.`);
      }
      if (den === 'da-phat-hanh' && me.id === hd.nguoiLapId) {
        return problem(res, 403, 'Người lập không được tự xác minh hợp đồng của mình.');
      }
      if (den === 'dang-hieu-luc' && !hd.ngayBatDau) {
        return problem(res, 409, 'Thiếu ngày bắt đầu hiệu lực.');
      }
      /* Chữ ký tay chỉ có nghĩa ở bước ký, và phải là ảnh PNG NHÚNG — một
         đường dẫn là chữ ký có thể chết hoặc bị thay sau khi hợp đồng đã ký.
         Backend .NET thật cũng phải kiểm đúng chỗ này.

         Kiểm xong hết rồi mới động vào hd. Đặt hai cửa này sau
         hd.trangThai = den thì hợp đồng đã sang trạng thái mới trước khi trả
         400: người dùng thấy lỗi mà chứng từ đã đi tiếp. */
      if (chuKy !== undefined && den !== 'da-ky') {
        return problem(res, 400, 'Chữ ký chỉ gửi kèm ở bước ký.', {
          chuKy: ['Chỉ hợp lệ khi den = da-ky.'],
        });
      }
      if (chuKy !== undefined && !String(chuKy).startsWith('data:image/png;base64,')) {
        return problem(res, 400, 'Chữ ký phải là ảnh PNG nhúng.', {
          chuKy: ['Phải là data URL image/png.'],
        });
      }

      hd.trangThai = den;
      if (den === 'da-phat-hanh') {
        hd.ngayPhatHanh = todayIso();
        hd.nguoiXacMinhId = me.id;
        hd.nguoiXacMinhTen = me.fullName;
      }
      /* Ký giấy (không kèm ảnh) vẫn đi tiếp được — xem `KyHopDongForm`. */
      if (den === 'da-ky') {
        hd.ngayKy = todayIso();
        if (chuKy) hd.chuKy = { anh: chuKy, luc: nowIso(), nguoiKyTen: hd.hoiVienTen };
      }
      hd.lichSu.push({ trangThai: den, luc: nowIso(), nguoiId: me.id, nguoiTen: me.fullName, ghiChu });
      return json(res, 200, hd);
    }

    if (seg[2] === 'thanh-toan' && m === 'POST') {
      const { soTien, phuongThuc, ghiChu } = await body(req);
      if (hd.trangThai !== 'cho-thu-tien') return problem(res, 409, 'Hợp đồng không ở bước thu tiền.');
      if (!(soTien > 0)) return problem(res, 400, 'Số tiền không hợp lệ.', { soTien: ['Phải lớn hơn 0.'] });
      if (soTien > conPhaiThu(hd)) {
        return problem(res, 400, 'Vượt quá số còn phải thu.', { soTien: ['Vượt quá số còn phải thu.'] });
      }
      hd.thanhToan.push({
        id: `tt${hd.thanhToan.length + 1}-${hd.id}`,
        soTien,
        phuongThuc,
        luc: nowIso(),
        nguoiThuId: me.id,
        nguoiThuTen: me.fullName,
        ghiChu,
        daHuy: false,
      });
      return json(res, 200, hd);
    }
  }

  // Bán vé ngày tại quầy

  if (seg[0] === 'ban-hang-quay') {
    /* Ca đang mở CỦA CHÍNH NGƯỜI ĐĂNG NHẬP tại CLB này. Hai thu ngân cùng CLB
       mỗi người một ca riêng — đó là điều kiện để đối soát cuối ca có nghĩa. */
    if (seg[1] === 'ca-dang-mo' && m === 'GET') {
      const loc = url.searchParams.get('locationId');
      const ca = CA_QUAY.find(
        (c) => c.trangThai === 'dang-mo' && c.locationId === loc && c.thuNganId === me.id,
      );
      return json(res, 200, ca ?? null);
    }

    if (seg[1] === 'hang' && m === 'GET') {
      return json(res, 200, HANG_QUAY);
    }

    /* Chốt ngày: khoá một ngày làm việc của một CLB sau khi nhân viên xác
       nhận bản tổng kết. Thu ngân làm được, đây là ngày của chính họ. */
    if (seg[1] === 'chot-ngay' && m === 'POST') {
      const { ngay, locationId, ghiChu } = await body(req);
      if (!me.allLocations && !me.locations.some((l) => l.id === locationId)) {
        return problem(res, 403, 'Bạn không phụ trách CLB này.');
      }
      if (CHOT_NGAY.some((c) => c.ngay === ngay && c.locationId === locationId)) {
        return problem(res, 409, 'Ngày này đã chốt rồi.');
      }
      const caTrongNgay = CA_QUAY.filter(
        (c) => c.locationId === locationId && ngayLamViecCua(c.moLuc) === ngay,
      );
      if (caTrongNgay.length === 0) {
        return problem(res, 409, 'Ngày này không có ca nào để chốt.');
      }
      /* CÒN CA ĐANG MỞ THÌ KHÔNG CHỐT. Chốt một con số sẽ đổi ngay sau đó còn
         tệ hơn không chốt — nó tạo cảm giác đã xong. */
      if (caTrongNgay.some((c) => c.trangThai === 'dang-mo')) {
        return problem(res, 409, 'Còn ca chưa đóng — đóng hết ca rồi mới chốt ngày được.');
      }
      const ban = {
        id: `cn${CHOT_NGAY.length + 1}`,
        ngay,
        locationId,
        locationName: LOCATIONS.find((l) => l.id === locationId)?.name,
        chotLuc: nowIso(),
        nguoiChotId: me.id,
        nguoiChotTen: me.fullName,
        ghiChu: ghiChu || undefined,
      };
      CHOT_NGAY.push(ban);
      return json(res, 201, ban);
    }

    /* Một ngày làm việc: mọi ca trong ngày tại một CLB kèm trạng thái chốt.
       Thu ngân xem được ngày của CLB mình, vì họ phải nhìn cả chuỗi bàn giao
       mới xác nhận được, kể cả ca của người trực ca kia. */
    if (seg[1] === 'ngay' && m === 'GET') {
      const ngay = url.searchParams.get('ngay');
      const locationId = url.searchParams.get('locationId');
      if (!me.allLocations && !me.locations.some((l) => l.id === locationId)) {
        return problem(res, 403, 'Bạn không phụ trách CLB này.');
      }
      return json(res, 200, {
        ngay,
        locationId,
        ca: CA_QUAY.filter(
          (c) => c.locationId === locationId && ngayLamViecCua(c.moLuc) === ngay,
        ).sort((a, b) => (a.moLuc < b.moLuc ? -1 : 1)),
        chotNgay:
          CHOT_NGAY.find((c) => c.ngay === ngay && c.locationId === locationId) ?? null,
      });
    }

    /* Giám sát: danh sách ca của mọi thu ngân, kể cả ca đã đóng.

       Quyền chặn ở đây chứ không phải ở frontend: thu ngân (staff) gọi vào là
       403, và người không có cờ toàn hệ thống chỉ thấy CLB mình được giao kể cả
       khi tự sửa tham số locationId trên URL. */
    if (seg[1] === 'ca' && !seg[2] && m === 'GET') {
      if (RANK[me.role] < RANK.leader) {
        return problem(res, 403, 'Bạn không có quyền xem ca của người khác.');
      }
      const clbCuaToi = new Set(me.locations.map((l) => l.id));
      const tuNgay = url.searchParams.get('tuNgay');
      const denNgay = url.searchParams.get('denNgay');
      const locationId = url.searchParams.get('locationId');
      const thuNganId = url.searchParams.get('thuNganId');
      const trangThai = url.searchParams.get('trangThai');

      const ra = CA_QUAY.filter((c) => {
        if (!me.allLocations && !clbCuaToi.has(c.locationId)) return false;
        const ngayMo = c.moLuc.slice(0, 10);
        if (tuNgay && ngayMo < tuNgay) return false;
        if (denNgay && ngayMo > denNgay) return false;
        if (locationId && c.locationId !== locationId) return false;
        if (thuNganId && c.thuNganId !== thuNganId) return false;
        if (trangThai && c.trangThai !== trangThai) return false;
        return true;
      }).sort((a, b) => (a.moLuc < b.moLuc ? 1 : -1));

      return json(res, 200, ra);
    }

    if (seg[1] === 'ca' && seg[2] && !seg[3] && m === 'GET') {
      if (RANK[me.role] < RANK.leader) {
        return problem(res, 403, 'Bạn không có quyền xem ca của người khác.');
      }
      const ca = CA_QUAY.find((c) => c.id === seg[2]);
      if (!ca) return problem(res, 404, 'Không tìm thấy ca.');
      if (!me.allLocations && !me.locations.some((l) => l.id === ca.locationId)) {
        return problem(res, 403, 'Ca này thuộc CLB bạn không phụ trách.');
      }
      return json(res, 200, ca);
    }

    if (seg[1] === 'ca' && !seg[2] && m === 'POST') {
      const { locationId, tienDauCa } = await body(req);
      if (!LOCATIONS.some((l) => l.id === locationId)) {
        return problem(res, 400, 'CLB không hợp lệ.', { locationId: ['Không có CLB này.'] });
      }
      if (!(tienDauCa >= 0)) {
        return problem(res, 400, 'Tiền đầu ca không hợp lệ.', {
          tienDauCa: ['Phải từ 0 trở lên.'],
        });
      }
      /* Một người chỉ được mở MỘT ca tại một thời điểm — mở ca chồng nhau là
         tiền của ca này rơi vào đối soát của ca kia. */
      if (CA_QUAY.some((c) => c.trangThai === 'dang-mo' && c.thuNganId === me.id)) {
        return problem(res, 409, 'Bạn đang có một ca chưa đóng.');
      }
      /* Ngày đã chốt thì không mở thêm ca — chốt xong mà vẫn ghi thêm được là
         bản xác nhận của nhân viên chẳng còn nghĩa gì. */
      if (CHOT_NGAY.some((c) => c.ngay === ngayLamViecCua(nowIso()) && c.locationId === locationId)) {
        return problem(res, 409, 'Ngày làm việc này đã chốt.');
      }
      const ca = {
        id: `ca${CA_QUAY.length + 1}`,
        maCa: `CA${String(CA_QUAY.length + 1).padStart(3, '0')}`,
        thuNganId: me.id,
        thuNganTen: me.fullName,
        locationId,
        locationName: LOCATIONS.find((l) => l.id === locationId)?.name,
        moLuc: nowIso(),
        tienDauCa,
        trangThai: 'dang-mo',
        giaoDich: [],
      };
      CA_QUAY.push(ca);
      return json(res, 201, ca);
    }

    if (seg[1] === 'ca' && seg[2]) {
      const ca = CA_QUAY.find((c) => c.id === seg[2]);
      if (!ca) return problem(res, 404, 'Không tìm thấy ca.');

      /* Chuyển ca: chốt ca đang chạy rồi mở ngay ca kế tiếp, một thao tác.

         Không nhận tienDauCa — tiền đầu ca sau là tiền đếm của ca trước, do
         chính chỗ này gán. Cho client gõ là dựng lại đúng lỗ hổng mà cơ chế này
         sinh ra để bịt: hai con số do hai người gõ độc lập thì tiền bốc hơi ở
         khớp nối mà không ca nào sai cả.

         Áp nguyên luật của đóng ca: lệch thì phải ghi lý do. Thiếu là mở một
         đường vòng — cứ bấm "chuyển ca" thay vì "đóng ca" là thoát được yêu cầu
         giải thích. */
      if (seg[3] === 'chuyen-ca' && m === 'POST') {
        const { tienDemCuoiCa, ghiChu } = await body(req);
        if (ca.trangThai === 'da-dong') return problem(res, 409, 'Ca đã đóng rồi.');
        if (!(tienDemCuoiCa >= 0)) {
          return problem(res, 400, 'Tiền đếm cuối ca không hợp lệ.', {
            tienDemCuoiCa: ['Phải từ 0 trở lên.'],
          });
        }
        if (tienDemCuoiCa !== tienMatKyVongCua(ca) && !String(ghiChu ?? '').trim()) {
          return problem(res, 400, 'Lệch két thì phải ghi lý do.', {
            ghiChu: ['Bắt buộc khi tiền đếm được khác tiền kỳ vọng.'],
          });
        }
        const kHienTai = khungCua(ca.moLuc);
        const i = kHienTai ? KHUNG_CA.findIndex((k) => k.id === kHienTai.id) : -1;
        const keTiep = i >= 0 ? KHUNG_CA[i + 1] : undefined;
        if (!keTiep) {
          return problem(res, 409, 'Đây là ca cuối trong ngày — dùng Chốt ngày.');
        }
        if (CHOT_NGAY.some((c) => c.ngay === ngayLamViecCua(ca.moLuc) && c.locationId === ca.locationId)) {
          return problem(res, 409, 'Ngày này đã chốt — không mở thêm ca được.');
        }

        ca.trangThai = 'da-dong';
        ca.dongLuc = nowIso();
        ca.tienDemCuoiCa = tienDemCuoiCa;
        ca.ghiChuDongCa = ghiChu;

        const caMoi = {
          id: `ca${CA_QUAY.length + 1}`,
          maCa: `CA${String(CA_QUAY.length + 1).padStart(3, '0')}`,
          thuNganId: me.id,
          thuNganTen: me.fullName,
          locationId: ca.locationId,
          locationName: ca.locationName,
          moLuc: nowIso(),
          /* ĐÂY: nối cứng vào tiền đếm của ca trước. */
          tienDauCa: tienDemCuoiCa,
          trangThai: 'dang-mo',
          giaoDich: [],
        };
        CA_QUAY.push(caMoi);
        return json(res, 200, { caDaDong: ca, caMoi });
      }

      if (seg[3] === 'dong' && m === 'POST') {
        const { tienDemCuoiCa, ghiChu } = await body(req);
        if (ca.trangThai === 'da-dong') return problem(res, 409, 'Ca đã đóng rồi.');
        if (!(tienDemCuoiCa >= 0)) {
          return problem(res, 400, 'Tiền đếm cuối ca không hợp lệ.', {
            tienDemCuoiCa: ['Phải từ 0 trở lên.'],
          });
        }
        /* LỆCH KÉT THÌ BẮT BUỘC GHI LÝ DO — luật ở backend, không phải ở nút.

           Trước đây chỉ `DoiSoatCa.tsx` chặn, nên gọi thẳng API là đóng được ca
           lệch mà không giải thích một chữ. Màn Giám sát ca dựa vào đúng dữ liệu
           này để chỉ ra "lệch không ai giải thích", nên lỗ hổng ấy làm hỏng cả
           màn giám sát. Xem `features/ban-hang-quay/quay.ts`. */
        const kyVong = tienMatKyVongCua(ca);
        if (tienDemCuoiCa !== kyVong && !String(ghiChu ?? '').trim()) {
          return problem(res, 400, 'Lệch két thì phải ghi lý do.', {
            ghiChu: ['Bắt buộc khi tiền đếm được khác tiền kỳ vọng.'],
          });
        }
        ca.trangThai = 'da-dong';
        ca.dongLuc = nowIso();
        ca.tienDemCuoiCa = tienDemCuoiCa;
        ca.ghiChuDongCa = ghiChu;
        return json(res, 200, ca);
      }

      if (seg[3] === 'giao-dich' && !seg[4] && m === 'POST') {
        const { dong, phuongThuc, khachTen, khachSdt } = await body(req);
        if (ca.trangThai === 'da-dong') return problem(res, 409, 'Ca đã đóng.');
        if (!Array.isArray(dong) || dong.length === 0) {
          return problem(res, 400, 'Giỏ hàng trống.', { dong: ['Chưa có món nào.'] });
        }
        if (dong.some((d) => !(d.soLuong >= 1))) {
          return problem(res, 400, 'Số lượng không hợp lệ.', {
            dong: ['Số lượng phải từ 1 trở lên.'],
          });
        }
        const gd = {
          id: `gd${ca.giaoDich.length + 1}-${ca.id}`,
          maGiaoDich: `GD${String(ca.giaoDich.length + 1).padStart(4, '0')}`,
          dong,
          tongTien: dong.reduce((t, d) => t + d.donGia * d.soLuong, 0),
          phuongThuc,
          khachTen: khachTen || undefined,
          khachSdt: khachSdt || undefined,
          luc: nowIso(),
          daHuy: false,
        };
        ca.giaoDich.push(gd);
        return json(res, 201, gd);
      }

      if (seg[3] === 'giao-dich' && seg[4] && seg[5] === 'huy' && m === 'PATCH') {
        const { lyDo } = await body(req);
        const gd = ca.giaoDich.find((g) => g.id === seg[4]);
        if (!gd) return problem(res, 404, 'Không tìm thấy giao dịch.');
        if (gd.daHuy) return problem(res, 409, 'Giao dịch đã huỷ rồi.');
        if (!String(lyDo ?? '').trim()) {
          return problem(res, 400, 'Phải ghi lý do huỷ.', { lyDo: ['Bắt buộc.'] });
        }
        /* Bút toán đảo: giữ nguyên dòng, gắn cờ, không xoá. */
        gd.daHuy = true;
        gd.lyDoHuy = lyDo;
        return json(res, 200, gd);
      }
    }
  }

  // Dashboard

  if (seg[0] === 'tong-quan') {
    const tu = url.searchParams.get('tuNgay') ?? '0000-01-01';
    const den = url.searchParams.get('denNgay') ?? '9999-12-31';
    const loc = url.searchParams.get('locationId');
    const trongClb = (h) => !loc || h.locationId === loc;
    const trongKy = (ngay) => !!ngay && ngay >= tu && ngay <= den;
    const dsHd = HOP_DONG.filter(trongClb);
    /* Phiếu thu còn hiệu lực, kèm ngày (chuỗi 'YYYY-MM-DDTHH:mm' → cắt 10 ký tự). */
    const phieuThu = dsHd.flatMap((h) =>
      h.thanhToan.filter((t) => !t.daHuy).map((t) => ({ ...t, ngay: t.luc.slice(0, 10), hd: h })),
    );

    if (seg[1] === 'tom-tat') {
      const thuTrongKy = phieuThu.filter((t) => trongKy(t.ngay));
      return json(res, 200, {
        doanhThu: thuTrongKy.reduce((s, t) => s + t.soTien, 0),
        soHopDong: dsHd.filter((h) => trongKy(h.ngayPhatHanh)).length,
        hoiVienMoi: HOI_VIEN.filter(
          (h) => (!loc || h.locationId === loc) && trongKy(h.ngayThamGia),
        ).length,
        soBuoiTap: thuTrongKy.length * 3,
        doanhThuQuay: thuTrongKy
          .filter((t) => t.phuongThuc === 'tien-mat')
          .reduce((s, t) => s + t.soTien, 0),
        congNo: dsHd
          .filter((h) => h.trangThai !== 'da-huy')
          .reduce((s, h) => s + conPhaiThu(h), 0),
      });
    }

    if (seg[1] === 'doanh-thu') {
      /* Cố ý trả THƯA: chỉ những ngày có phát sinh. Frontend phải tự điền 0. */
      const theoNgay = new Map();
      for (const t of phieuThu.filter((x) => trongKy(x.ngay))) {
        const cu = theoNgay.get(t.ngay) ?? { ngay: t.ngay, doanhThu: 0, soGiaoDich: 0 };
        cu.doanhThu += t.soTien;
        cu.soGiaoDich += 1;
        theoNgay.set(t.ngay, cu);
      }
      return json(res, 200, [...theoNgay.values()].sort((a, b) => (a.ngay < b.ngay ? -1 : 1)));
    }

    if (seg[1] === 'top-san-pham') {
      const gioiHan = Number(url.searchParams.get('gioiHan') ?? 5);
      const theoSp = new Map();
      for (const h of dsHd.filter((x) => x.thanhToan.some((t) => !t.daHuy && trongKy(t.luc.slice(0, 10))))) {
        for (const d of h.dong) {
          const cu = theoSp.get(d.sanPhamId) ?? {
            sanPhamId: d.sanPhamId,
            ten: d.ten,
            soLuong: 0,
            doanhThu: 0,
          };
          cu.soLuong += d.soLuong;
          cu.doanhThu += d.donGia * d.soLuong;
          theoSp.set(d.sanPhamId, cu);
        }
      }
      return json(
        res,
        200,
        [...theoSp.values()].sort((a, b) => b.doanhThu - a.doanhThu).slice(0, gioiHan),
      );
    }

    if (seg[1] === 'hom-nay') {
      return json(res, 200, {
        soBuoiHomNay: 12,
        soBuoiConCho: 4,
        hopDongChoThuTien: dsHd.filter((h) => h.trangThai === 'cho-thu-tien').length,
        hopDongChoXacMinh: dsHd.filter((h) => h.trangThai === 'cho-xac-minh').length,
        caQuayDangMo: loc ? false : null,
      });
    }
  }

  problem(res, 404, `Mock chưa có endpoint ${m} ${p}.`);
});

/* Ca quầy dựng sẵn để diễn tập màn giám sát.

   Dựng theo đúng cách CLB đang vận hành: lễ tân chia 2 ca một ngày trên cùng
   một két, ca sau nhận tiền từ ca trước. Bảy ca dưới đây phủ những tình huống
   màn giám sát phải phân biệt được, mỗi ca ghi rõ nó dựng cho dấu hiệu nào.
   Số liệu tính tay, khớp với src/features/ban-hang-quay/khungCa.ts.

   Ca sáng 06:00–14:00, ca chiều 14:00–22:00. */

/** Tiền mặt lẽ ra phải có trong két — dùng cho cả seed lẫn luật đóng ca. */
function tienMatKyVongCua(ca) {
  return (
    ca.tienDauCa +
    ca.giaoDich
      .filter((g) => !g.daHuy && g.phuongThuc === 'tien-mat')
      .reduce((t, g) => t + g.tongTien, 0)
  );
}

(function seedCaQuay() {
  const homNay = todayIso();
  const homQua = congNgay(homNay, -1);
  const homKia = congNgay(homNay, -2);
  let n = 0;
  const gd = (ngay, gio, tien, phuongThuc, daHuy = false) => {
    n += 1;
    return {
      id: `gd-seed-${n}`,
      maGiaoDich: `GD${String(9000 + n)}`,
      dong: [{ sanPhamId: 'hq1', ten: 'Vé ngày người lớn', donGia: tien, soLuong: 1 }],
      tongTien: tien,
      phuongThuc,
      luc: `${ngay}T${gio}`,
      daHuy,
      ...(daHuy ? { lyDoHuy: 'Khách đổi ý, đã hoàn tiền.' } : {}),
    };
  };
  const ca = (o) => ({ locationName: LOCATIONS.find((l) => l.id === o.locationId)?.name, ...o });

  CA_QUAY.push(
    /* Hôm kia, Q1 — kịch bản quan trọng nhất: tiền bốc hơi giữa hai ca.

       Ca sáng đếm 800.000 và khớp két của nó; ca chiều khai đầu ca 600.000,
       cuối ca cũng khớp két của nó. Không ca nào sai mà 200.000 đã biến mất ở
       khớp nối. Đối soát từng ca riêng lẻ không thấy, chỉ chuỗi bàn giao mới
       thấy. */
    ca({
      id: 'ca-seed-1', maCa: 'CA901', thuNganId: 'u-sale', thuNganTen: 'Trần Sales',
      locationId: 'q1',
      moLuc: `${homKia}T06:00`, dongLuc: `${homKia}T14:00`,
      tienDauCa: 500_000, tienDemCuoiCa: 800_000, ghiChuDongCa: '', trangThai: 'da-dong',
      /* tiền mặt 300.000 → kỳ vọng 800.000, đếm 800.000 → khớp */
      giaoDich: [gd(homKia, '08:20', 300_000, 'tien-mat'), gd(homKia, '11:40', 250_000, 'chuyen-khoan')],
    }),
    ca({
      id: 'ca-seed-2', maCa: 'CA902', thuNganId: 'u-ketoan', thuNganTen: 'Lê Kế Toán',
      locationId: 'q1',
      moLuc: `${homKia}T14:00`, dongLuc: `${homKia}T22:00`,
      /* nhận 600.000 trong khi ca trước bàn giao 800.000 → lệch bàn giao −200.000 */
      tienDauCa: 600_000, tienDemCuoiCa: 780_000, ghiChuDongCa: '', trangThai: 'da-dong',
      /* tiền mặt 180.000 → kỳ vọng 780.000, đếm 780.000 → ca này cũng khớp */
      giaoDich: [gd(homKia, '16:10', 180_000, 'tien-mat'), gd(homKia, '19:00', 120_000, 'the')],
    }),

    /* Hôm qua, Q1 — bàn giao khớp nhưng ca chiều lệch két không lý do. */
    ca({
      id: 'ca-seed-3', maCa: 'CA903', thuNganId: 'u-sale', thuNganTen: 'Trần Sales',
      locationId: 'q1',
      moLuc: `${homQua}T06:00`, dongLuc: `${homQua}T14:00`,
      tienDauCa: 500_000, tienDemCuoiCa: 900_000,
      ghiChuDongCa: '', trangThai: 'da-dong',
      /* tiền mặt 400.000 → kỳ vọng 900.000, đếm 900.000 → khớp */
      giaoDich: [gd(homQua, '08:00', 150_000, 'tien-mat'), gd(homQua, '10:30', 250_000, 'tien-mat'), gd(homQua, '12:00', 300_000, 'chuyen-khoan')],
    }),
    ca({
      id: 'ca-seed-4', maCa: 'CA904', thuNganId: 'u-ketoan', thuNganTen: 'Lê Kế Toán',
      locationId: 'q1',
      moLuc: `${homQua}T14:00`, dongLuc: `${homQua}T22:00`,
      /* nhận đúng 900.000 nên bàn giao khớp, nhưng cuối ca thiếu 120.000 mà
         không ghi chữ nào → lệch không ai giải thích, và là lệch lớn */
      tienDauCa: 900_000, tienDemCuoiCa: 1_130_000, trangThai: 'da-dong',
      /* tiền mặt 350.000 → kỳ vọng 1.250.000, đếm 1.130.000 → thiếu 120.000 */
      giaoDich: [gd(homQua, '15:20', 150_000, 'tien-mat'), gd(homQua, '18:45', 200_000, 'tien-mat'), gd(homQua, '20:00', 180_000, 'the')],
    }),

    /* Hôm qua, Q7 — ca chiều không ai mở ca. Chỉ có ca sáng, cả buổi chiều
       két không có người chịu trách nhiệm; danh sách ca không nói được điều đó
       vì nó chỉ liệt kê ca đã có. */
    ca({
      id: 'ca-seed-5', maCa: 'CA905', thuNganId: 'u-ketoan', thuNganTen: 'Lê Kế Toán',
      locationId: 'q7',
      moLuc: `${homQua}T08:00`, dongLuc: `${homQua}T13:30`,
      tienDauCa: 200_000, tienDemCuoiCa: 430_000,
      ghiChuDongCa: 'Khách bo 30k cho lễ tân, đã báo quản lý CLB.', trangThai: 'da-dong',
      /* tiền mặt 200.000 → kỳ vọng 400.000, đếm 430.000 → thừa 30.000, có lý do */
      giaoDich: [gd(homQua, '09:15', 200_000, 'tien-mat'), gd(homQua, '11:00', 250_000, 'chuyen-khoan')],
    }),

    /* Hôm qua, Q7, ca đêm ngoài khung 2 ca — huỷ nhiều bất thường. Khớp két
       hoàn hảo nhưng ba phiếu bị huỷ, đúng mẫu gian lận mà đối soát tiền không
       nhìn thấy. Mở 22:30 nên với khung 2 ca là ngoài khung; chuyển sang 3 ca
       thì nó vào đúng ca đêm. */
    ca({
      id: 'ca-seed-6', maCa: 'CA906', thuNganId: 'u-sale', thuNganTen: 'Trần Sales',
      locationId: 'q7',
      moLuc: `${homQua}T22:30`, dongLuc: `${homNay}T02:00`,
      tienDauCa: 100_000, tienDemCuoiCa: 250_000, ghiChuDongCa: '', trangThai: 'da-dong',
      /* tiền mặt còn hiệu lực 150.000 → kỳ vọng 250.000, đếm 250.000 → khớp */
      giaoDich: [
        gd(homQua, '22:40', 150_000, 'tien-mat'),
        gd(homQua, '23:20', 150_000, 'tien-mat', true),
        gd(homNay, '00:10', 100_000, 'tien-mat', true),
        gd(homNay, '01:35', 200_000, 'tien-mat', true),
      ],
    }),

    /* Hôm nay, Q1 — ca sáng đang mở, chưa đối soát. */
    ca({
      id: 'ca-seed-7', maCa: 'CA907', thuNganId: 'u-sale', thuNganTen: 'Trần Sales',
      locationId: 'q1',
      moLuc: `${homNay}T06:15`,
      tienDauCa: 400_000, trangThai: 'dang-mo',
      giaoDich: [gd(homNay, '07:20', 120_000, 'tien-mat'), gd(homNay, '09:05', 90_000, 'chuyen-khoan')],
    }),
  );
})();

server.listen(PORT, () => console.log(`mock .NET nghe ở http://localhost:${PORT}`));
