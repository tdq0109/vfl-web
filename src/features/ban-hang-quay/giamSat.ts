import type { Vnd } from '@/lib/api/types';
import { doanhThuCa, giaoDichConHieuLuc, tienMatKyVong, tomTatCa, type TomTatCa } from './quay';
import { chuYCuaMatXich, gomTheoNgayVaClb, type KhungCa, type MatXichCa } from './khungCa';
import type { BoLocGiamSat, CaThuNgan, DongSoGiaoDich, GiaoDich } from './types';

/* Giám sát ca — hàm thuần, không import React.

   quay.ts trả lời câu hỏi của thu ngân đang đứng ở quầy: ca của tôi thu được
   bao nhiêu, két phải có bao nhiêu. Tệp này trả lời câu hỏi của người giám sát
   nhìn nhiều ca của nhiều người: ca nào lệch, lệch có ai giải thích không, ai
   để ca mở qua đêm, ca nào huỷ nhiều bất thường.

   Bốn quy ước ở đây đều có lý do, đừng gỡ:
   - Ca chưa đóng thì chênh lệch là null, không phải 0. Chưa đếm tiền thì chưa
     biết gì; coi là khớp thì bảng tổng hợp báo "mọi ca đều khớp" trong khi nửa
     số ca chưa đối soát.
   - Thừa cũng đáng ngờ như thiếu (thường là thu tiền mà chưa bấm máy), nên xếp
     hạng đều lấy trị tuyệt đối.
   - Lệch có ghi lý do khác với lệch không ai giải thích; chỉ cái sau mới là
     việc của giám sát.
   - Giao dịch đã huỷ không tính vào doanh thu nhưng phải giữ trong sổ. Ngược
     với quay.ts: bán hàng thì lọc huỷ đi, đối chiếu thì huỷ chính là thứ cần
     soi.

   Ba ngưỡng dưới đây là giả định, chờ vận hành chốt. */

/** Lệch từ mức này trở lên là nặng (trị tuyệt đối). */
export const NGUONG_LECH_NANG: Vnd = 50_000;

/** Ca mở quá số giờ này mà chưa đóng là bất thường — thu ngân quên giao ca. */
export const GIO_CA_QUA_LAU = 12;

/** Số giao dịch huỷ trong một ca từ mức này trở lên là đáng soi. */
export const SO_HUY_DANG_NGO = 3;

export type CapLech = 'khop' | 'nhe' | 'nang';

/** Xếp mức nghiêm trọng của chênh lệch, lấy trị tuyệt đối. */
export function capLech(lech: number, nguong: Vnd = NGUONG_LECH_NANG): CapLech {
  if (lech === 0) return 'khop';
  return Math.abs(lech) >= nguong ? 'nang' : 'nhe';
}

/** Số giờ ca đã mở. Ca đã đóng tính tới lúc đóng, ca đang mở tính tới bayGio.

    bayGio là tham số chứ không đọc Date.now() bên trong, để hàm cho cùng kết
    quả với cùng đầu vào. */
export function soGioMoCa(
  ca: Pick<CaThuNgan, 'moLuc' | 'dongLuc'>,
  bayGio: Date,
): number {
  const mo = new Date(ca.moLuc).getTime();
  const den = ca.dongLuc ? new Date(ca.dongLuc).getTime() : bayGio.getTime();
  if (Number.isNaN(mo) || Number.isNaN(den)) return 0;
  return (den - mo) / 3_600_000;
}

/** Tổng tiền của các giao dịch đã huỷ — không nằm trong doanh thu nào. */
export function tienDaHuy(giaoDich: readonly GiaoDich[]): Vnd {
  return giaoDich.filter((g) => g.daHuy).reduce((tong, g) => tong + g.tongTien, 0);
}

/** Dấu hiệu cần chú ý của một ca — mảng khoá i18n, rỗng là không có gì.

    Trả khoá chứ không trả câu, vì hàm thuần không biết người xem đang dùng
    ngôn ngữ nào. Cùng cách với quay.ts::moTaChenhLech(). */
export function chuYCuaCa(
  ca: CaThuNgan,
  bayGio: Date,
  nguong: Vnd = NGUONG_LECH_NANG,
): string[] {
  const ra: string[] = [];
  const daDong = ca.trangThai === 'da-dong' && ca.tienDemCuoiCa !== undefined;

  if (daDong) {
    const lech = (ca.tienDemCuoiCa as Vnd) - tienMatKyVong(ca);
    if (lech !== 0 && !ca.ghiChuDongCa?.trim()) {
      ra.push('quay.giamSat.chuY.lechKhongLyDo');
    }
    if (capLech(lech, nguong) === 'nang') {
      ra.push('quay.giamSat.chuY.lechNang');
    }
  } else if (soGioMoCa(ca, bayGio) >= GIO_CA_QUA_LAU) {
    /* Chỉ ca chưa đóng mới bị soi về thời lượng. Ca đã đóng kéo dài 14 tiếng
       là ca dài, không phải ca bỏ quên — nó đã được đối soát rồi. */
    ra.push('quay.giamSat.chuY.caQuaLau');
  }

  if (ca.giaoDich.filter((g) => g.daHuy).length >= SO_HUY_DANG_NGO) {
    ra.push('quay.giamSat.chuY.nhieuHuy');
  }

  return ra;
}

