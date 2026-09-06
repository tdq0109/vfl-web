/* Nhập thẳng module hàm thuần, KHÔNG qua cửa công khai '@/features/san-pham':
   cửa đó kéo theo cả màn hình .tsx, tức là kéo React vào tầng hàm thuần. */
import { viPhamGiaSan } from '@/features/san-pham/gia';
import { money, roundVnd, toIsoDate } from '@/lib/format';
import { rankOf, ROLE_KHOA, ROLE_RANK, type Role } from '@/lib/auth/permissions';
import type { UserProfile } from '@/lib/auth/types';
import type { Vnd } from '@/lib/api/types';
import {
  TRANG_THAI_HOP_DONG_KHOA,
  type DongHopDong,
  type HopDong,
  type KhuyenMaiApDung,
  type LyDoChan,
  type ThanhToanHopDong,
  type TrangThaiHienThi,
  type TrangThaiHopDong,
} from './types';

/* Máy trạng thái + phép tính tiền của hợp đồng — HÀM THUẦN, không import React.
   Không import React, không gọi API. Backend .NET vẫn phải kiểm lại tất cả;
   phần này để chặn sớm và nói cho người vận hành biết vì sao chưa đi tiếp được.

   ⚠ SÁU CÁI BẪY, đừng gỡ cái nào khi sửa hàm này:

   1. NHẢY CÓC TRẠNG THÁI. `bao-gia` → `da-ky` phải bị chặn. `CHUYEN_TIEP` là
      nguồn sự thật duy nhất — đừng rải `if (trangThai === …)` trong component.
   2. PHÁT HÀNH KHI CHƯA THU ĐỦ. Bẫy mất tiền trực tiếp: phát hành xong là hội
      viên vào tập, tiền thì chưa về.
   3. NGƯỜI LẬP TỰ XÁC MINH HỢP ĐỒNG CỦA MÌNH. Đây là TÁCH NHIỆM (segregation of
      duties), không phải phân quyền thường: một người vừa bán vừa xác nhận đã
      thu tiền thì không còn ai đối chứng. Đủ cấp bậc vẫn bị chặn.
   4. BÁN DƯỚI GIÁ SÀN. Dùng lại `viPhamGiaSan()` của Bước 9, không viết lại.
   5. LÀM TRÒN TIỀN. Đã chốt: giảm giá tính TRÊN TẠM TÍNH rồi làm tròn MỘT LẦN.
      Làm tròn từng dòng rồi cộng cho ra số khác — lệch vài nghìn mỗi hợp đồng,
      cuối tháng kế toán không khớp nổi.
   6. TRẠNG THÁI SUY RA vs TRẠNG THÁI LƯU. `het-han` suy từ `ngayKetThuc`, không
      lưu — xem `trangThaiHienThi()`. */

/** Bảng chuyển trạng thái hợp lệ — NGUỒN SỰ THẬT DUY NHẤT.

    Bước 12a chỉ dựng luồng thuận và huỷ TRƯỚC khi phát hành. Các cạnh của Bước
    12b (kế toán trả lại, huỷ hoá đơn đã phát hành, tạm dừng, đổi gói) cố ý CHƯA
    có ở đây: mở cạnh trước khi có bút toán đảo là cách nhanh nhất để mất dấu
    tiền. */
export const CHUYEN_TIEP: Record<TrangThaiHopDong, readonly TrangThaiHopDong[]> = {
  'bao-gia': ['cho-thu-tien', 'da-huy'],
  'cho-thu-tien': ['cho-xac-minh', 'da-huy'],
  'cho-xac-minh': ['da-phat-hanh', 'da-huy'],
  'da-phat-hanh': ['da-ky'],
  'da-ky': ['dang-hieu-luc'],
  'dang-hieu-luc': [],
  'da-huy': [],
  'tam-dung': [],
};

/** Cấp bậc tối thiểu để thực hiện từng bước chuyển. Chỉ để chặn sớm và ẩn nút —
    backend .NET phải kiểm lại. */
