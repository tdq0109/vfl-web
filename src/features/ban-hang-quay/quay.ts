import type { Vnd } from '@/lib/api/types';
import { VAO_KET, type CaThuNgan, type DongHang, type GiaoDich, type PhuongThuc } from './types';

/* Tính tiền tại quầy — HÀM THUẦN, không import React.

   ⚠ BA HÀM TRẢ VỀ KHOÁ i18n, KHÔNG PHẢI CÂU TIẾNG VIỆT — `moTaChenhLech` ·
   `viSaoKhongBanDuoc` · `viSaoKhongDongDuocCa`. Màn gọi `t(khoa)` để lấy chữ.
   Không gọi `t()` ngay tại đây: hàm thuần không có ngôn ngữ hiện hành để mà tra.
   Cùng cách làm với `san-pham/gia.ts` và `dat-lich/lich.ts`.

   `null` vẫn giữ nghĩa "không có lỗi"; mọi khoá trả ra ở đây phải có thật
   đều có thật trong từ điển.

   Đây là chỗ tiền mặt thật đi qua tay người. Sai một phép tính ở đây là cuối ca
   thu ngân phải bù tiền túi, hoặc tiền thất thoát mà không ai biết.

   ⚠ HAI CÁI BẪY, đừng gỡ cái nào khi sửa hàm này:

   1. CHỈ TIỀN MẶT VÀO KÉT. Chuyển khoản và quẹt thẻ vào tài khoản ngân hàng.
      Cộng chúng vào tiền mặt kỳ vọng thì ca nào cũng báo "thiếu tiền" đúng bằng
      doanh thu không tiền mặt — và thu ngân bị nghi oan.
   2. GIAO DỊCH ĐÃ HUỶ KHÔNG TÍNH VÀO BẤT KỲ TỔNG NÀO. Quên lọc thì huỷ xong
      vẫn đòi thu ngân số tiền đã trả lại cho khách. */

/** Thành tiền một dòng hàng. */
export function thanhTien(dong: Pick<DongHang, 'donGia' | 'soLuong'>): Vnd {
  return dong.donGia * dong.soLuong;
}

/** Tổng tiền giỏ hàng. */
export function tongGioHang(dong: readonly DongHang[]): Vnd {
  return dong.reduce((tong, d) => tong + thanhTien(d), 0);
}

/** Số món trong giỏ (cộng dồn số lượng). */
export function soMon(dong: readonly DongHang[]): number {
  return dong.reduce((n, d) => n + d.soLuong, 0);
}

/** Giao dịch còn hiệu lực — đã huỷ thì không tính vào đâu cả. */
export function giaoDichConHieuLuc(giaoDich: readonly GiaoDich[]): GiaoDich[] {
  return giaoDich.filter((g) => !g.daHuy);
}

/** Doanh thu theo một phương thức thanh toán. */
export function doanhThuTheoPhuongThuc(
  giaoDich: readonly GiaoDich[],
  phuongThuc: PhuongThuc,
): Vnd {
  return giaoDichConHieuLuc(giaoDich)
    .filter((g) => g.phuongThuc === phuongThuc)
    .reduce((tong, g) => tong + g.tongTien, 0);
}

/** Tổng doanh thu mọi phương thức. */
export function doanhThuCa(ca: Pick<CaThuNgan, 'giaoDich'>): Vnd {
  return giaoDichConHieuLuc(ca.giaoDich).reduce((tong, g) => tong + g.tongTien, 0);
}

/** Tiền mặt thu trong ca — CHỈ các phương thức vào két. */
export function tienMatThuTrongCa(ca: Pick<CaThuNgan, 'giaoDich'>): Vnd {
  return giaoDichConHieuLuc(ca.giaoDich)
    .filter((g) => VAO_KET[g.phuongThuc])
    .reduce((tong, g) => tong + g.tongTien, 0);
}

/** Tiền mặt LẼ RA phải có trong két cuối ca = tiền đầu ca + tiền mặt thu được. */
export function tienMatKyVong(ca: Pick<CaThuNgan, 'tienDauCa' | 'giaoDich'>): Vnd {
  return ca.tienDauCa + tienMatThuTrongCa(ca);
}

/** Chênh lệch giữa tiền đếm được và tiền kỳ vọng.
    Dương = thừa, âm = THIẾU, 0 = khớp. */
export function chenhLech(demDuoc: Vnd, kyVong: Vnd): number {
  return demDuoc - kyVong;
}

export type LoaiChenhLech = 'khop' | 'thua' | 'thieu';

export function loaiChenhLech(lech: number): LoaiChenhLech {
  if (lech === 0) return 'khop';
  return lech > 0 ? 'thua' : 'thieu';
}

/** KHOÁ i18n mô tả chênh lệch cho người vận hành đọc.

    Trả KHOÁ, còn SỐ TIỀN thì màn tự truyền: `t(khoa, { soTien: money(Math.abs(lech)) })`.
    Phép chọn khớp/thừa/thiếu VẪN Ở ĐÂY vì nó là quy tắc có test, chỉ có chữ đi
    ra ngoài — cùng cách với `dat-lich/lich.ts::moTaTrungLich()`. Khoá "khớp"
    không có chỗ trống nên truyền thừa `soTien` cũng vô hại. */