/** Một dòng đối soát: ca + mọi con số đã tính sẵn để bảng chỉ việc vẽ. */
export interface DongDoiSoat {
  ca: CaThuNgan;
  tomTat: TomTatCa;
  /** Số giờ ca đã kéo dài. */
  soGio: number;
  /** Tiền đếm được — `null` khi ca chưa đóng. */
  tienDem: Vnd | null;
  /** Chênh lệch — null khi ca chưa đóng, vì chưa đếm thì chưa biết. */
  lech: number | null;
  /** `null` khi chưa đóng. */
  cap: CapLech | null;
  tienHuy: Vnd;
  /** Khoá i18n của các dấu hiệu cần chú ý. */
  chuY: string[];
}

export function doiSoatMotCa(
  ca: CaThuNgan,
  bayGio: Date,
  nguong: Vnd = NGUONG_LECH_NANG,
): DongDoiSoat {
  const daDong = ca.trangThai === 'da-dong' && ca.tienDemCuoiCa !== undefined;
  const tienDem = daDong ? (ca.tienDemCuoiCa as Vnd) : null;
  const lech = tienDem === null ? null : tienDem - tienMatKyVong(ca);

  return {
    ca,
    tomTat: tomTatCa(ca),
    soGio: soGioMoCa(ca, bayGio),
    tienDem,
    lech,
    cap: lech === null ? null : capLech(lech, nguong),
    tienHuy: tienDaHuy(ca.giaoDich),
    chuY: chuYCuaCa(ca, bayGio, nguong),
  };
}

export interface TongHopGiamSat {
  soCa: number;
  soCaDangMo: number;
  soCaCanChuY: number;
  tongDoanhThu: Vnd;
  tienMat: Vnd;
  chuyenKhoan: Vnd;
  the: Vnd;
  soGiaoDich: number;
  soGiaoDichHuy: number;
  tienHuy: Vnd;
  /** Tổng chênh lệch có dấu của các ca đã đóng — thừa và thiếu bù trừ nhau. */
  tongLech: number;
  /** Tổng trị tuyệt đối của chênh lệch: quy mô sai sót thật, không bù trừ. */
  tongLechTuyetDoi: Vnd;
  /** Số ca đã đóng mà không khớp két. */
  soCaLech: number;
}

/** Cộng dồn nhiều dòng đối soát.

    Giữ cả tongLech lẫn tongLechTuyetDoi. Một ca thừa 100k và một ca thiếu 100k
    thì tongLech = 0, đọc một mình nó sẽ tưởng cả ngày không lệch đồng nào. */
export function tongHopGiamSat(dong: readonly DongDoiSoat[]): TongHopGiamSat {
  const ra: TongHopGiamSat = {
    soCa: dong.length,
    soCaDangMo: 0,
    soCaCanChuY: 0,
    tongDoanhThu: 0,
    tienMat: 0,
    chuyenKhoan: 0,
    the: 0,
    soGiaoDich: 0,
    soGiaoDichHuy: 0,
    tienHuy: 0,
    tongLech: 0,
    tongLechTuyetDoi: 0,
    soCaLech: 0,
  };

  for (const d of dong) {
    if (d.ca.trangThai === 'dang-mo') ra.soCaDangMo += 1;
    if (d.chuY.length > 0) ra.soCaCanChuY += 1;
    ra.tongDoanhThu += d.tomTat.tongDoanhThu;
    ra.tienMat += d.tomTat.tienMat;
    ra.chuyenKhoan += d.tomTat.chuyenKhoan;
    ra.the += d.tomTat.the;
    ra.soGiaoDich += d.tomTat.soGiaoDich;
    ra.soGiaoDichHuy += d.tomTat.soGiaoDichHuy;
    ra.tienHuy += d.tienHuy;
    /* Ca chưa đóng không đóng góp gì vào phần chênh lệch. */
    if (d.lech !== null) {
      ra.tongLech += d.lech;
      ra.tongLechTuyetDoi += Math.abs(d.lech);
      if (d.lech !== 0) ra.soCaLech += 1;
    }
  }

  return ra;
}

/** Trải mọi giao dịch của nhiều ca thành sổ giao dịch, mới nhất lên trước.
    Giữ cả giao dịch đã huỷ; màn tự đánh dấu chúng. */
export function soGiaoDich(dsCa: readonly CaThuNgan[]): DongSoGiaoDich[] {
  const ra: DongSoGiaoDich[] = [];
  for (const ca of dsCa) {
    for (const gd of ca.giaoDich) {
      ra.push({
        ...gd,
        caId: ca.id,
        maCa: ca.maCa,
        thuNganId: ca.thuNganId,
        thuNganTen: ca.thuNganTen,
        locationId: ca.locationId,
        ...(ca.locationName === undefined ? {} : { locationName: ca.locationName }),
      });
    }
  }
  return ra.sort((a, b) => (a.luc < b.luc ? 1 : a.luc > b.luc ? -1 : 0));
}