export const QUYEN_CHUYEN: Record<TrangThaiHopDong, Role> = {
  'bao-gia': 'staff',
  'cho-thu-tien': 'staff',
  'cho-xac-minh': 'staff',
  /* Xác minh thu tiền là việc của kế toán trở lên. */
  'da-phat-hanh': 'accountant',
  'da-ky': 'staff',
  'dang-hieu-luc': 'staff',
  /* Huỷ trước phát hành: trưởng nhóm. Huỷ SAU phát hành là hoá đơn đã ghi —
     việc của Bước 12b, cần Giám đốc và một bút toán đảo. */
  'da-huy': 'leader',
  'tam-dung': 'manager',
};

/** Năm bước hiển thị trên thanh tiến trình. Nhiều trạng thái gộp về một bước:
    phát hành và ký là hai lần bấm nhưng với người dùng là một chặng giấy tờ. */
export const BUOC_HOP_DONG: { khoa: string; trangThai: readonly TrangThaiHopDong[] }[] = [
  { khoa: 'hopDong.buoc.baoGia', trangThai: ['bao-gia'] },
  { khoa: 'hopDong.buoc.thuTien', trangThai: ['cho-thu-tien'] },
  { khoa: 'hopDong.buoc.xacMinh', trangThai: ['cho-xac-minh'] },
  { khoa: 'hopDong.buoc.phatHanhKy', trangThai: ['da-phat-hanh', 'da-ky'] },
  { khoa: 'hopDong.buoc.hieuLuc', trangThai: ['dang-hieu-luc'] },
];

/* ── Tiền ────────────────────────────────────────────────────────────────── */

/** Thành tiền một dòng. Đơn giá đã là số nguyên đồng nên không làm tròn ở đây —
    xem bẫy 5. */
export function thanhTienDong(dong: Pick<DongHopDong, 'donGia' | 'soLuong'>): Vnd {
  return dong.donGia * dong.soLuong;
}

export interface TongHopDong {
  tamTinh: Vnd;
  giam: Vnd;
  tong: Vnd;
}

/** Tổng hợp đồng. Giảm giá tính trên TẠM TÍNH và làm tròn đúng MỘT LẦN. */
export function tinhTongHopDong(
  dong: readonly DongHopDong[],
  khuyenMai?: KhuyenMaiApDung,
): TongHopDong {
  const tamTinh = dong.reduce((tong, d) => tong + thanhTienDong(d), 0);
  if (!khuyenMai || khuyenMai.giaTri <= 0) return { tamTinh, giam: 0, tong: tamTinh };

  const giamTho =
    khuyenMai.loaiGiam === 'phan-tram'
      ? roundVnd((tamTinh * khuyenMai.giaTri) / 100)
      : khuyenMai.giaTri;
  /* Giảm không bao giờ vượt tạm tính — hợp đồng âm tiền là vô nghĩa. */
  const giam = Math.min(Math.max(0, giamTho), tamTinh);
  return { tamTinh, giam, tong: tamTinh - giam };
}

/** Tiền đã thu — phiếu thu ĐÃ HUỶ không tính (bút toán đảo, giống Bước 11). */
export function tienDaThu(hd: { thanhToan: readonly ThanhToanHopDong[] }): Vnd {
  return hd.thanhToan.filter((t) => !t.daHuy).reduce((tong, t) => tong + t.soTien, 0);
}

/** Còn phải thu. Không bao giờ âm — thu thừa là ngoại lệ của Bước 12b. */
export function conPhaiThu(
  hd: Pick<HopDong, 'dong'> & {
    khuyenMai?: KhuyenMaiApDung;
    thanhToan: readonly ThanhToanHopDong[];
  },
): Vnd {
  return Math.max(0, tinhTongHopDong(hd.dong, hd.khuyenMai).tong - tienDaThu(hd));
}

export function daThuDu(
  hd: Pick<HopDong, 'dong'> & {
    khuyenMai?: KhuyenMaiApDung;
    thanhToan: readonly ThanhToanHopDong[];
  },
): boolean {
  return conPhaiThu(hd) === 0;
}

/* ── Giá sàn ─────────────────────────────────────────────────────────────── */

