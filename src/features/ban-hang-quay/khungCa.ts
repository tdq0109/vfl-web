import type { Vnd } from '@/lib/api/types';
import { tienMatKyVong } from './quay';
import type { CaThuNgan } from './types';

/* Khung ca chuẩn của CLB — hàm thuần, không import React.

   Lễ tân chia 2 ca một ngày, có nơi 3 ca, nối tiếp nhau trên cùng một két. Coi
   ca là một phiên thu ngân tuỳ ý rồi đối soát riêng lẻ thì bỏ sót đúng ba chỗ
   tiền biến mất: lệch bàn giao giữa hai ca (không ca nào sai mà tiền vẫn hụt),
   khung không ai mở ca, và hai thu ngân cùng mở ca trên một két.

   Khung giờ dưới đây là giả định, chờ vận hành chốt. */

export interface KhungCa {
  id: string;
  /** Khoá i18n của tên ca. */
  nhanKhoa: string;
  /** 'HH:mm' — giờ bắt đầu theo giờ địa phương. */
  batDau: string;
  /** 'HH:mm'. Nhỏ hơn batDau nghĩa là ca vắt qua nửa đêm. */
  ketThuc: string;
}

/** Hai ca — cách chia phổ biến nhất hiện nay. */
export const KHUNG_2_CA: KhungCa[] = [
  { id: 'sang', nhanKhoa: 'quay.khungCa.sang', batDau: '06:00', ketThuc: '14:00' },
  { id: 'chieu', nhanKhoa: 'quay.khungCa.chieu', batDau: '14:00', ketThuc: '22:00' },
];

/** Ba ca — có CLB chạy thêm ca đêm, ca đêm vắt qua nửa đêm. */
export const KHUNG_3_CA: KhungCa[] = [
  { id: 'sang', nhanKhoa: 'quay.khungCa.sang', batDau: '06:00', ketThuc: '14:00' },
  { id: 'chieu', nhanKhoa: 'quay.khungCa.chieu', batDau: '14:00', ketThuc: '22:00' },
  { id: 'dem', nhanKhoa: 'quay.khungCa.dem', batDau: '22:00', ketThuc: '06:00' },
];

export type KieuKhung = '2-ca' | '3-ca';

export const KHUNG_THEO_KIEU: Record<KieuKhung, KhungCa[]> = {
  '2-ca': KHUNG_2_CA,
  '3-ca': KHUNG_3_CA,
};

/** Ca chạy quá khung của nó bao lâu thì coi là bất thường (giờ). */
export const GIO_VUOT_KHUNG = 2;

/** 'HH:mm' → số phút từ 0h. Trả `null` nếu không đọc được. */
export function phutTrongNgay(hhmm: string): number | null {
  const m = /^(\d{2}):(\d{2})$/.exec(hhmm);
  if (!m || m[1] === undefined || m[2] === undefined) return null;
  const gio = Number(m[1]);
  const phut = Number(m[2]);
  if (gio > 23 || phut > 59) return null;
  return gio * 60 + phut;
}

/** Phần 'HH:mm' của một mốc 'YYYY-MM-DDTHH:mm'. */
function gioCua(luc: string): string {
  return luc.slice(11, 16);
}

/** Độ dài khung theo phút. Khung vắt qua nửa đêm được cộng bù 24 giờ. */
export function doDaiKhung(khung: KhungCa): number {
  const bd = phutTrongNgay(khung.batDau);
  const kt = phutTrongNgay(khung.ketThuc);
  if (bd === null || kt === null) return 0;
  return kt > bd ? kt - bd : kt + 24 * 60 - bd;
}

/** Khung chứa thời điểm này, null nếu ngoài mọi khung. Khung vắt qua nửa đêm
    (22:00 → 06:00) phải xét bằng hoặc: 01:30 vừa không ≥ 22:00 vừa không thuộc
    khoảng nào nếu so kiểu thường. */
export function khungCuaThoiDiem(luc: string, khung: readonly KhungCa[]): KhungCa | null {
  const t = phutTrongNgay(gioCua(luc));
  if (t === null) return null;

  for (const k of khung) {
    const bd = phutTrongNgay(k.batDau);
    const kt = phutTrongNgay(k.ketThuc);
    if (bd === null || kt === null) continue;
    const trong = kt > bd ? t >= bd && t < kt : t >= bd || t < kt;
    if (trong) return k;
  }
  return null;
}