/** Lọc danh sách ca theo bộ lọc của màn.

    Lọc theo ngày mở ca (moLuc) chứ không phải ngày đóng — ca đêm mở 22h hôm
    trước vẫn thuộc về hôm trước, đúng như cách thu ngân giao ca cho nhau. */
export function locCa(
  dsCa: readonly CaThuNgan[],
  boLoc: BoLocGiamSat,
  bayGio: Date,
  nguong: Vnd = NGUONG_LECH_NANG,
): CaThuNgan[] {
  return dsCa.filter((ca) => {
    const ngayMo = ca.moLuc.slice(0, 10);
    if (boLoc.tuNgay && ngayMo < boLoc.tuNgay) return false;
    if (boLoc.denNgay && ngayMo > boLoc.denNgay) return false;
    if (boLoc.locationId && ca.locationId !== boLoc.locationId) return false;
    if (boLoc.thuNganId && ca.thuNganId !== boLoc.thuNganId) return false;
    if (boLoc.trangThai && ca.trangThai !== boLoc.trangThai) return false;
    if (boLoc.chiCanChuY && chuYCuaCa(ca, bayGio, nguong).length === 0) return false;
    return true;
  });
}

/** Doanh thu gộp của nhiều ca, để đối chiếu nhanh với báo cáo Tổng quan.

    Cố ý không dùng tongHopGiamSat(): đây là đường tính độc lập, cộng thẳng từ
    giao dịch còn hiệu lực. Hai đường ra hai số khác nhau nghĩa là có chỗ sai. */
export function doanhThuGop(dsCa: readonly CaThuNgan[]): Vnd {
  return dsCa.reduce((tong, ca) => tong + doanhThuCa(ca), 0);
}

/** Số giao dịch còn hiệu lực của nhiều ca. */
export function soGiaoDichConHieuLuc(dsCa: readonly CaThuNgan[]): number {
  return dsCa.reduce((n, ca) => n + giaoDichConHieuLuc(ca.giaoDich).length, 0);
}

/* Gộp hai tầng dấu hiệu.

   Một ca có thể sai ở hai tầng, trả lời hai câu khác nhau: chuYCuaCa hỏi ca này
   tự nó có ổn không (lệch két, huỷ nhiều phiếu), còn chuYCuaMatXich hỏi ca này
   đặt cạnh ca trước có ổn không (bàn giao lệch, chồng giờ, chạy quá khung).

   Ghép lại thì khử trùng, và bỏ cái chung chung khi đã có cái cụ thể: "ca mở
   quá lâu" chỉ còn nghĩa khi ca nằm ngoài mọi khung. Ca sáng chạy 13 tiếng thì
   "chạy quá khung 5 giờ" nói đúng vấn đề hơn. */

export interface DongDoiSoatTrongChuoi extends DongDoiSoat {
  matXich: MatXichCa;
  /** Dấu hiệu của cả hai tầng, đã khử trùng. */
  chuYGop: string[];
}

export function gopChuY(dong: DongDoiSoat, matXich: MatXichCa): string[] {
  const chuoi = chuYCuaMatXich(matXich);
  const ca = matXich.khung === null
    ? dong.chuY
    : dong.chuY.filter((k) => k !== 'quay.giamSat.chuY.caQuaLau');
  return [...new Set([...ca, ...chuoi])];
}

/** Dựng danh sách theo ngày × CLB, mỗi ca kèm đối soát và dấu hiệu hai tầng. */
export function doiSoatTheoChuoi(
  dsCa: readonly CaThuNgan[],
  khung: readonly KhungCa[],
  bayGio: Date,
  nguong: Vnd = NGUONG_LECH_NANG,
) {
  return gomTheoNgayVaClb(dsCa, khung, bayGio).map((ngay) => ({
    ...ngay,
    dong: ngay.matXich.map((m): DongDoiSoatTrongChuoi => {
      const d = doiSoatMotCa(m.ca, bayGio, nguong);
      return { ...d, matXich: m, chuYGop: gopChuY(d, m) };
    }),
  }));
}

/** Một ngày của một CLB có gì đáng soi không.

    Điều kiện phải xét cả hai tầng, cộng thêm khung không ai trực. Bản đầu chỉ
    xét chuYCuaCa nên bộ lọc "chỉ ca cần chú ý" giấu mất đúng ca lệch bàn giao:
    ca ấy tự nó khớp két, dấu hiệu nằm ở khớp nối với ca trước. Khung trống thì
    không thuộc ca nào nên cũng không có dấu hiệu nào mang nó. */
export function ngayCanChuY(ngay: {
  khungTrong: readonly unknown[];
  dong: readonly DongDoiSoatTrongChuoi[];
}): boolean {
  return ngay.khungTrong.length > 0 || ngay.dong.some((d) => d.chuYGop.length > 0);
}
