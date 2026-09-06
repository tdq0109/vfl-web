import type { Vnd } from '@/lib/api/types';
import { doanhThuCa, giaoDichConHieuLuc, tienMatKyVong, tomTatCa, type TomTatCa } from './quay';
import { chuYCuaMatXich, gomTheoNgayVaClb, type KhungCa, type MatXichCa } from './khungCa';
import type { BoLocGiamSat, CaThuNgan, DongSoGiaoDich, GiaoDich } from './types';

/* GIÁM SÁT CA — HÀM THUẦN, không import React.

   `quay.ts` trả lời câu hỏi của THU NGÂN đang đứng ở quầy ("ca của tôi thu được
   bao nhiêu, két phải có bao nhiêu"). Tệp này trả lời câu hỏi của NGƯỜI GIÁM
   SÁT, đứng sau và nhìn nhiều ca của nhiều người: ca nào lệch, lệch có giải
   thích không, ai đang để ca mở qua đêm, ca nào huỷ nhiều bất thường.

   ⚠ BỐN CÁI BẪY, đừng gỡ cái nào khi sửa hàm này:

   1. CA CHƯA ĐÓNG KHÔNG CÓ CHÊNH LỆCH — không phải "lệch 0". Chưa đếm tiền thì
      chưa biết gì cả. Coi nó là khớp là cả bảng tổng hợp báo "mọi ca đều khớp"
      trong khi nửa số ca còn chưa đối soát.
   2. THỪA CŨNG ĐÁNG NGỜ NHƯ THIẾU. Thừa 300k không phải "may", nó thường là một
      giao dịch thu tiền mà chưa bấm máy. Nên mọi phép xếp hạng đều lấy TRỊ
      TUYỆT ĐỐI.
   3. LỆCH CÓ GHI LÝ DO ≠ LỆCH KHÔNG AI GIẢI THÍCH. Chỉ cái sau mới là việc của
      giám sát; lẫn hai thứ là hoặc bỏ sót, hoặc ngày nào cũng báo động.
   4. GIAO DỊCH ĐÃ HUỶ KHÔNG TÍNH VÀO DOANH THU, NHƯNG PHẢI GIỮ TRONG SỔ. Đây là
      chỗ ngược với `quay.ts`: bán hàng thì lọc huỷ đi, còn đối chiếu thì huỷ
      chính là thứ cần soi. Xoá khỏi sổ là mất luôn dấu vết của mẫu gian lận cổ
      điển nhất ở quầy: bấm bán, thu tiền, rồi huỷ phiếu.

   ⚠ BA NGƯỠNG DƯỚI ĐÂY LÀ GIẢ ĐỊNH, cần vận hành chốt. Đặt thành hằng có tên để
   sửa một chỗ, và để test nói rõ con số nào đang có hiệu lực. */

/** Lệch từ mức này trở lên là NẶNG (trị tuyệt đối). */
export const NGUONG_LECH_NANG: Vnd = 50_000;

/** Ca mở quá số giờ này mà chưa đóng là bất thường — thu ngân quên giao ca. */
export const GIO_CA_QUA_LAU = 12;

/** Số giao dịch huỷ trong một ca từ mức này trở lên là đáng soi. */
export const SO_HUY_DANG_NGO = 3;

export type CapLech = 'khop' | 'nhe' | 'nang';

/** Xếp mức nghiêm trọng của chênh lệch. Lấy TRỊ TUYỆT ĐỐI — thừa cũng như thiếu. */
export function capLech(lech: number, nguong: Vnd = NGUONG_LECH_NANG): CapLech {
  if (lech === 0) return 'khop';
  return Math.abs(lech) >= nguong ? 'nang' : 'nhe';
}

/** Số giờ ca đã mở. Ca đã đóng tính tới lúc đóng, ca đang mở tính tới `bayGio`.

    `bayGio` là THAM SỐ chứ không đọc `Date.now()` bên trong: hàm thuần phải cho
    cùng kết quả với cùng đầu vào, và test phải cố định được thời điểm. */
export function soGioMoCa(
  ca: Pick<CaThuNgan, 'moLuc' | 'dongLuc'>,
  bayGio: Date,
): number {
  const mo = new Date(ca.moLuc).getTime();
  const den = ca.dongLuc ? new Date(ca.dongLuc).getTime() : bayGio.getTime();
  if (Number.isNaN(mo) || Number.isNaN(den)) return 0;
  return (den - mo) / 3_600_000;
}

/** Tổng tiền của các giao dịch ĐÃ HUỶ — số không nằm trong doanh thu nào. */
export function tienDaHuy(giaoDich: readonly GiaoDich[]): Vnd {
  return giaoDich.filter((g) => g.daHuy).reduce((tong, g) => tong + g.tongTien, 0);
}

/** Dấu hiệu cần chú ý của MỘT ca — mảng KHOÁ i18n, rỗng nghĩa là không có gì.

    Trả khoá chứ không trả câu: hàm thuần không biết người đang xem dùng ngôn ngữ
    nào. Cùng cách với `quay.ts::moTaChenhLech()`. */
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
    /* Chỉ ca CHƯA đóng mới bị soi về thời lượng. Ca đã đóng kéo dài 14 tiếng là
       ca dài, không phải ca bỏ quên — và nó đã được đối soát rồi. */
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
  /** Chênh lệch — `null` khi ca CHƯA ĐÓNG (chưa đếm thì chưa biết, xem BẪY 1). */
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
  /** Tổng chênh lệch CÓ DẤU của các ca ĐÃ ĐÓNG — thừa và thiếu bù trừ nhau. */
  tongLech: number;
  /** Tổng TRỊ TUYỆT ĐỐI của chênh lệch: quy mô sai sót thật, không bù trừ. */
  tongLechTuyetDoi: Vnd;
  /** Số ca đã đóng mà không khớp két. */
  soCaLech: number;
}