/** Các dòng bán dưới giá sàn — xét CẢ khuyến mãi toàn hợp đồng, vì giảm 20%
    trên một dòng đã sát sàn là đủ để thủng. Dùng lại `viPhamGiaSan()` Bước 9. */
export function dongViPhamGiaSan(
  dong: readonly DongHopDong[],
  khuyenMai?: KhuyenMaiApDung,
): DongHopDong[] {
  return dong.filter((d) => {
    if (d.donGia < d.giaSan) return true;
    if (!khuyenMai || khuyenMai.giaTri <= 0) return false;
    /* `giaNiemYet` ở đây là giá bán của dòng — khuyến mãi áp lên chính nó. */
    return viPhamGiaSan({ giaNiemYet: d.donGia, giaSan: d.giaSan }, khuyenMai);
  });
}

/** Cảnh báo phá giá sàn, hiện TRƯỚC KHI lưu — cùng lối trình bày với Bước 9.

    Trả LÝ DO (khoá + tham số + danh sách dòng vi phạm), không trả câu dựng sẵn:
    câu này có cả số dòng lẫn chi tiết từng dòng, mà chi tiết ấy phải dịch được.
    Ghép ra chữ bằng `lyDoThanhChu()` trong `lyDo.ts`. */
export function canhBaoGiaSan(
  dong: readonly DongHopDong[],
  khuyenMai?: KhuyenMaiApDung,
): LyDoChan | null {
  const pham = dongViPhamGiaSan(dong, khuyenMai);
  if (pham.length === 0) return null;
  return {
    khoa: 'hopDong.chan.duoiGiaSan',
    thamSo: { so: pham.length },
    dongViPham: pham,
  };
}

/* ── Máy trạng thái ──────────────────────────────────────────────────────── */

export function chuyenTiepDuoc(tu: TrangThaiHopDong, den: TrangThaiHopDong): boolean {
  return CHUYEN_TIEP[tu].includes(den);
}

export function cacTrangThaiTiepTheo(tu: TrangThaiHopDong): TrangThaiHopDong[] {
  return [...CHUYEN_TIEP[tu]];
}

/** Bước thuận kế tiếp (bỏ qua huỷ / tạm dừng) — nút hành động chính của màn. */
export function buocKeTiep(tu: TrangThaiHopDong): TrangThaiHopDong | null {
  return CHUYEN_TIEP[tu].find((t) => t !== 'da-huy' && t !== 'tam-dung') ?? null;
}

/** Chỉ số bước trên thanh tiến trình; -1 nếu hợp đồng đã ra khỏi luồng thuận. */
export function buocHienTai(trangThai: TrangThaiHopDong): number {
  return BUOC_HOP_DONG.findIndex((b) => b.trangThai.includes(trangThai));
}

type HopDongDeKiem = Pick<HopDong, 'trangThai' | 'dong' | 'nguoiLapId'> & {
  thanhToan: readonly ThanhToanHopDong[];
  khuyenMai?: KhuyenMaiApDung;
  ngayBatDau?: string;
};

/** Vì sao chưa chuyển được sang `den` — null nghĩa là chuyển được.

    Trả CÂU GIẢI THÍCH chứ không phải boolean: người vận hành cần biết còn thiếu
    bao nhiêu tiền, chứ không phải một nút xám không nói gì. */