/** Ngày làm việc của một mốc, không phải ngày trên lịch: ca đêm mở 23:00 ngày
    04 và ca mở 01:00 ngày 05 là cùng một ca của ngày 04. */
export function ngayLamViec(luc: string, khung: readonly KhungCa[]): string {
  const ngay = luc.slice(0, 10);
  const k = khungCuaThoiDiem(luc, khung);
  if (!k) return ngay;

  const bd = phutTrongNgay(k.batDau);
  const kt = phutTrongNgay(k.ketThuc);
  const t = phutTrongNgay(gioCua(luc));
  if (bd === null || kt === null || t === null) return ngay;

  /* Chỉ khung vắt qua nửa đêm mới phải lùi, và chỉ ở nửa sau nửa đêm. */
  if (kt <= bd && t < kt) {
    const d = new Date(`${ngay}T00:00`);
    d.setDate(d.getDate() - 1);
    const hai = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${hai(d.getMonth() + 1)}-${hai(d.getDate())}`;
  }
  return ngay;
}

/** Số giờ một ca chạy quá khung của nó. 0 nghĩa là trong khung. */
export function soGioVuotKhung(
  ca: Pick<CaThuNgan, 'moLuc' | 'dongLuc'>,
  khung: readonly KhungCa[],
  bayGio: Date,
): number {
  const k = khungCuaThoiDiem(ca.moLuc, khung);
  if (!k) return 0;
  const mo = new Date(ca.moLuc).getTime();
  const den = ca.dongLuc ? new Date(ca.dongLuc).getTime() : bayGio.getTime();
  if (Number.isNaN(mo) || Number.isNaN(den)) return 0;
  const daChay = (den - mo) / 60_000;
  const vuot = daChay - doDaiKhung(k);
  return vuot > 0 ? vuot / 60 : 0;
}

/** Một mắt xích trong chuỗi ca của một ngày tại một CLB. */
export interface MatXichCa {
  /** Khung ca này thuộc về. null = ca mở ngoài mọi khung. */
  khung: KhungCa | null;
  ca: CaThuNgan;
  /** Lệch bàn giao so với ca liền trước: tiền đầu ca này − tiền cuối ca trước.
      null khi không có ca trước hoặc ca trước chưa đóng. */
  lechBanGiao: number | null;
  gioVuotKhung: number;
  /** Ca này chồng giờ với ca liền trước tại cùng CLB. */
  chongLanCaTruoc: boolean;
}

/** Một khung không có ca nào phụ trách. */
export interface KhungTrong {
  khung: KhungCa;
}

export interface NgayCuaClb {
  ngay: string;
  locationId: string;
  locationName?: string;
  matXich: MatXichCa[];
  /** Khung trong ngày mà không ai mở ca — két không có người chịu trách nhiệm. */
  khungTrong: KhungTrong[];
}

/** Gom ca theo ngày làm việc × CLB rồi tính lệch bàn giao, ca chạy quá khung,
    ca chồng lấn, khung không ai trực.

    chiKhungDaQua chỉ báo khung trống khi khung ấy đã kết thúc; không có nó thì
    8h sáng màn đã kêu ca chiều không ai trực. */
export function gomTheoNgayVaClb(
  dsCa: readonly CaThuNgan[],
  khung: readonly KhungCa[],
  bayGio: Date,
): NgayCuaClb[] {
  const nhom = new Map<string, NgayCuaClb>();

  for (const ca of dsCa) {
    const ngay = ngayLamViec(ca.moLuc, khung);
    const khoa = `${ngay}|${ca.locationId}`;
    let muc = nhom.get(khoa);
    if (!muc) {
      muc = {
        ngay,
        locationId: ca.locationId,
        ...(ca.locationName === undefined ? {} : { locationName: ca.locationName }),
        matXich: [],
        khungTrong: [],
      };
      nhom.set(khoa, muc);
    }
    muc.matXich.push({
      khung: khungCuaThoiDiem(ca.moLuc, khung),
      ca,
      lechBanGiao: null,
      gioVuotKhung: soGioVuotKhung(ca, khung, bayGio),
      chongLanCaTruoc: false,
    });
  }

  for (const muc of nhom.values()) {
    muc.matXich.sort((a, b) => (a.ca.moLuc < b.ca.moLuc ? -1 : a.ca.moLuc > b.ca.moLuc ? 1 : 0));

    for (let i = 1; i < muc.matXich.length; i += 1) {
      const truoc = muc.matXich[i - 1];
      const nay = muc.matXich[i];
      if (!truoc || !nay) continue;

      /* Bàn giao chỉ so được khi ca trước đã đếm tiền. */
      if (truoc.ca.tienDemCuoiCa !== undefined) {
        nay.lechBanGiao = nay.ca.tienDauCa - truoc.ca.tienDemCuoiCa;
      }

      /* Chồng lấn: ca trước chưa đóng, hoặc đóng sau khi ca này đã mở. */
      nay.chongLanCaTruoc = !truoc.ca.dongLuc || truoc.ca.dongLuc > nay.ca.moLuc;
    }

    /* Khung trống — chỉ tính khung đã kết thúc. */
    const daCo = new Set(muc.matXich.map((m) => m.khung?.id).filter(Boolean));
    for (const k of khung) {
      if (daCo.has(k.id)) continue;
      if (khungDaKetThuc(muc.ngay, k, bayGio)) muc.khungTrong.push({ khung: k });
    }
  }

  return [...nhom.values()].sort((a, b) =>
    a.ngay === b.ngay ? a.locationId.localeCompare(b.locationId) : a.ngay < b.ngay ? 1 : -1,
  );
}

/** Khung của ngày làm việc `ngay` đã kết thúc so với `bayGio` chưa. */
export function khungDaKetThuc(ngay: string, khung: KhungCa, bayGio: Date): boolean {
  const bd = phutTrongNgay(khung.batDau);
  const dai = doDaiKhung(khung);
  if (bd === null) return false;
  const batDau = new Date(`${ngay}T00:00`);
  batDau.setMinutes(batDau.getMinutes() + bd);
  return bayGio.getTime() >= batDau.getTime() + dai * 60_000;
}

/** Tổng tiền mặt lẽ ra còn lại cuối ngày tại một CLB, đi theo chuỗi bàn giao:
    tiền đầu ca đầu tiên cộng tiền mặt bán được của mọi ca. */
export function tienMatCuoiNgayKyVong(ngay: NgayCuaClb): Vnd | null {
  const dau = ngay.matXich[0];
  if (!dau) return null;
  return tienMatKyVong({
    tienDauCa: dau.ca.tienDauCa,
    giaoDich: ngay.matXich.flatMap((m) => m.ca.giaoDich),
  });
}

/** Dấu hiệu sinh ra từ vị trí của ca trong chuỗi — mảng khoá i18n. Khác
    giamSat.ts::chuYCuaCa() vốn soi một ca đứng riêng.

    Lệch bàn giao không có ngưỡng: tiền đầu ca sau khác tiền cuối ca trước thì
    luôn nghĩa là ai đó đếm sai hoặc ai đó cầm đi. */
export function chuYCuaMatXich(m: MatXichCa): string[] {
  const ra: string[] = [];
  if (m.lechBanGiao !== null && m.lechBanGiao !== 0) {
    ra.push('quay.giamSat.chuY.lechBanGiao');
  }
  if (m.chongLanCaTruoc) ra.push('quay.giamSat.chuY.chongLanCa');
  if (m.gioVuotKhung >= GIO_VUOT_KHUNG) ra.push('quay.giamSat.chuY.vuotKhung');
  if (m.khung === null) ra.push('quay.giamSat.chuY.ngoaiKhung');
  return ra;
}

/** Tổng lệch bàn giao trong một ngày tại một CLB, cộng có dấu — trả lời câu
    "hôm nay có đồng nào rơi giữa các ca không". */
export function tongLechBanGiao(ngay: NgayCuaClb): number {
  return ngay.matXich.reduce((tong, m) => tong + (m.lechBanGiao ?? 0), 0);
}