/** Cộng dồn nhiều dòng đối soát.

    ⚠ `tongLech` và `tongLechTuyetDoi` PHẢI có cả hai. Một ca thừa 100k và một ca
    thiếu 100k thì `tongLech` = 0 — đọc một mình nó sẽ tưởng "cả ngày không lệch
    đồng nào", trong khi thực tế có hai ca sai. */
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
    /* Ca chưa đóng KHÔNG đóng góp gì vào phần chênh lệch — xem BẪY 1. */
    if (d.lech !== null) {
      ra.tongLech += d.lech;
      ra.tongLechTuyetDoi += Math.abs(d.lech);
      if (d.lech !== 0) ra.soCaLech += 1;
    }
  }

  return ra;
}

/** Trải mọi giao dịch của nhiều ca thành SỔ GIAO DỊCH, mới nhất lên trước.

    GIỮ CẢ GIAO DỊCH ĐÃ HUỶ — xem BẪY 4. Màn tự đánh dấu chúng, việc của nó là
    hiện, không phải giấu. */
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

    Lọc theo NGÀY MỞ ca (`moLuc`), không phải ngày đóng — ca đêm mở 22h hôm trước
    vẫn thuộc về ca của hôm trước, đúng như cách thu ngân giao ca cho nhau. */
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

/** Doanh thu gộp của nhiều ca — dùng để đối chiếu nhanh với báo cáo Tổng quan.

    Cố ý KHÔNG dùng `tongHopGiamSat()`: đây là đường tính ĐỘC LẬP, cộng thẳng từ
    giao dịch còn hiệu lực. Hai đường ra hai số khác nhau nghĩa là có chỗ sai, và
    test canh đúng điều đó. */
export function doanhThuGop(dsCa: readonly CaThuNgan[]): Vnd {
  return dsCa.reduce((tong, ca) => tong + doanhThuCa(ca), 0);
}

/** Số giao dịch còn hiệu lực của nhiều ca. */
export function soGiaoDichConHieuLuc(dsCa: readonly CaThuNgan[]): number {
  return dsCa.reduce((n, ca) => n + giaoDichConHieuLuc(ca.giaoDich).length, 0);
}

/* ── GỘP HAI TẦNG DẤU HIỆU ────────────────────────────────────────────────

   Một ca có thể "sai" ở hai tầng khác nhau, và chúng trả lời hai câu khác nhau:

     · tầng CA     (`chuYCuaCa`)      — ca này tự nó có ổn không: lệch két, huỷ
                                        nhiều phiếu;
     · tầng CHUỖI  (`chuYCuaMatXich`) — ca này đặt cạnh ca trước có ổn không:
                                        bàn giao lệch, chồng giờ, chạy quá khung.

   Ghép lại phải KHỬ TRÙNG và bỏ cái chung chung khi đã có cái cụ thể: "ca mở
   quá lâu" (12 tiếng, đo tuyệt đối) chỉ còn nghĩa khi ca nằm NGOÀI mọi khung.
   Ca sáng chạy 13 tiếng thì "chạy quá khung 5 giờ" nói đúng vấn đề hơn, và hiện
   cả hai chỉ làm loãng bảng. */

export interface DongDoiSoatTrongChuoi extends DongDoiSoat {
  matXich: MatXichCa;
  /** Dấu hiệu của CẢ HAI tầng, đã khử trùng. */
  chuYGop: string[];
}

export function gopChuY(dong: DongDoiSoat, matXich: MatXichCa): string[] {
  const chuoi = chuYCuaMatXich(matXich);
  const ca = matXich.khung === null
    ? dong.chuY
    : dong.chuY.filter((k) => k !== 'quay.giamSat.chuY.caQuaLau');
  return [...new Set([...ca, ...chuoi])];
}

/** Dựng danh sách theo NGÀY × CLB, mỗi ca kèm đối soát và dấu hiệu hai tầng. */
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

/** Một NGÀY của một CLB có gì đáng soi không.

    🐞 Hàm này sinh ra từ một lỗi thật, do test tương tác lôi ra: bộ lọc "chỉ ca
    cần chú ý" ban đầu chỉ xét dấu hiệu TẦNG CA (`chuYCuaCa`), nên nó GIẤU MẤT
    đúng ca lệch bàn giao — ca ấy tự nó khớp két hoàn hảo, dấu hiệu nằm ở khớp
    nối với ca trước. Nói cách khác, cái nút "chỉ hiện thứ đáng ngờ" lại lọc
    chính xác thứ đáng ngờ nhất ra khỏi màn.

    Nên điều kiện phải xét CẢ HAI TẦNG, cộng thêm khung không ai trực — khung
    trống không thuộc ca nào cả, nên không có dấu hiệu nào mang nó. */
export function ngayCanChuY(ngay: {
  khungTrong: readonly unknown[];
  dong: readonly DongDoiSoatTrongChuoi[];
}): boolean {
  return ngay.khungTrong.length > 0 || ngay.dong.some((d) => d.chuYGop.length > 0);
}