export function viSaoKhongChuyenDuoc(
  hd: HopDongDeKiem,
  den: TrangThaiHopDong,
  actor: Pick<UserProfile, 'id' | 'role'>,
): LyDoChan | null {
  const tu = hd.trangThai;

  if (tu === den) return { khoa: 'hopDong.chan.dangOTrangThaiNay' };

  /* BẪY 1 — bảng chuyển tiếp là cửa đầu tiên, không ngoại lệ. */
  if (!chuyenTiepDuoc(tu, den)) {
    /* Hai tên trạng thái đi ra dưới dạng KHOÁ; `lyDoThanhChu()` dịch lồng. */
    return {
      khoa: 'hopDong.chan.khongChuyenThang',
      thamSo: { tu: TRANG_THAI_HOP_DONG_KHOA[tu], den: TRANG_THAI_HOP_DONG_KHOA[den] },
    };
  }

  const canRole = QUYEN_CHUYEN[den];
  if (rankOf(actor.role) < ROLE_RANK[canRole]) {
    return { khoa: 'hopDong.chan.canVaiTro', thamSo: { vaiTro: ROLE_KHOA[canRole] } };
  }

  if (den === 'cho-thu-tien') {
    if (hd.dong.length === 0) return { khoa: 'hopDong.chan.chuaCoSanPham' };
    if (hd.dong.some((d) => d.soLuong < 1)) return { khoa: 'hopDong.chan.soLuongNhoHon1' };
    if (tinhTongHopDong(hd.dong, hd.khuyenMai).tong <= 0) {
      return { khoa: 'hopDong.chan.tongPhaiLonHon0' };
    }
    /* BẪY 4 — chặn tại đây thay vì lúc phát hành: sửa báo giá còn dễ, sửa hợp
       đồng đã thu tiền thì phải hoàn tiền. */
    const canhBao = canhBaoGiaSan(hd.dong, hd.khuyenMai);
    if (canhBao) return canhBao;
  }

  /* BẪY 2 — chưa thu đủ thì không đi tiếp, chặn ở CẢ hai cửa. */
  if ((den === 'cho-xac-minh' || den === 'da-phat-hanh') && !daThuDu(hd)) {
    return { khoa: 'hopDong.chan.chuaThuDu', thamSo: { soTien: money(conPhaiThu(hd)) } };
  }

  /* BẪY 3 — tách nhiệm. Kiểm SAU cấp bậc để câu thông báo nói đúng nguyên nhân. */
  if (den === 'da-phat-hanh' && actor.id === hd.nguoiLapId) {
    return { khoa: 'hopDong.chan.tuXacMinh' };
  }

  if (den === 'dang-hieu-luc' && !hd.ngayBatDau) {
    return { khoa: 'hopDong.chan.chuaCoNgayBatDau' };
  }

  return null;
}

/** Vì sao chưa ghi được phiếu thu — null nghĩa là thu được.

    Thu thừa, trả góp và công nợ là ngoại lệ của Bước 12b; ở 12a chỉ cho thu
    đúng phần còn lại hoặc ít hơn. */
export function viSaoKhongThuDuoc(hd: HopDongDeKiem, soTien: number): LyDoChan | null {
  if (hd.trangThai !== 'cho-thu-tien') return { khoa: 'hopDong.chanThu.saiBuoc' };
  if (!Number.isFinite(soTien) || soTien <= 0) {
    return { khoa: 'hopDong.chanThu.soTienPhaiLonHon0' };
  }
  const con = conPhaiThu(hd);
  if (con === 0) return { khoa: 'hopDong.chanThu.daThuDu' };
  if (soTien > con) {
    return { khoa: 'hopDong.chanThu.vuotQuaConPhaiThu', thamSo: { soTien: money(con) } };
  }
  return null;
}

/* ── Trạng thái suy ra ───────────────────────────────────────────────────── */

/** BẪY 6 — `het-han` SUY RA từ ngày, không lưu. So sánh chuỗi 'YYYY-MM-DD' nên
    không dính lệch múi giờ (dùng `toIsoDate()`, không `toISOString()`). */
export function trangThaiHienThi(
  hd: Pick<HopDong, 'trangThai'> & { ngayKetThuc?: string },
  homNay: Date = new Date(),
): TrangThaiHienThi {
  if (hd.trangThai !== 'dang-hieu-luc') return hd.trangThai;
  if (hd.ngayKetThuc && toIsoDate(homNay) > hd.ngayKetThuc) return 'het-han';
  return 'dang-hieu-luc';
}

/** Hợp đồng còn sửa được nội dung không. Sau khi chốt bán là chứng từ, chỉ đi
    theo máy trạng thái. */
export function suaDuocNoiDung(hd: Pick<HopDong, 'trangThai'>): boolean {
  return hd.trangThai === 'bao-gia';
}