export function moTaChenhLech(lech: number): string {
  if (lech === 0) return 'quay.khopKet';
  return lech > 0 ? 'quay.thua' : 'quay.thieu';
}

/** Vì sao chưa bán được — KHOÁ i18n, null nghĩa là bán được. */
export function viSaoKhongBanDuoc(
  ca: Pick<CaThuNgan, 'trangThai'> | null,
  dong: readonly DongHang[],
): string | null {
  if (!ca) return 'quay.khongBan.chuaMoCa';
  if (ca.trangThai === 'da-dong') return 'quay.khongBan.caDaDong';
  if (dong.length === 0) return 'quay.khongBan.gioTrong';
  if (dong.some((d) => d.soLuong < 1)) return 'quay.khongBan.soLuongNhoHon1';
  return null;
}

/** Vì sao chưa đóng được ca — KHOÁ i18n, null nghĩa là đóng được.

    ⚠ LUẬT CUỐI CÙNG — LỆCH KÉT THÌ BẮT BUỘC GHI LÝ DO — TỪNG CHỈ NẰM Ở COMPONENT.
    `types.ts` khai nó là quy tắc thiết kế, `DoiSoatCa.tsx` tự tính lấy một biến
    `thieuLyDo` để chặn nút, nhưng hàm thuần thì không biết gì, và mock cũng
    không chặn. Nghĩa là luật chỉ tồn tại ở đúng một cái nút bấm: ai gọi thẳng
    API là đóng được ca lệch mà không giải thích một chữ.

    Điều đó phá đúng thứ màn Giám sát ca dựa vào — dấu hiệu "lệch không ai giải
    thích" (xem `giamSat.ts::chuYCuaCa()`) chỉ có nghĩa khi ghi lý do là bắt
    buộc thật. Nên luật dời về đây, có test, và mock chặn 400 y như vậy.

    Vì phải biết CÓ LỆCH HAY KHÔNG nên hàm cần cả `tienDauCa` và `giaoDich` —
    đó là lý do tham số thứ nhất rộng hơn trước. */
export function viSaoKhongDongDuocCa(
  ca: Pick<CaThuNgan, 'trangThai' | 'tienDauCa' | 'giaoDich'> | null,
  tienDem: number | null,
  ghiChu = '',
): string | null {
  if (!ca) return 'quay.khongDong.khongCoCa';
  if (ca.trangThai === 'da-dong') return 'quay.khongDong.caDaDong';
  if (tienDem === null) return 'quay.khongDong.chuaNhapTien';
  if (tienDem < 0) return 'quay.khongDong.tienKhongHopLe';
  if (chenhLech(tienDem, tienMatKyVong(ca)) !== 0 && ghiChu.trim() === '') {
    return 'quay.lechThiGhiLyDo';
  }
  return null;
}

/** Bản tóm tắt để dựng phiếu đối soát cuối ca. */
export interface TomTatCa {
  tienDauCa: Vnd;
  tienMat: Vnd;
  chuyenKhoan: Vnd;
  the: Vnd;
  tongDoanhThu: Vnd;
  soGiaoDich: number;
  soGiaoDichHuy: number;
  tienMatKyVong: Vnd;
}

export function tomTatCa(ca: Pick<CaThuNgan, 'tienDauCa' | 'giaoDich'>): TomTatCa {
  const conHieuLuc = giaoDichConHieuLuc(ca.giaoDich);
  return {
    tienDauCa: ca.tienDauCa,
    tienMat: doanhThuTheoPhuongThuc(ca.giaoDich, 'tien-mat'),
    chuyenKhoan: doanhThuTheoPhuongThuc(ca.giaoDich, 'chuyen-khoan'),
    the: doanhThuTheoPhuongThuc(ca.giaoDich, 'the'),
    tongDoanhThu: doanhThuCa(ca),
    soGiaoDich: conHieuLuc.length,
    soGiaoDichHuy: ca.giaoDich.length - conHieuLuc.length,
    tienMatKyVong: tienMatKyVong(ca),
  };
}

/** Thêm một món vào giỏ: đã có thì tăng số lượng, chưa có thì thêm dòng mới. */
export function themVaoGio(
  gio: readonly DongHang[],
  mon: Omit<DongHang, 'soLuong'>,
  soLuong = 1,
): DongHang[] {
  const i = gio.findIndex((d) => d.sanPhamId === mon.sanPhamId);
  if (i < 0) return [...gio, { ...mon, soLuong }];
  const banSao = [...gio];
  const cu = banSao[i];
  if (cu) banSao[i] = { ...cu, soLuong: cu.soLuong + soLuong };
  return banSao;
}

/** Đổi số lượng một dòng. Về 0 hoặc âm thì bỏ dòng khỏi giỏ. */
export function doiSoLuong(
  gio: readonly DongHang[],
  sanPhamId: string,
  soLuong: number,
): DongHang[] {
  if (soLuong < 1) return gio.filter((d) => d.sanPhamId !== sanPhamId);
  return gio.map((d) => (d.sanPhamId === sanPhamId ? { ...d, soLuong } : d));
}
